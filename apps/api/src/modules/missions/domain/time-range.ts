export function rangesOverlap(
  start1: Date,
  end1: Date,
  start2: Date,
  end2: Date,
): boolean {
  return start1.getTime() < end2.getTime() && start2.getTime() < end1.getTime();
}
