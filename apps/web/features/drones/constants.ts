import { DroneStatus } from "@skyops/shared";

export const STATUS_COLORS: Record<DroneStatus, string> = {
  [DroneStatus.AVAILABLE]: "green",
  [DroneStatus.IN_MISSION]: "blue",
  [DroneStatus.MAINTENANCE]: "orange",
  [DroneStatus.RETIRED]: "gray",
};
