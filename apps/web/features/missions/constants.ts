import { MissionStatus } from "@skyops/shared";

export const STATUS_COLORS: Record<MissionStatus, string> = {
  [MissionStatus.PLANNED]: "blue",
  [MissionStatus.PRE_FLIGHT_CHECK]: "cyan",
  [MissionStatus.IN_PROGRESS]: "indigo",
  [MissionStatus.COMPLETED]: "green",
  [MissionStatus.ABORTED]: "red",
};
