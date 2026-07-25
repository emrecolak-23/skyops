import {
  IsDateString,
  IsEnum,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { MissionType } from '@skyops/shared';

export class CreateMissionDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsEnum(MissionType)
  type!: MissionType;

  @IsUUID()
  droneId!: string;

  @IsString()
  @MaxLength(120)
  pilotName!: string;

  @IsString()
  @MaxLength(200)
  siteLocation!: string;

  @IsDateString()
  plannedStart!: string;

  @IsDateString()
  plannedEnd!: string;
}
