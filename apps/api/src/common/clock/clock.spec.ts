import { FixedClock, SystemClock } from './clock';

describe('SystemClock', () => {
  it('returns a date close to the real current time', () => {
    const clock = new SystemClock();
    const before = Date.now();
    const now = clock.now().getTime();
    const after = Date.now();

    expect(now).toBeGreaterThanOrEqual(before);
    expect(now).toBeLessThanOrEqual(after);
  });
});

describe('FixedClock', () => {
  it('always returns the same configured instant', () => {
    const instant = new Date('2026-01-15T10:00:00.000Z');
    const clock = new FixedClock(instant);

    expect(clock.now().toISOString()).toBe('2026-01-15T10:00:00.000Z');
  });

  it('returns a fresh Date object each call (no shared mutation)', () => {
    const clock = new FixedClock(new Date('2026-01-15T10:00:00.000Z'));
    const first = clock.now();
    first.setFullYear(2000);

    expect(clock.now().toISOString()).toBe('2026-01-15T10:00:00.000Z');
  });
});
