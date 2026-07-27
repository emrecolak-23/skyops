import {
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { DroneModel } from '@skyops/shared';
import { SERIAL_NUMBER_PATTERN } from '../domain/searial-number';

export class CreateDroneDto {
  @IsString()
  @Matches(SERIAL_NUMBER_PATTERN, {
    message:
      'serialNumber must match the format SKY-XXXX-XXXX (uppercase alphanumeric)',
  })
  serialNumber!: string;

  @IsEnum(DroneModel)
  model!: DroneModel;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
