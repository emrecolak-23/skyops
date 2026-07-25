import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { PaginationQueryDto } from 'src/common/pagination/pagination-query.dto';
import { DronesService } from './drones.service';
import { CreateDroneDto, UpdateDroneDto, DroneResponseDto } from './dto';

@Controller('drones')
export class DronesController {
  constructor(private readonly dronesService: DronesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateDroneDto): Promise<DroneResponseDto> {
    const drone = await this.dronesService.create(dto);
    return DroneResponseDto.fromEntity(drone);
  }

  @Get()
  async findAll(@Query() query: PaginationQueryDto) {
    const result = await this.dronesService.findPaginated(query);
    return {
      data: result.data.map(DroneResponseDto.fromEntity),
      meta: {
        page: query.page,
        limit: query.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / query.limit),
      },
    };
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DroneResponseDto> {
    const drone = await this.dronesService.findById(id);
    return DroneResponseDto.fromEntity(drone);
  }

  @Delete(':id')
  async retire(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<DroneResponseDto> {
    const drone = await this.dronesService.retire(id);
    return DroneResponseDto.fromEntity(drone);
  }
}
