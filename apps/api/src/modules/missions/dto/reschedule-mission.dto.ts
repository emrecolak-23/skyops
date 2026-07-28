import { IsDateString, IsOptional, IsUUID } from 'class-validator';

export class RescheduleMissionDto {
  @IsDateString()
  plannedStart!: string;

  @IsDateString()
  plannedEnd!: string;

  @IsOptional()
  @IsUUID()
  droneId?: string;
}
