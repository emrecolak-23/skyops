# SkyOps Mission Control

A drone fleet management system for planning missions and keeping aircraft airworthy. It's a NestJS backend and a Next.js frontend in a single pnpm monorepo, backed by PostgreSQL.

The system tracks a fleet of drones, schedules inspection missions, and manages maintenance. The interesting part isn't the CRUD it's the rules that keep the two in sync: a drone can't fly two missions at once, a drone that's due for maintenance shouldn't be sent out, and completing a mission might be exactly what pushes a drone past its maintenance threshold. Those rules live in the backend and are enforced there, not just in the UI.

## Tech stack

- **Backend** NestJS, TypeORM, PostgreSQL 16
- **Frontend** Next.js (App Router), React Query, Mantine
- **Shared** a small `@skyops/shared` package with the enums both sides use, so a drone status means the same thing on the server and in the browser
- **Tooling** pnpm workspaces, Docker Compose, GitHub Actions, Playwright, Vitest, Jest + Testcontainers

## Repository layout

```
skyops-mission-control/
├── apps/
│   ├── api/          # NestJS backend
│   └── web/          # Next.js frontend
├── packages/
│   └── shared/       # shared enums (built to CommonJS, consumed by both apps)
├── e2e/              # Playwright end-to-end tests (system level, black-box)
└── docker-compose.yml
```

The backend is organised by domain `drones`, `missions`, `maintenance`, `fleet` each with its own module, entities, services and repositories. The frontend mirrors that with a `features/` folder, so a given piece of the product lives in one place on both sides.

## Quick start with Docker

The fastest way to see the whole thing running. You need Docker and Docker Compose.

```bash
# build and start postgres, api and web
docker compose up --build

# in another terminal, load sample data (22 drones with missions and maintenance logs)
docker compose exec api node dist/database/seeds/seed.js
```

Then open:

- **Frontend** http://localhost:3000
- **API** http://localhost:3001/api/fleet/health

Migrations run automatically when the API container starts, so the schema is ready before the app accepts requests. The seed step is separate and optional without it you get an empty fleet you can populate from the UI.

To start over with a clean database:

```bash
docker compose down -v   # -v also removes the postgres volume
docker compose up --build
```

## Local development

If you'd rather run the apps directly (faster feedback while developing), you need Node 22 and pnpm 10.

```bash
# install everything
pnpm install

# copy the env templates and adjust if needed
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# start postgres in a container (the apps run on the host)
pnpm db:up

# apply migrations
pnpm --filter @skyops/api migration:run

# load sample data
pnpm --filter @skyops/api seed
```

Then run the two apps in separate terminals:

```bash
# backend on :3001
pnpm --filter @skyops/api start:dev

# frontend on :3000
pnpm --filter web dev
```

Postgres runs on port **5433** on the host to avoid clashing with a local Postgres on 5432.

## Environment variables

Both apps ship an `.env.example`. Every backend variable has a sensible default, so an empty `.env` still works for local development the templates exist to document what's available.

**Backend (`apps/api/.env.example`)**

| Variable                            | Default                                          | Purpose                                                                 |
| ----------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| `DATABASE_URL`                      | `postgres://skyops:skyops@localhost:5433/skyops` | Postgres connection string                                              |
| `NODE_ENV`                          | `development`                                    | `development` or `production`; in production, migrations run on startup |
| `PORT`                              | `3001`                                           | Port the API listens on                                                 |
| `API_PREFIX`                        | `api`                                            | Prefix for all routes                                                   |
| `MAINTENANCE_INTERVAL_DAYS`         | `90`                                             | Calendar side of the maintenance rule                                   |
| `MAINTENANCE_INTERVAL_FLIGHT_HOURS` | `50`                                             | Flight-hours side of the maintenance rule                               |

| `MAINTENANCE_TOLERANCE_HOURS` | `1` | Allowed slack when validating the flight-hours reading at maintenance time |
| `CORS_ORIGIN` | _(unset in dev)_ | Comma-separated browser origins allowed in production; required for Docker Compose |

**Frontend (`apps/web/.env.example`)**

| Variable              | Default                     | Purpose                                                  |
| --------------------- | --------------------------- | -------------------------------------------------------- |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3001/api` | API base URL, baked into the client bundle at build time |

## Testing

There are three layers, each doing something the others can't.

**Backend unit tests** cover the domain logic in isolation the maintenance policy, the mission state machine, serial-number validation, overlap detection. No database, fast to run.

```bash
pnpm --filter @skyops/api test
```

**Backend integration tests** use Testcontainers to spin up a real PostgreSQL and check the things that only show up against a real database: transaction atomicity, the exclusion constraint that prevents overlapping missions, and the full maintenance lifecycle. They need Docker running.

```bash
pnpm --filter @skyops/api test:e2e
```

**Frontend unit tests** cover the pure helpers flight hours formatting, enum humanising, and the drone assignability rules that mirror the backend guards.

```bash
pnpm --filter web test
```

**End-to-end tests** drive a real browser against the running system, black-box. They cover creating a drone and running a mission through its lifecycle, opening and completing maintenance, and rescheduling a mission when its drone goes into maintenance. The system (frontend + backend + database) needs to be up first.

```bash
# with the apps running (locally or via Docker):
pnpm --filter @skyops/e2e test
```

## Architecture notes

**A modular monolith, not microservices.** The domain is split into modules with clear boundaries, but it deploys as one service. For a fleet of this size that's the right call the module boundaries mean it could be split later if it ever needed to be, but doing that now would add operational cost for no benefit.

**Business rules live in the domain layer.** Things like "is this drone due for maintenance" or "do these two missions overlap" are pure functions, decoupled from the database and from NestJS. The services orchestrate; the domain decides. This is what makes the rules testable without a database.

**The repository pattern with explicit queries.** Each aggregate has a repository interface with an in memory implementation (for unit tests) and a TypeORM one. Queries are written explicitly rather than relying on lazy loading, so it's always clear what hits the database.

**Defense in depth for overlapping missions.** A drone can't be double booked, and that's enforced three ways: a pessimistic lock while checking, an application level overlap check, and a Postgres exclusion constraint (`btree_gist`) as the final backstop. Even a race condition can't slip a conflicting mission through.

**The frontend keeps server state in React Query, not a global store.** Almost all of the app's state is data from the backend, and React Query already handles caching, refetching and invalidation for it. There was no real client side global state to justify Redux or Zustand, so I didn't add one.

## Assumptions and decisions

The brief left some things open. Here's how I read them and why.

**Maintenance is a process with a start and an end.** The brief mentions recording the date a maintenance was performed, but it also talks about a drone being under maintenance for a period. I treated these as one consistent requirement rather than two: a maintenance log has a `startedAt` and a `completedAt`, both set by the system. While a log is open the drone is `MAINTENANCE`; completing it returns the drone to `AVAILABLE` and updates its maintenance tracking. The technician doesn't type dates the system stamps them.

**"Due for maintenance" is calculated, not stored as a flag.** Whether a drone is due depends on the current date and its flight hours, so it can go stale the moment it's written. I compute it at read time from the policy. What I _do_ store is `nextMaintenanceDueDate`, but only the calendar part the flight hours side can't be reduced to a date because it depends on how fast the drone actually flies.

**"Whichever comes first" for the maintenance threshold.** A drone is due when either 90 days have passed since its last maintenance _or_ it has flown 50 hours since then, whichever happens first. The fleet health overdue list honours both. I chose correctness over the small performance win of checking only the calendar side at this fleet size the difference isn't measurable, and dropping the flight hours check would quietly break the rule.

**A mission only requires an `AVAILABLE` drone at start, not at planning.** You can schedule a mission for a drone that's currently on another mission, because the new one is in the future. The `AVAILABLE` and maintenance due checks at **start** catch the case where maintenance became due after the mission was planned. You can't create or reschedule a mission for a drone that is retired, in maintenance, or already overdue those guards run at scheduling time too.

**Deleting a drone means retiring it.** Drones accumulate mission and maintenance history that shouldn't just disappear, and a foreign key would block a hard delete anyway. So `DELETE /drones/:id` sets the status to `RETIRED`. A retired drone keeps its history but can't take new missions.

**Rescheduling is a named workflow, not a generic PATCH.** `PATCH /missions/:id/reschedule` accepts new `plannedStart`, `plannedEnd`, and an optional `droneId`. It re-runs the same scheduling guards as create and excludes the mission itself from overlap detection. Only `PLANNED` and `PRE_FLIGHT_CHECK` missions can be rescheduled. A generic update endpoint would let callers bypass the state machine by setting `status` directly.

**Updating a drone only touches its notes.** A general purpose update endpoint would let you change status or serial number and bypass the state machine. Drones change status through workflows (missions, maintenance), not through edits. So the update endpoint accepts a free text `notes` field and nothing else.

**Maintenance thresholds are configuration, not code.** The 90 day and 50 hours intervals are environment variables. At a larger scale these would move to a database backed, per model configuration with an admin UI and an audit trail but the policy code wouldn't change, because it already reads the values through an abstraction rather than hardcoding them.

**Mission status history is noted as future work, not built.** The mission detail view shows the current status. A full audit trail every transition with a timestamp would need a separate history table written on each transition. It's worth having in production, but it's outside the brief's scope, so I left it as a deliberate note rather than expanding the surface area.

**There's no authentication.** The brief didn't ask for it and it's a large surface to add well. The code is structured so that access control would slot in as NestJS guards without touching the business rules.

## What I'd do next

- Restrict CORS and add authentication / role based access
- Add the mission status audit trail described above
- Move maintenance configuration to a database with a per model policy and an admin UI
- Run the E2E suite in CI against the Docker Compose environment
