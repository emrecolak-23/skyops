import { isFlightHoursConsistent } from './flight-hours-consistency';

describe('isFlightHoursConsistent', () => {
  const tolerance = 1.0;

  it('accepts an exact match', () => {
    expect(isFlightHoursConsistent(100, 100, tolerance)).toBe(true);
  });

  it('accepts a value within tolerance (below)', () => {
    expect(isFlightHoursConsistent(99.5, 100, tolerance)).toBe(true);
  });

  it('accepts a value within tolerance (above)', () => {
    expect(isFlightHoursConsistent(100.5, 100, tolerance)).toBe(true);
  });

  it('accepts a value exactly at the tolerance boundary', () => {
    expect(isFlightHoursConsistent(101, 100, tolerance)).toBe(true);
  });

  it('rejects a value beyond tolerance', () => {
    expect(isFlightHoursConsistent(105, 100, tolerance)).toBe(false);
  });

  it('rejects a value far below the actual total', () => {
    expect(isFlightHoursConsistent(50, 100, tolerance)).toBe(false);
  });
});
