import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MaintenanceType } from '@skyops/shared';

export class CreateMaintenanceLogDto {
  @IsUUID()
  droneId!: string;

  @IsEnum(MaintenanceType)
  type!: MaintenanceType;

  @IsString()
  @MaxLength(120)
  technicianName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(999999)
  flightHoursAtMaintenance!: number;
}
