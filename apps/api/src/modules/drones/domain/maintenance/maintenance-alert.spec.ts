import { DroneStatus } from '@skyops/shared';
import { Drone } from '../../entities/drone.entity';
import { CompositeMaintenancePolicy } from './composite-maintenance.policy';
import { CalendarIntervalPolicy } from './calendar-interval.policy';
import { FlightHoursPolicy } from './flight-hours.policy';
import { isMaintenanceDueSoon } from './maintenance-alert';

describe('isMaintenanceDueSoon', () => {
  const policy = new CompositeMaintenancePolicy([
    new CalendarIntervalPolicy(90),
    new FlightHoursPolicy(50),
  ]);

  const now = new Date('2026-08-01T00:00:00.000Z');
  const MS_PER_DAY = 24 * 60 * 60 * 1000;

  function makeDrone(overrides: Partial<Drone>): Drone {
    const drone = new Drone();
    drone.id = 'id';
    drone.status = DroneStatus.AVAILABLE;
    drone.totalFlightHours = 10;
    drone.flightHoursAtLastMaintenance = 8;
    drone.lastMaintenanceDate = new Date(now.getTime() - 87 * MS_PER_DAY);
    drone.registeredAt = new Date('2026-01-01T00:00:00.000Z');
    drone.nextMaintenanceDueDate = new Date(now.getTime() + 3 * MS_PER_DAY);
    return Object.assign(drone, overrides);
  }

  it('returns true when due date is within 7 days and not yet overdue', () => {
    const drone = makeDrone({});
    expect(isMaintenanceDueSoon(drone, policy, now)).toBe(true);
  });

  it('returns true when due date is exactly on the 7-day horizon', () => {
    const drone = makeDrone({
      nextMaintenanceDueDate: new Date(now.getTime() + 7 * MS_PER_DAY),
    });
    expect(isMaintenanceDueSoon(drone, policy, now)).toBe(true);
  });

  it('returns false when due date is beyond the 7-day window', () => {
    const drone = makeDrone({
      nextMaintenanceDueDate: new Date(now.getTime() + 10 * MS_PER_DAY),
    });
    expect(isMaintenanceDueSoon(drone, policy, now)).toBe(false);
  });

  it('returns false when due date is already in the past', () => {
    const drone = makeDrone({
      nextMaintenanceDueDate: new Date(now.getTime() - 1 * MS_PER_DAY),
    });
    expect(isMaintenanceDueSoon(drone, policy, now)).toBe(false);
  });

  it('returns false when already overdue by flight hours', () => {
    const drone = makeDrone({
      totalFlightHours: 60,
      flightHoursAtLastMaintenance: 0,
      nextMaintenanceDueDate: new Date(now.getTime() + 3 * MS_PER_DAY),
    });
    expect(isMaintenanceDueSoon(drone, policy, now)).toBe(false);
  });

  it('returns false when already overdue by calendar', () => {
    const drone = makeDrone({
      lastMaintenanceDate: new Date(now.getTime() - 120 * MS_PER_DAY),
      nextMaintenanceDueDate: new Date(now.getTime() + 3 * MS_PER_DAY),
    });
    expect(isMaintenanceDueSoon(drone, policy, now)).toBe(false);
  });

  it('returns false when nextMaintenanceDueDate is null', () => {
    const drone = makeDrone({ nextMaintenanceDueDate: null });
    expect(isMaintenanceDueSoon(drone, policy, now)).toBe(false);
  });

  it('returns false for retired drones', () => {
    const drone = makeDrone({ status: DroneStatus.RETIRED });
    expect(isMaintenanceDueSoon(drone, policy, now)).toBe(false);
  });

  it('respects a custom withinDays window', () => {
    const drone = makeDrone({
      nextMaintenanceDueDate: new Date(now.getTime() + 5 * MS_PER_DAY),
    });
    expect(isMaintenanceDueSoon(drone, policy, now, 3)).toBe(false);
    expect(isMaintenanceDueSoon(drone, policy, now, 7)).toBe(true);
  });
});
