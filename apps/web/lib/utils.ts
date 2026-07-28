import dayjs from "dayjs";
import { Drone } from "@/lib/types";
import { DroneStatus } from "@skyops/shared";
import { DATETIME_INPUT_FORMAT } from "./constants";

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

export function humanizeEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function defaultPlannedStart() {
  return dayjs()
    .add(1, "day")
    .hour(9)
    .minute(0)
    .second(0)
    .format("YYYY-MM-DD HH:mm:ss");
}
export function defaultPlannedEnd() {
  return dayjs()
    .add(1, "day")
    .hour(11)
    .minute(0)
    .second(0)
    .format("YYYY-MM-DD HH:mm:ss");
}

export function toDateTimeInput(iso: string): string {
  return dayjs(iso).format(DATETIME_INPUT_FORMAT);
}
export function shiftWindow(
  start: string,
  end: string,
  amount: number,
  unit: "day" | "week",
): { start: string; end: string } {
  return {
    start: dayjs(start).add(amount, unit).format(DATETIME_INPUT_FORMAT),
    end: dayjs(end).add(amount, unit).format(DATETIME_INPUT_FORMAT),
  };
}
