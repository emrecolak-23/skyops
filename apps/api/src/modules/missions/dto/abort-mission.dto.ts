import { IsString, MaxLength, MinLength } from 'class-validator';

export class AbortMissionDto {
  @IsString()
  @MinLength(10)
  @MaxLength(200)
  reason!: string;
}
