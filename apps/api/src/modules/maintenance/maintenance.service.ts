import { Inject, Injectable } from '@nestjs/common';
import { DroneStatus, MaintenanceStatus } from '@skyops/shared';
import { CLOCK, type Clock } from 'src/common/clock';
import {
  TRANSACTION_RUNNER,
  type TransactionRunner,
} from 'src/common/persistence/transaction-runner';
import { PaginatedResult } from 'src/common/pagination/pagination';
import { PaginationQueryDto } from 'src/common/pagination/pagination-query.dto';
import { DronesService } from 'src/modules/drones/drones.service';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import {
  MAINTENANCE_LOG_REPOSITORY,
  type IMaintenanceLogRepository,
} from './repositories/maintenance-log.repository';
import { MAINTENANCE_TOLERANCE } from './maintenance.tokens';
import { isFlightHoursConsistent } from './domain/flight-hours-consistency';
import {
  DroneNotAvailableForMaintenanceError,
  InconsistentFlightHoursError,
  MaintenanceAlreadyCompletedError,
  MaintenanceLogNotFoundError,
} from './domain/maintenance.errors';

@Injectable()
export class MaintenanceService {
  constructor(
    @Inject(MAINTENANCE_LOG_REPOSITORY)
    private readonly logs: IMaintenanceLogRepository,
    private readonly drones: DronesService,
    @Inject(TRANSACTION_RUNNER) private readonly tx: TransactionRunner,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(MAINTENANCE_TOLERANCE) private readonly toleranceHours: number,
  ) {}

  open(dto: CreateMaintenanceLogDto): Promise<MaintenanceLog> {
    return this.tx.run(async (tx) => {
      const drone = await this.drones.findByIdForUpdate(dto.droneId, tx);

      if (
        drone.status === DroneStatus.IN_MISSION ||
        drone.status === DroneStatus.RETIRED
      ) {
        throw new DroneNotAvailableForMaintenanceError(drone.id);
      }

      if (
        !isFlightHoursConsistent(
          dto.flightHoursAtMaintenance,
          Number(drone.totalFlightHours),
          this.toleranceHours,
        )
      ) {
        throw new InconsistentFlightHoursError(
          dto.flightHoursAtMaintenance,
          Number(drone.totalFlightHours),
        );
      }

      const now = this.clock.now();

      const log = this.logs.create({
        droneId: dto.droneId,
        type: dto.type,
        technicianName: dto.technicianName,
        notes: dto.notes ?? null,
        flightHoursAtMaintenance: dto.flightHoursAtMaintenance,
        status: MaintenanceStatus.IN_PROGRESS,
        startedAt: now,
        completedAt: null,
      });

      drone.status = DroneStatus.MAINTENANCE;

      const saved = await this.logs.save(log, tx);
      await this.drones.saveDrone(drone, tx);
      return saved;
    });
  }

  complete(id: string): Promise<MaintenanceLog> {
    return this.tx.run(async (tx) => {
      const log = await this.logs.findById(id, tx);
      if (!log) {
        throw new MaintenanceLogNotFoundError(id);
      }

      if (log.status === MaintenanceStatus.COMPLETED) {
        throw new MaintenanceAlreadyCompletedError(id);
      }

      const drone = await this.drones.findByIdForUpdate(log.droneId, tx);
      const now = this.clock.now();

      log.status = MaintenanceStatus.COMPLETED;
      log.completedAt = now;

      drone.status = DroneStatus.AVAILABLE;
      this.drones.applyMaintenance(
        drone,
        now,
        Number(log.flightHoursAtMaintenance),
      );

      const saved = await this.logs.save(log, tx);
      await this.drones.saveDrone(drone, tx);
      return saved;
    });
  }

  findByDroneId(
    droneId: string,
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<MaintenanceLog>> {
    return this.logs.findByDroneId(droneId, {
      page: query.page,
      limit: query.limit,
    });
  }
}
