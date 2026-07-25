import { Inject, Injectable } from '@nestjs/common';
import { DroneStatus, MissionStatus } from '@skyops/shared';
import type { Clock } from 'src/common/clock/clock';
import { CLOCK } from 'src/common/clock';
import type { TransactionRunner } from 'src/common/persistence/transaction-runner';
import { TRANSACTION_RUNNER } from 'src/common/persistence/transaction-runner';
import { DronesService } from '../drones/drones.service';
import { Mission } from './entities/mission.entity';
import { CreateMissionDto } from './dto';
import { MISSION_REPOSITORY } from './repositories/mission.repository';
import type { IMissionRepository } from './repositories/mission.repository';
import { MissionStateMachine } from './domain/mission-state-machine';
import { MissionTransitionRegistry } from './domain/transitions/mission-transition.registry';
import {
  DroneNotAvailableError,
  InvalidMissionScheduleError,
  MissionInPastError,
  MissionNotFoundError,
  MissionOverlapError,
} from './domain/mission.errors';

@Injectable()
export class MissionsService {
  constructor(
    @Inject(MISSION_REPOSITORY) private readonly missions: IMissionRepository,
    private readonly drones: DronesService,
    private readonly stateMachine: MissionStateMachine,
    private readonly transitions: MissionTransitionRegistry,
    @Inject(TRANSACTION_RUNNER) private readonly tx: TransactionRunner,
    @Inject(CLOCK) private readonly clock: Clock,
  ) {}

  async create(dto: CreateMissionDto): Promise<Mission> {
    const plannedStart = new Date(dto.plannedStart);
    const plannedEnd = new Date(dto.plannedEnd);

    if (plannedEnd.getTime() <= plannedStart.getTime()) {
      throw new InvalidMissionScheduleError();
    }

    if (plannedStart.getTime() < this.clock.now().getTime()) {
      throw new MissionInPastError();
    }

    const drone = await this.drones.findById(dto.droneId);

    if (
      drone.status === DroneStatus.RETIRED ||
      drone.status === DroneStatus.MAINTENANCE
    ) {
      throw new DroneNotAvailableError(drone.id);
    }

    const overlapping = await this.missions.findActiveOverlapping(
      dto.droneId,
      plannedStart,
      plannedEnd,
    );

    if (overlapping.length > 0) {
      throw new MissionOverlapError(dto.droneId);
    }

    const mission = this.missions.create({
      name: dto.name,
      type: dto.type,
      droneId: dto.droneId,
      pilotName: dto.pilotName,
      siteLocation: dto.siteLocation,
      status: MissionStatus.PLANNED,
      plannedStart,
      plannedEnd,
      actualStart: null,
      actualEnd: null,
      flightHoursLogged: null,
      abortReason: null,
    });

    return this.missions.save(mission);
  }

  async startPreFlight(id: string): Promise<Mission> {
    return this.transitionsTo(id, MissionStatus.PRE_FLIGHT_CHECK);
  }

  async start(id: string): Promise<Mission> {
    return this.transitionsTo(id, MissionStatus.IN_PROGRESS);
  }

  async complete(
    id: string,
    dto: { flightHoursLogged: number },
  ): Promise<Mission> {
    return this.transitionsTo(id, MissionStatus.COMPLETED, {
      flightHoursLogged: dto.flightHoursLogged,
    });
  }

  async abort(id: string, dto: { reason: string }): Promise<Mission> {
    return this.transitionsTo(id, MissionStatus.ABORTED, {
      abortReason: dto.reason,
    });
  }

  private transitionsTo(
    id: string,
    to: MissionStatus,
    extra: { flightHoursLogged?: number; abortReason?: string } = {},
  ): Promise<Mission> {
    return this.tx.run(async (tx) => {
      const mission = await this.missions.findById(id, tx);

      if (!mission) {
        throw new MissionNotFoundError(id);
      }

      this.stateMachine.assertTransition(mission.status, to);

      const drone = await this.drones.findById(mission.droneId);

      const now = this.clock.now();

      const transition = this.transitions.resolve(to);
      transition.apply({
        mission,
        drone,
        now,
        flightHoursLogged: extra.flightHoursLogged,
        abortReason: extra.abortReason,
      });

      if (to === MissionStatus.COMPLETED) {
        this.drones.recalculateMaintenance(drone);
      }

      await this.missions.save(mission, tx);
      await this.drones.saveDrone(drone, tx);

      return mission;
    });
  }
}
