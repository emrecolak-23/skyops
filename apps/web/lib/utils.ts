import { Drone } from "@/lib/types";
import { DroneStatus } from "@skyops/shared";

export function formatFlightHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function formatDate(date: string | null): string {
  return date ? new Date(date).toLocaleDateString() : "—";
}

export function formatDuration(start: string, end: string): string {
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const totalMinutes = Math.round(ms / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
}

export function isAssignableForMission(drone: Drone): boolean {
  const statusOk =
    drone.status === DroneStatus.AVAILABLE ||
    drone.status === DroneStatus.IN_MISSION;
  return statusOk && !drone.maintenanceDue;
}

export function assignabilityReason(drone: Drone): string | null {
  if (drone.status === DroneStatus.RETIRED) return "retired";
  if (drone.status === DroneStatus.MAINTENANCE) return "in maintenance";
  if (drone.maintenanceDue) return "maintenance due";
  if (drone.status === DroneStatus.IN_MISSION) return "on mission";
  return null;
}
