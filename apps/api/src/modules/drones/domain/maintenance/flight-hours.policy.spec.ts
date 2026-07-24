import { FlightHoursPolicy } from './flight-hours.policy';
import { MaintenanceContext } from './maintenance-policy';

describe('FlightHoursPolicy', () => {
  const policy = new FlightHoursPolicy(50);

  const ctx = (flightHoursSinceBaseline: number): MaintenanceContext => ({
    baseline: new Date('2026-01-01T00:00:00.000Z'),
    now: new Date('2026-01-01T00:00:00.000Z'),
    flightHoursSinceBaseline,
  });

  it('is not due below the threshold', () => {
    const result = policy.evaluate(ctx(30));
    expect(result.isDue).toBe(false);
  });

  it('is due exactly at the threshold', () => {
    const result = policy.evaluate(ctx(50));
    expect(result.isDue).toBe(true);
  });

  it('is due above the threshold', () => {
    const result = policy.evaluate(ctx(72.5));
    expect(result.isDue).toBe(true);
    expect(result.reason).toContain('50');
  });

  it('has no calendar due date', () => {
    const result = policy.evaluate(ctx(10));
    expect(result.dueDate).toBeNull();
  });
});
