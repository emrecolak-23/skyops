import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDroneDto {
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}
