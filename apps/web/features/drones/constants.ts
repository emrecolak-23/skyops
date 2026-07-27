import { DroneStatus, DroneModel } from "@skyops/shared";

export const STATUS_COLORS: Record<DroneStatus, string> = {
  [DroneStatus.AVAILABLE]: "green",
  [DroneStatus.IN_MISSION]: "blue",
  [DroneStatus.MAINTENANCE]: "orange",
  [DroneStatus.RETIRED]: "gray",
};

export const SERIAL_NUMBER_PATTERN = /^SKY-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export const DRONE_MODELS = [
  { value: DroneModel.PHANTOM_4, label: "Phantom 4" },
  { value: DroneModel.MATRICE_300, label: "Matrice 300" },
  { value: DroneModel.MAVIC_3_ENTERPRISE, label: "Mavic 3 Enterprise" },
];

export const DRONE_LIST_TABLE_HEADERS = [
  { label: "Serial", key: "serialNumber" },
  { label: "Model", key: "model" },
  { label: "Status", key: "status" },
  { label: "Flight Hours", key: "totalFlightHours" },
  { label: "Maintenance", key: "maintenanceDue" },
];
