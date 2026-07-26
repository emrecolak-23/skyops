export function isFlightHoursConsistent(
  recordedHours: number,
  actualTotalHours: number,
  toleranceHours: number,
): boolean {
  return Math.abs(recordedHours - actualTotalHours) <= toleranceHours;
}
