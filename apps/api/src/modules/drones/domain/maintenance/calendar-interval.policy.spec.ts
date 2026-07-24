import { CalendarIntervalPolicy } from './calendar-interval.policy';

describe('CalendarIntervalPolicy', () => {
  const policy = new CalendarIntervalPolicy(90);

  it('is not due when the interval has not elapsed', () => {
    const lastMaintenance = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2026-02-01T00:00:00.000Z');

    const result = policy.evaluate(lastMaintenance, now);

    expect(result.isDue).toBe(false);
    expect(result.dueDate?.toISOString()).toBe('2026-04-01T00:00:00.000Z'); // +90 days
  });

  it('is due exactly on the due date', () => {
    const lastMaintenance = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2026-04-01T00:00:00.000Z');

    const result = policy.evaluate(lastMaintenance, now);

    expect(result.isDue).toBe(true);
  });

  it('is due when the interval has been exceeded', () => {
    const lastMaintenance = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2026-05-01T00:00:00.000Z'); // 120 days later

    const result = policy.evaluate(lastMaintenance, now);

    expect(result.isDue).toBe(true);
    expect(result.reason).toContain('90');
  });
});
