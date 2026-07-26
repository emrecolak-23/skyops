import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/pagination/pagination-query.dto';
import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { MaintenanceLogResponseDto } from './dto/maintenance-log-response.dto';

@Controller()
export class MaintenanceController {
  constructor(private readonly maintenanceService: MaintenanceService) {}

  @Post('maintenance-logs')
  @HttpCode(HttpStatus.CREATED)
  async open(
    @Body() dto: CreateMaintenanceLogDto,
  ): Promise<MaintenanceLogResponseDto> {
    const log = await this.maintenanceService.open(dto);
    return MaintenanceLogResponseDto.fromEntity(log);
  }

  @Patch('maintenance-logs/:id/complete')
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MaintenanceLogResponseDto> {
    const log = await this.maintenanceService.complete(id);
    return MaintenanceLogResponseDto.fromEntity(log);
  }

  @Get('drones/:droneId/maintenance-logs')
  async findByDrone(
    @Param('droneId', ParseUUIDPipe) droneId: string,
    @Query() query: PaginationQueryDto,
  ) {
    const result = await this.maintenanceService.findByDroneId(droneId, query);
    return {
      data: result.data.map(MaintenanceLogResponseDto.fromEntity),
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  }
}
