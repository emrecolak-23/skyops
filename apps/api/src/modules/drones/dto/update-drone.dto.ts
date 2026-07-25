import { IsEnum, IsOptional } from 'class-validator';
import { DroneStatus } from '@skyops/shared';

export class UpdateDroneDto {
  @IsOptional()
  @IsEnum(DroneStatus)
  status?: DroneStatus;
}
