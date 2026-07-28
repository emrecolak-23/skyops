# Decisions

This is the long-form companion to the README. It records the architectural
decisions I made building SkyOps, the reasoning behind each one, and where it
matters, the alternatives I considered and rejected. The README has the short
version; this is the full account.

---

## Overall shape

### Modular monolith, not microservices

The domain splits cleanly into `drones`, `missions`, `maintenance` and `fleet`.
Each is its own NestJS module with clear boundaries, but the whole thing deploys
as a single service.

Microservices would add network hops, distributed transactions and operational
overhead that a fleet of this size doesn't justify. The module boundaries are
real, though, so if part of this ever needed to scale independently it could be
extracted without rewriting the domain. I get the separation of concerns now and
keep the option open for later without paying for it today.

### pnpm monorepo with a shared package

The backend and frontend live in one repo with a small `@skyops/shared` package
holding the enums both sides use: drone status, mission status, maintenance type,
and so on. A drone being `AVAILABLE` means the exact same thing on the server and
in the browser, because it's literally the same definition. There's no drift
between two hand-maintained copies.

The shared package builds to CommonJS. That created some friction with Next.js's
bundler (more on that under Docker), but the payoff of one source of truth for
the vocabulary of the domain was worth it.

---

## Domain and data

### Business rules live in a pure domain layer

Things like "is this drone due for maintenance", "do these two missions overlap"
and "is this a legal state transition" are pure functions with no dependency on
the database or NestJS. Services orchestrate, the domain decides.

This is what makes the rules unit-testable without a database, and it keeps the
interesting logic in one place instead of scattered through controllers and query
builders.

### Repository pattern with explicit queries

Each aggregate has a repository interface, an in-memory implementation used in
unit tests, and a TypeORM implementation. Queries are written explicitly rather
than leaning on lazy loading or magic, so it's always obvious what touches the
database.

The in-memory implementation isn't only for tests. It forced the interface to
stay honest, because anything the interface exposes has to be implementable
without a database.

### maintenanceDue is computed, not stored

Whether a drone is due for maintenance depends on today's date and its current
flight hours. It can go stale the moment you write it down, so storing it as a
column would mean either constant recalculation or serving wrong answers. I
compute it at read time from the maintenance policy.

I do store `nextMaintenanceDueDate`, but only the calendar half of the rule. The
flight-hours half can't be reduced to a date, because it depends on how fast the
drone actually flies, which I can't predict. So the stored date is a hint for the
calendar dimension, and the real answer to "is it due" always runs the full
policy.

### Maintenance is a process, not a timestamp

The brief mentions recording the date a maintenance was performed, but it also
describes a drone being "under maintenance" for a period. Those pull in slightly
different directions, a single date versus a span of time. I reconciled them into
one model: a maintenance log has `startedAt` and `completedAt`, both set by the
system.

Opening a log sets `startedAt` to now and moves the drone to `MAINTENANCE`.
Completing it sets `completedAt` to now, moves the drone back to `AVAILABLE`, and
updates its maintenance tracking (last date, next due date, flight hours at last
maintenance). The technician never types a date.

This satisfies both readings of the brief. There's a recorded time, and there's a
duration during which the drone is out of service. I originally had a single
`performedAt` field and replaced it once this tension became clear.

### "Whichever comes first" for the maintenance threshold

A drone is due when either 90 days have passed since its last maintenance or it
has flown 50 hours since then, whichever happens first. Both the drone view and
the fleet-health overdue list honour both dimensions.

I could have checked only the calendar side, which is indexed and cheaper. I
chose not to. At this fleet size the performance difference isn't measurable, and
checking only the calendar would quietly break the rule for a drone that flew a
lot in a short time. I'd rather be correct than win something I can't even
measure.

### Maintenance thresholds are configuration

The 90 days and 50 hours intervals, and the tolerance used when validating a
flight hours reading, are environment variables read through a config abstraction
rather than hardcoded.

At a larger scale these would move to a database backed, per model configuration
with an admin UI and an audit trail, since different drone models wear
differently. The important part is that the policy code wouldn't change when that
happens, because it already reads the values through an abstraction. That's the
payoff of the indirection: how the config is stored can change without touching
the rule that consumes it.

---

## Missions and concurrency

### A drone only needs to be AVAILABLE at start, not at planning

You can schedule a mission for a drone that's currently flying another one,
because the new mission is in the future. The `AVAILABLE` check happens when the
mission actually starts, not when it's planned. This matches how fleet planning
works in practice, where you book ahead.

### Maintenance due is re-checked at start, not only at creation

A mission can be planned while the drone is healthy and still fail to start if
maintenance becomes due in the meantime for example after another mission
completes and pushes flight hours over the threshold, or after a calendar
interval elapses.

The check lives in `StartMissionTransition`, with `maintenanceDue` computed in
the service and passed through the transition context. Pre-flight does not repeat
the guard: the invariant is "this drone must not take off while maintenance is
due", and takeoff is the start transition. Keeping the guard there also handles
the case where maintenance status changes between pre-flight and start.

This is intentionally stricter than "warn but allow planning ahead". Create and
reschedule still reject drones that are already in `MAINTENANCE` or already
overdue. The start guard catches the gap between a valid plan and an invalid
launch.

### Rescheduling is a domain operation, not a generic mission update

When a drone goes into maintenance, a mission that was already planned or in
pre-flight may need new dates or a different drone. That is not a CRUD edit; it
is the same scheduling decision as create, applied to an existing mission.

So the API exposes `PATCH /missions/:id/reschedule` with `plannedStart`,
`plannedEnd`, and optional `droneId`. It reuses the same window and drone
scheduling guards as create. Overlap detection passes `excludeMissionId` so the
mission does not conflict with itself. Only `PLANNED` and `PRE_FLIGHT_CHECK`
missions are reschedulable.

The same reasoning as drone update applies: a general-purpose PATCH on missions
would let a caller set `status`, `actualStart`, or `flightHoursLogged` and
bypass the state machine. Named workflows keep the CRUD surface honest.

There's one exception. You can't plan a mission for a drone whose maintenance is
already overdue. That's guarded at creation, because sending a known overdue
drone out is a safety issue rather than a scheduling one.

### Defense in depth against overlapping missions

A drone can't be in two active missions at overlapping times. This is enforced
three ways.

First, a pessimistic lock on the drone row while the overlap is checked, so two
concurrent requests can't both read "no overlap" and both write. Second, an
application level overlap check in the domain, which gives a clean, typed error.
Third, a Postgres exclusion constraint `btree_gist` over the drone and the
mission time range as the final backstop at the database level.

Any one of these would usually be enough. Together they mean a conflicting
mission can't slip through even under a race condition, and the database itself
guarantees the invariant regardless of what the application does. The application
check gives good error messages; the constraint guarantees correctness.

One gotcha worth recording: because TypeORM regenerates the exclusion constraint
as a DROP on every `migration:generate`, generated migrations had to be
hand edited to remove those DROP lines.

### Business rules are enforced in services, not NestJS guards

Scheduling guards — retired drone, maintenance status, maintenance due, overlap
live in the service layer and in transition classes, not in NestJS HTTP guards.
Guards are for access control: who is allowed to call this endpoint. Domain rules
are about whether the operation is valid given the state of the world. Create,
reschedule, and transitions share helpers where the rule is the same, so the
policy does not drift between entry points.

### Avoiding N+1 when showing a drone's serial on a mission

A mission response includes the drone's serial number. Rather than fetch the
mission and then make a second request per mission for its drone, which is the
classic N+1 problem and would be 20 extra queries on a 20 rows list, the
repository joins the drone in the same query. It's an `innerJoin`, because the
relation is mandatory and a left join would be semantically wrong, with an
`addSelect` for just the columns the response actually uses rather than pulling
the whole drone object.

At this scale the join is close to free: one row joined to one row over an
indexed foreign key. Denormalising the serial onto the mission table was an
option, but that duplicates data and risks it going stale, and the join isn't a
bottleneck, so it would be optimising something that isn't slow.

---

## Fleet health

### Aggregate in the database, don't pull rows into memory

Fleet health (status breakdown, average flight hours, upcoming missions, overdue
drones) is computed with `GROUP BY`, `COUNT` and `AVG` in Postgres, not by
loading the fleet into memory and counting in JavaScript. The database is built
for this.

I considered a materialized view and rejected it. At around 150 drones it's
over engineering. A materialized view earns its keep when aggregation is
genuinely expensive and staleness is acceptable, whereas here the live query is
fast and the numbers should be current.

The overdue list is the one part that can't be a pure SQL aggregate, because
"overdue" runs the full calendar-and-flight-hours policy. So those drones are
loaded, excluding retired ones, and filtered through the policy. It's the same
correctness over cleverness call as before.

---

## Deleting and updating drones

### Delete means retire

Drones accumulate mission and maintenance history that shouldn't vanish, and a
foreign key would block a hard delete anyway. So `DELETE /drones/:id` sets the
status to `RETIRED`. The history stays, and the drone just can't take new
missions.

### Update only touches notes

A general purpose update endpoint would let a caller set status or serial number
directly and bypass the state machine. Drones change status through workflows,
meaning missions and maintenance, not through edits. So the update endpoint
accepts a free text `notes` field and nothing else. This keeps the CRUD surface
the brief asks for without opening a hole in the domain invariants.

---

## Seeding

### Seed through the DI container, using the repositories and the real policy

The seed script boots a minimal Nest application context and pulls the
repositories and the maintenance policy out of DI, rather than hand rolling a raw
`DataSource` and re deriving due dates. That way the seed computes maintenance
dates through the same policy the app uses, with no second, drifting copy of the
rule.

It writes through the repositories rather than the services, though, because the
seed deliberately needs to create states the services would reject: past
completed missions, drones that are already overdue. The seed builds scenarios,
the services enforce rules, and those are different jobs.

Faker generates the cosmetic parts (names, locations, notes) deterministically
via a fixed seed, while serial numbers are generated deterministically and
uniquely in the required format. The seed is idempotent, since it truncates and
rebuilds, so running it twice is safe.

---

## Testing

### Three layers, each doing what the others can't

Backend unit tests cover the domain in isolation: the maintenance policy, the
mission state machine, overlap detection, serial validation. No database, fast to
run.

Backend integration tests use Testcontainers to run against a real PostgreSQL,
covering the things unit tests can't: transaction atomicity, the exclusion
constraint, the full maintenance lifecycle. The job listing explicitly wanted
black-box E2E against real Docker environments, and Testcontainers is exactly
that at the API level.

Frontend unit tests cover the pure helpers: flight-hours formatting, enum
humanising, and drone assignability, which mirrors the backend guards and so is
worth pinning down.

End-to-end tests with Playwright drive a real browser through the two main flows:
create a drone and run a mission through its full lifecycle, and open and complete
maintenance.

I deliberately didn't write component level frontend tests. The E2E suite already
exercises component behaviour end to end, so duplicating that at the component
level would be effort without much added confidence. The unit tests target pure
logic, where they're cheap and precise. That's the test pyramid working as
intended rather than testing for its own sake.

### E2E lives at the repo root, not inside apps/web

E2E tests exercise the whole system, with frontend, backend and database together,
black-box. They aren't a test of the frontend; they drive the frontend but assert
on the whole stack. So they live in a top level `e2e` package sitting next to
`docker-compose.yml`, since both are system level concerns. Putting them inside
`apps/web` would imply they belong to the frontend, which understates what they
cover.

---

## Frontend

### Feature-based, mirroring the backend

The frontend is organised by feature, with `features/drones`, `features/missions`,
`features/maintenance` and `features/fleet`, each holding its own hooks,
components, API calls and types. This parallels the backend's module structure.
Domain agnostic infrastructure like the axios client and formatting helpers lives
in `lib/`, which is the frontend equivalent of the backend's `common`. The
criterion for what goes where is the same on both sides: feature specific, or
domain agnostic.

### Pages are thin orchestrators

Next.js `app/` pages fetch data and lay out components, and the actual work lives
in feature components. A drone detail page composes a header, info cards, mission
history and maintenance history, each self contained and each fetching its own
data where it needs to. This is the controller/service split from the backend
applied to the frontend: the page is a thin controller, the components do the
work.

Feature organisation and routing are kept separate, too. Fleet doesn't have its
own route, because it is the dashboard. Maintenance doesn't have its own page; its
components are embedded in the drone detail view and the dashboard. A feature is a
place where code lives, not necessarily a screen.

### Server state in React Query, no global client store

Almost all of the app's state is data from the backend: drones, missions, fleet
health. React Query handles that, with caching, loading and error states, and
invalidation after mutations. Completing a mission invalidates the mission, drone
and fleet health queries, and everything refreshes on its own.

What's left, an open modal or a selected filter, is either local `useState` or URL
search params. There was no meaningful global client state to justify Redux or
Zustand. Putting server state in a global store is a common mistake that brings
synchronisation problems React Query already solves. If real global client state
had shown up I'd have reached for something lightweight like Zustand before Redux,
but it didn't, so adding one would have been overhead.

### Reschedule on the mission detail page

When a mission is still `PLANNED` or `PRE_FLIGHT_CHECK`, the detail page shows a
Reschedule action alongside the state machine transitions from `availableActions`.
Reschedule is not part of `availableActions` because it is not a status
transition; it is a separate workflow endpoint.

The modal lets the operator shift the planned window (+1 day, +3 days, +1 week),
reset to the current values, and optionally assign a different drone. Save and
Reset stay disabled until something actually changes. If the selected drone is
in maintenance or otherwise unassignable, the modal shows a blocking alert and
disables save the same drone cannot be kept on the same dates while it is in
maintenance, because reschedule uses the same guards as create.

A separate alert on the detail page loads the assigned drone and warns when start
would fail, so the operator sees the problem before clicking Start Mission.

### Data driven rendering over repeated conditionals

Mission actions are rendered from the backend's `availableActions` list against a
small config object, rather than a chain of `if (actions.includes(...))` blocks.
The backend is the single source of truth for which transitions are legal, and
the frontend just renders the allowed ones. Adding a transition is a line of
config, not new JSX.

I applied this where it earned its keep, in conditional rendering with differing
behaviour, and left simpler fixed lists as plain markup. Turning every repetition
into an abstraction is as much a mistake as repeating yourself. The trigger is
genuine variation, not mere repetition.

### Showing all drones in the mission form, disabling the unassignable ones

When picking a drone for a new mission, the form shows every drone but disables
the ones that can't be assigned (retired, in maintenance, or overdue) and labels
why. Drones already on a mission stay selectable but are labelled, because future
scheduling is allowed. This is more transparent than hiding them, since the user
sees why a drone isn't available rather than just not finding it. The
assignability logic mirrors the backend guards, and the backend stays the final
authority. The frontend filter is a convenience, not the enforcement.

### Mantine and flight hours formatting

I chose Mantine to move quickly through the UI, which the brief treats as lower
priority than the backend. Flight hours are shown as `Xh Ym` rather than a
decimal, because a decimal like 2.5 hours is harder for an operator to read at a
glance than "2h 30m".

---

## Infrastructure

### Migrations run on startup in production, via the CLI in development

In development, migrations run through the TypeORM CLI (`migration:run`), which
uses ts-node and the TypeScript sources. In production, including in Docker, that
CLI path hit an ESM/CommonJS mismatch with the compiled output. Rather than fight
it, the application runs migrations itself on startup when `NODE_ENV=production`,
using `migrationsRun` with the compiled migration files. Same runtime, same module
system, no CLI. The Docker command is then just `node dist/main.js`, and the
schema is ready before the app serves requests.

### Multi stage Docker builds, monorepo-aware

Both Dockerfiles build from the repo root so they can see the shared package, and
use multi stage builds: a dependency stage for cache friendly installs, a build
stage that compiles shared and the app, and a slim production stage with only the
compiled output and production dependencies. The frontend uses Next.js's
`standalone` output to keep the final image small.

`NEXT_PUBLIC_API_URL` is baked in at build time and points at `localhost:3001`
rather than the Docker service name, because the fetch runs in the browser on the
host, not inside the container network. This is an easy thing to get wrong.

Faker had to move from dev to production dependencies so the seed can run inside
the container. In a stricter production setup the seed would live in a separate
tooling image rather than shipping Faker with the app.

### Graceful shutdown

The app enables shutdown hooks so it closes the database pool cleanly on
`SIGTERM`, which matters when Docker stops the container.

### Two layers of quality gates: git hooks and CI

Locally, Husky runs lint on pre-commit and build plus unit tests on pre-push, and
commitlint enforces Conventional Commits. Integration tests are deliberately kept
out of the hooks, since Testcontainers is too slow to run on every push. CI is the
full gate: lint, build, unit and integration tests for the backend, and lint, unit
tests and build for the frontend, running as parallel jobs. Hooks give fast local
feedback, and CI is the real guarantee, since hooks can be bypassed.

### Security headers and CORS

CORS is environment aware. In development it allows the frontend origin
(`localhost:3000`), and in production it reads an allowlist from `CORS_ORIGIN`,
defaulting to allowing nothing if that's unset, which is a safe default. Helmet
sets the standard security headers on the API. XSS is more of a frontend concern,
since the API returns JSON rather than HTML, so a full Content-Security-Policy
would belong on the Next.js side. That's noted as follow up rather than done.

---

## Deliberately left as future work

These are things I'd add in a real production system but scoped out here, on
purpose, to keep the surface area matched to the brief.

Authentication and role based access. The brief didn't ask for it, and the code is
structured so it would slot in as NestJS guards without touching the business
rules.

A mission status audit trail. The detail view shows the current status; a full
history of transitions with timestamps would need a separate history table written
on each transition. It's valuable in production but out of scope here.

Per model, database backed maintenance configuration with an admin UI and audit
trail, replacing the environment variables.

A Content-Security-Policy on the frontend, and running the E2E suite in CI against
the Docker Compose environment.
