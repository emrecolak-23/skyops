import { MissionStatus, MissionType } from '@skyops/shared';
import { Mission } from '../entities/mission.entity';

export class MissionResponseDto {
  id!: string;
  name!: string;
  type!: MissionType;
  droneId!: string;
  pilotName!: string;
  siteLocation!: string;
  status!: MissionStatus;
  plannedStart!: string;
  plannedEnd!: string;
  actualStart!: string | null;
  actualEnd!: string | null;
  flightHoursLogged!: number | null;
  abortReason!: string | null;
  availableActions!: MissionStatus[];
  maintenanceDue?: boolean;
  droneSerialNumber!: string | null;

  static fromEntity(
    mission: Mission,
    availableActions: MissionStatus[],
    maintenanceDue?: boolean,
  ): MissionResponseDto {
    const dto = new MissionResponseDto();
    dto.id = mission.id;
    dto.name = mission.name;
    dto.type = mission.type;
    dto.droneId = mission.droneId;
    dto.pilotName = mission.pilotName;
    dto.siteLocation = mission.siteLocation;
    dto.status = mission.status;
    dto.plannedStart = mission.plannedStart.toISOString();
    dto.plannedEnd = mission.plannedEnd.toISOString();
    dto.actualStart = mission.actualStart?.toISOString() ?? null;
    dto.actualEnd = mission.actualEnd?.toISOString() ?? null;
    dto.flightHoursLogged = mission.flightHoursLogged;
    dto.abortReason = mission.abortReason;
    dto.availableActions = availableActions;
    dto.maintenanceDue = maintenanceDue;
    dto.droneSerialNumber = mission.drone?.serialNumber ?? null;
    return dto;
  }
}
