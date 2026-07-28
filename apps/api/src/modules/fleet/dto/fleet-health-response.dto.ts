import { DroneModel } from '@skyops/shared';
import { StatusBreakdown } from '../domain/fleet-health';

export class OverdueDroneDto {
  id!: string;
  serialNumber!: string;
  model!: DroneModel;
  nextMaintenanceDueDate!: string | null;
}

export class FleetHealthResponseDto {
  totalDrones!: number;
  statusBreakdown!: StatusBreakdown;
  overdueMaintenance!: OverdueDroneDto[];
  dueSoonMaintenance!: OverdueDroneDto[];
  missionsNext24Hours!: number;
  averageFlightHours!: number;
}
