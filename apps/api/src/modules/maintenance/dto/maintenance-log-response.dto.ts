import { MaintenanceStatus, MaintenanceType } from '@skyops/shared';
import { MaintenanceLog } from '../entities/maintenance-log.entity';

export class MaintenanceLogResponseDto {
  id!: string;
  droneId!: string;
  type!: MaintenanceType;
  status!: MaintenanceStatus;
  technicianName!: string;
  notes!: string | null;
  startedAt!: string;
  completedAt!: string | null;
  flightHoursAtMaintenance!: number;
  createdAt!: string;

  static fromEntity(log: MaintenanceLog): MaintenanceLogResponseDto {
    const dto = new MaintenanceLogResponseDto();
    dto.id = log.id;
    dto.droneId = log.droneId;
    dto.type = log.type;
    dto.status = log.status;
    dto.technicianName = log.technicianName;
    dto.notes = log.notes;
    dto.startedAt = log.startedAt.toISOString();
    dto.completedAt = log.completedAt?.toISOString() ?? null;
    dto.flightHoursAtMaintenance = log.flightHoursAtMaintenance;
    dto.createdAt = log.createdAt.toISOString();
    return dto;
  }
}
