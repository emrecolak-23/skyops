import { rangesOverlap } from './time-range';

describe('rangesOverlap', () => {
  const d = (iso: string) => new Date(iso);

  it('detects fully overlapping ranges', () => {
    // A: 14:00-16:00, B: 15:00-17:00
    expect(
      rangesOverlap(
        d('2026-01-01T14:00:00Z'),
        d('2026-01-01T16:00:00Z'),
        d('2026-01-01T15:00:00Z'),
        d('2026-01-01T17:00:00Z'),
      ),
    );
  });

  it('detects one range fully inside another', () => {
    // A: 14:00-18:00, B: 15:00-16:00 (B inside A)
    expect(
      rangesOverlap(
        d('2026-01-01T14:00:00Z'),
        d('2026-01-01T18:00:00Z'),
        d('2026-01-01T15:00:00Z'),
        d('2026-01-01T16:00:00Z'),
      ),
    ).toBe(true);
  });

  it('detects identical ranges', () => {
    expect(
      rangesOverlap(
        d('2026-01-01T14:00:00Z'),
        d('2026-01-01T16:00:00Z'),
        d('2026-01-01T14:00:00Z'),
        d('2026-01-01T16:00:00Z'),
      ),
    ).toBe(true);
  });

  it('does not count adjacent ranges as overlapping (A ends when B starts)', () => {
    // A: 14:00-16:00, B: 16:00-18:00 — touching but not overlapping
    expect(
      rangesOverlap(
        d('2026-01-01T14:00:00Z'),
        d('2026-01-01T16:00:00Z'),
        d('2026-01-01T16:00:00Z'),
        d('2026-01-01T18:00:00Z'),
      ),
    ).toBe(false);
  });

  it('does not count fully separate ranges as overlapping', () => {
    // A: 14:00-15:00, B: 16:00-17:00
    expect(
      rangesOverlap(
        d('2026-01-01T14:00:00Z'),
        d('2026-01-01T15:00:00Z'),
        d('2026-01-01T16:00:00Z'),
        d('2026-01-01T17:00:00Z'),
      ),
    ).toBe(false);
  });

  it('is symmetric — order of ranges does not matter', () => {
    const a1 = d('2026-01-01T14:00:00Z');
    const a2 = d('2026-01-01T16:00:00Z');
    const b1 = d('2026-01-01T15:00:00Z');
    const b2 = d('2026-01-01T17:00:00Z');
    expect(rangesOverlap(a1, a2, b1, b2)).toBe(rangesOverlap(b1, b2, a1, a2));
  });
});
