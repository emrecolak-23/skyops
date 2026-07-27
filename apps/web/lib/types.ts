import {
  DroneModel,
  DroneStatus,
  MissionStatus,
  MissionType,
  MaintenanceStatus,
  MaintenanceType,
} from "@skyops/shared";

export interface Drone {
  id: string;
  serialNumber: string;
  model: DroneModel;
  status: DroneStatus;
  totalFlightHours: number;
  lastMaintenanceDate: string | null;
  nextMaintenanceDueDate: string | null;
  registeredAt: string;
  notes: string | null;
  maintenanceDue?: boolean;
}

export interface Mission {
  id: string;
  name: string;
  type: MissionType;
  droneId: string;
  pilotName: string;
  siteLocation: string;
  status: MissionStatus;
  plannedStart: string;
  plannedEnd: string;
  actualStart: string | null;
  actualEnd: string | null;
  flightHoursLogged: number | null;
  abortReason: string | null;
  availableActions: MissionStatus[];
  maintenanceDue?: boolean;
  droneSerialNumber: string | null;
}

export interface MaintenanceLog {
  id: string;
  droneId: string;
  type: MaintenanceType;
  status: MaintenanceStatus;
  technicianName: string;
  notes: string | null;
  startedAt: string;
  completedAt: string | null;
  flightHoursAtMaintenance: number;
  createdAt: string;
}

export interface FleetHealth {
  totalDrones: number;
  statusBreakdown: Record<DroneStatus, number>;
  overdueMaintenance: {
    id: string;
    serialNumber: string;
    model: DroneModel;
    nextMaintenanceDueDate: string | null;
  }[];
  missionsNext24Hours: number;
  averageFlightHours: number;
}

export interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}
