import { DroneStatus } from '@skyops/shared';
import { buildStatusBreakdown, totalFromBreakdown } from './fleet-health';
import { DroneModel } from '@skyops/shared';
import { Drone } from 'src/modules/drones/entities/drone.entity';
import { CompositeMaintenancePolicy } from 'src/modules/drones/domain/maintenance/composite-maintenance.policy';
import { CalendarIntervalPolicy } from 'src/modules/drones/domain/maintenance/calendar-interval.policy';
import { FlightHoursPolicy } from 'src/modules/drones/domain/maintenance/flight-hours.policy';
import { filterOverdueDrones } from './fleet-health';

describe('buildStatusBreakdown', () => {
  it('fills all statuses, defaulting missing ones to zero', () => {
    const result = buildStatusBreakdown([
      { status: DroneStatus.AVAILABLE, count: 10 },
      { status: DroneStatus.MAINTENANCE, count: 3 },
    ]);

    expect(result).toEqual({
      AVAILABLE: 10,
      IN_MISSION: 0,
      MAINTENANCE: 3,
      RETIRED: 0,
    });
  });

  it('handles an empty result (no drones)', () => {
    const result = buildStatusBreakdown([]);
    expect(result).toEqual({
      AVAILABLE: 0,
      IN_MISSION: 0,
      MAINTENANCE: 0,
      RETIRED: 0,
    });
  });

  it('maps every provided status', () => {
    const result = buildStatusBreakdown([
      { status: DroneStatus.AVAILABLE, count: 5 },
      { status: DroneStatus.IN_MISSION, count: 4 },
      { status: DroneStatus.MAINTENANCE, count: 2 },
      { status: DroneStatus.RETIRED, count: 1 },
    ]);
    expect(result).toEqual({
      AVAILABLE: 5,
      IN_MISSION: 4,
      MAINTENANCE: 2,
      RETIRED: 1,
    });
  });
});

describe('totalFromBreakdown', () => {
  it('sums all status counts', () => {
    const total = totalFromBreakdown({
      AVAILABLE: 5,
      IN_MISSION: 4,
      MAINTENANCE: 2,
      RETIRED: 1,
    });
    expect(total).toBe(12);
  });

  it('is zero for an empty fleet', () => {
    const total = totalFromBreakdown({
      AVAILABLE: 0,
      IN_MISSION: 0,
      MAINTENANCE: 0,
      RETIRED: 0,
    });
    expect(total).toBe(0);
  });
});

describe('filterOverdueDrones', () => {
  const policy = new CompositeMaintenancePolicy([
    new CalendarIntervalPolicy(90),
    new FlightHoursPolicy(50),
  ]);

  const now = new Date('2026-08-01T00:00:00.000Z');

  function makeDrone(overrides: Partial<Drone>): Drone {
    const drone = new Drone();
    drone.id = 'id';
    drone.status = DroneStatus.AVAILABLE;
    drone.totalFlightHours = 0;
    drone.flightHoursAtLastMaintenance = 0;
    drone.lastMaintenanceDate = null;
    drone.registeredAt = new Date('2026-07-01T00:00:00.000Z'); // 31 days before now
    drone.nextMaintenanceDueDate = null;
    return Object.assign(drone, overrides);
  }

  it('includes a drone overdue by calendar (registered over 90 days ago)', () => {
    const drone = makeDrone({
      registeredAt: new Date('2026-01-01T00:00:00.000Z'),
    });
    const result = filterOverdueDrones([drone], policy, now);
    expect(result).toHaveLength(1);
  });

  it('includes a drone overdue by flight hours (over 50h since maintenance)', () => {
    const drone = makeDrone({
      totalFlightHours: 55,
      flightHoursAtLastMaintenance: 0,
    });
    const result = filterOverdueDrones([drone], policy, now);
    expect(result).toHaveLength(1);
  });

  it('excludes a drone not yet due on either dimension', () => {
    const drone = makeDrone({
      registeredAt: new Date('2026-07-15T00:00:00.000Z'),
      totalFlightHours: 10,
    });
    const result = filterOverdueDrones([drone], policy, now);
    expect(result).toHaveLength(0);
  });

  it('excludes retired drones even if otherwise overdue', () => {
    const drone = makeDrone({
      status: DroneStatus.RETIRED,
      totalFlightHours: 100,
    });
    const result = filterOverdueDrones([drone], policy, now);
    expect(result).toHaveLength(0);
  });

  it('returns only the overdue drones from a mixed list', () => {
    const overdue = makeDrone({ id: 'a', totalFlightHours: 60 });
    const fine = makeDrone({ id: 'b', totalFlightHours: 5 });
    const result = filterOverdueDrones([overdue, fine], policy, now);
    expect(result.map((d: Drone) => d.id)).toEqual(['a']);
  });
});
