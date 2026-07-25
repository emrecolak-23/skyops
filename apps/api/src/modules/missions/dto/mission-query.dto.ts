import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { MissionStatus } from '@skyops/shared';
import { PaginationQueryDto } from 'src/common/pagination/pagination-query.dto';

export class MissionQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsEnum(MissionStatus)
  status?: MissionStatus;

  @IsOptional()
  @IsUUID()
  droneId?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
