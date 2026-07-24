import { CompositeMaintenancePolicy } from './composite-maintenance.policy';
import { CalendarIntervalPolicy } from './calendar-interval.policy';
import { FlightHoursPolicy } from './flight-hours.policy';
import { MaintenanceContext } from './maintenance-policy';

describe('CompositeMaintenancePolicy', () => {
  const policy = new CompositeMaintenancePolicy([
    new CalendarIntervalPolicy(90),
    new FlightHoursPolicy(50),
  ]);

  const ctx = (
    baseline: string,
    now: string,
    flightHoursSinceBaseline: number,
  ): MaintenanceContext => ({
    baseline: new Date(baseline),
    now: new Date(now),
    flightHoursSinceBaseline,
  });

  it('is not due when neither rule is triggered', () => {
    // 30 days elapsed, 20 flight hours — both below thresholds
    const result = policy.evaluate(ctx('2026-01-01', '2026-01-31', 20));
    expect(result.isDue).toBe(false);
  });

  it('is due when only the calendar rule is triggered', () => {
    // 120 days elapsed, but only 10 flight hours
    const result = policy.evaluate(ctx('2026-01-01', '2026-05-01', 10));
    expect(result.isDue).toBe(true);
    expect(result.reason).toContain('90');
  });

  it('is due when only the flight-hours rule is triggered', () => {
    // 30 days elapsed, but 60 flight hours
    const result = policy.evaluate(ctx('2026-01-01', '2026-01-31', 60));
    expect(result.isDue).toBe(true);
    expect(result.reason).toContain('50');
  });

  it('is due when both rules are triggered', () => {
    // 120 days AND 60 flight hours
    const result = policy.evaluate(ctx('2026-01-01', '2026-05-01', 60));
    expect(result.isDue).toBe(true);
  });

  it('always exposes the calendar due date regardless of which rule triggered', () => {
    const result = policy.evaluate(ctx('2026-01-01', '2026-01-31', 60));
    // flight-hours triggered, but dueDate should still come from the calendar rule
    expect(result.dueDate?.toISOString()).toBe('2026-04-01T00:00:00.000Z'); // 2026-01-01 + 90 days
  });
});
