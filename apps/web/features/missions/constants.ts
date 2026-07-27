import { MissionStatus, MissionType } from "@skyops/shared";

export const STATUS_COLORS: Record<MissionStatus, string> = {
  [MissionStatus.PLANNED]: "blue",
  [MissionStatus.PRE_FLIGHT_CHECK]: "cyan",
  [MissionStatus.IN_PROGRESS]: "indigo",
  [MissionStatus.COMPLETED]: "green",
  [MissionStatus.ABORTED]: "red",
};

export const ACTION_CONFIG: Record<
  string,
  {
    label: string;
    color?: string;
    needsModal?: "complete" | "abort";
    action?: "pre-flight" | "start";
  }
> = {
  [MissionStatus.PRE_FLIGHT_CHECK]: {
    label: "Start Pre-Flight",
    action: "pre-flight",
  },
  [MissionStatus.IN_PROGRESS]: {
    label: "Start Mission",
    color: "indigo",
    action: "start",
  },
  [MissionStatus.COMPLETED]: {
    label: "Complete",
    color: "green",
    needsModal: "complete",
  },
  [MissionStatus.ABORTED]: {
    label: "Abort",
    color: "red",
    needsModal: "abort",
  },
};

export const MISSION_TYPES = [
  {
    value: MissionType.WIND_TURBINE_INSPECTION,
    label: "Wind Turbine Inspection",
  },
  { value: MissionType.SOLAR_PANEL_SURVEY, label: "Solar Panel Survey" },
  { value: MissionType.POWER_LINE_PATROL, label: "Power Line Patrol" },
];
