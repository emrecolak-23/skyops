import { CalendarIntervalPolicy } from './calendar-interval.policy';
import { MaintenanceContext } from './maintenance-policy';

describe('CalendarIntervalPolicy', () => {
  const policy = new CalendarIntervalPolicy(90);

  const ctx = (baseline: string, now: string): MaintenanceContext => ({
    baseline: new Date(baseline),
    now: new Date(now),
    flightHoursSinceBaseline: 0, // irrelevant for calendar policy
  });

  it('is not due when the interval has not elapsed', () => {
    const result = policy.evaluate(
      ctx('2026-01-01T00:00:00.000Z', '2026-02-01T00:00:00.000Z'),
    );
    expect(result.isDue).toBe(false);
    expect(result.dueDate?.toISOString()).toBe('2026-04-01T00:00:00.000Z');
  });

  it('is due exactly on the due date', () => {
    const result = policy.evaluate(
      ctx('2026-01-01T00:00:00.000Z', '2026-04-01T00:00:00.000Z'),
    );
    expect(result.isDue).toBe(true);
  });

  it('is due when the interval has been exceeded', () => {
    const result = policy.evaluate(
      ctx('2026-01-01T00:00:00.000Z', '2026-05-01T00:00:00.000Z'),
    );
    expect(result.isDue).toBe(true);
    expect(result.reason).toContain('90');
  });
});
