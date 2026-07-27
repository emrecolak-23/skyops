import { MaintenanceType } from "@skyops/shared";

export const MAINTENANCE_TYPES = [
  { value: MaintenanceType.ROUTINE_CHECK, label: "Routine Check" },
  { value: MaintenanceType.BATTERY_REPLACEMENT, label: "Battery Replacement" },
  { value: MaintenanceType.MOTOR_REPAIR, label: "Motor Repair" },
  { value: MaintenanceType.FIRMWARE_UPDATE, label: "Firmware Update" },
  { value: MaintenanceType.FULL_OVERHAUL, label: "Full Overhaul" },
];
