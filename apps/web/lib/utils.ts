export function formatFlightHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function formatDate(date: string | null): string {
  return date ? new Date(date).toLocaleDateString() : "—";
}
