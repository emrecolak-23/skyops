import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { MissionsService } from './missions.service';
import { CreateMissionDto } from './dto/create-mission.dto';
import { CompleteMissionDto } from './dto/complete-mission.dto';
import { AbortMissionDto } from './dto/abort-mission.dto';
import { MissionQueryDto } from './dto/mission-query.dto';
import { MissionResponseDto } from './dto/mission-response.dto';
import { MissionStateMachine } from './domain/mission-state-machine';
import { Mission } from './entities/mission.entity';

@Controller('missions')
export class MissionsController {
  constructor(
    private readonly missionsService: MissionsService,
    private readonly stateMachine: MissionStateMachine,
  ) {}

  @Post()
  async create(@Body() dto: CreateMissionDto): Promise<MissionResponseDto> {
    const mission = await this.missionsService.create(dto);
    return this.toResponse(mission);
  }

  @Get()
  async findAll(@Query() query: MissionQueryDto) {
    const result = await this.missionsService.findPaginated(query);
    return {
      data: result.data.map((m) => this.toResponse(m)),
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
  ): Promise<MissionResponseDto> {
    const mission = await this.missionsService.findById(id);
    return this.toResponse(mission);
  }

  @Patch(':id/pre-flight')
  async startPreFlight(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MissionResponseDto> {
    const mission = await this.missionsService.startPreFlight(id);
    return this.toResponse(mission);
  }

  @Patch(':id/start')
  async start(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<MissionResponseDto> {
    const mission = await this.missionsService.start(id);
    return this.toResponse(mission);
  }

  @Patch(':id/complete')
  async complete(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CompleteMissionDto,
  ): Promise<MissionResponseDto> {
    const { mission, maintenanceDue } = await this.missionsService.complete(
      id,
      dto,
    );
    return this.toResponse(mission, maintenanceDue);
  }

  @Patch(':id/abort')
  async abort(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AbortMissionDto,
  ): Promise<MissionResponseDto> {
    const mission = await this.missionsService.abort(id, dto);
    return this.toResponse(mission);
  }

  private toResponse(
    mission: Mission,
    maintenanceDue?: boolean,
  ): MissionResponseDto {
    return MissionResponseDto.fromEntity(
      mission,
      this.stateMachine.allowedTransitions(mission.status),
      maintenanceDue,
    );
  }
}
