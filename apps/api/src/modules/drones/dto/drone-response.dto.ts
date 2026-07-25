import { DroneModel, DroneStatus } from '@skyops/shared';
import { Drone } from '../entities/drone.entity';

export class DroneResponseDto {
  id!: string;
  serialNumber!: string;
  model!: DroneModel;
  status!: DroneStatus;
  totalFlightHours!: number;
  lastMaintenanceDate!: string | null;
  nextMaintenanceDueDate!: string | null;
  registeredAt!: string;

  static fromEntity(drone: Drone): DroneResponseDto {
    const dto = new DroneResponseDto();
    dto.id = drone.id;
    dto.serialNumber = drone.serialNumber;
    dto.model = drone.model;
    dto.status = drone.status;
    dto.totalFlightHours = drone.totalFlightHours;
    dto.lastMaintenanceDate = drone.lastMaintenanceDate?.toISOString() ?? null;
    dto.nextMaintenanceDueDate =
      drone.nextMaintenanceDueDate?.toISOString() ?? null;
    dto.registeredAt = drone.registeredAt.toISOString();
    return dto;
  }
}
