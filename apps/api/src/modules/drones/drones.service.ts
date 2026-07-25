import { Inject, Injectable } from '@nestjs/common';
import { CLOCK } from 'src/common/clock';
import type { Clock } from 'src/common/clock';
import { DRONE_REPOSITORY } from './repositories/drone.repository';
import type { IDroneRepository } from './repositories/drone.repository';
import { MAINTENANCE_POLICY } from './domain/maintenance/maintenance-policy';
import type { MaintenancePolicy } from './domain/maintenance/maintenance-policy';
import { ACTIVE_MISSION_CHECKER } from './ports';
import type { ActiveMissionChecker } from './ports';
import { DroneStatus } from '@skyops/shared';
import { Drone } from './entities/drone.entity';
import { CreateDroneDto } from './dto/create-drone.dto';
import {
  DroneCannotBeRetiredError,
  DroneNotFoundError,
  DuplicateSerialNumberError,
} from './domain/drone.errors';
import { PaginationQueryDto } from 'src/common/pagination/pagination-query.dto';
import { PaginatedResult } from 'src/common/pagination/pagination';
import { Tx } from 'src/common/persistence/tx';

@Injectable()
export class DronesService {
  constructor(
    @Inject(DRONE_REPOSITORY)
    private readonly drones: IDroneRepository,
    @Inject(MAINTENANCE_POLICY)
    private readonly maintenancePolicy: MaintenancePolicy,
    @Inject(CLOCK) private readonly clock: Clock,
    @Inject(ACTIVE_MISSION_CHECKER)
    private readonly missions: ActiveMissionChecker,
  ) {}

  async create(dto: CreateDroneDto): Promise<Drone> {
    const existing = await this.drones.findBySerialNumber(dto.serialNumber);

    if (existing) {
      throw new DuplicateSerialNumberError(dto.serialNumber);
    }

    const now = this.clock.now();

    const drone = this.drones.create({
      serialNumber: dto.serialNumber,
      model: dto.model,
      status: DroneStatus.AVAILABLE,
      totalFlightHours: 0,
      flightHoursAtLastMaintenance: 0,
      lastMaintenanceDate: null,
      registeredAt: now,
    });

    const due = this.maintenancePolicy.evaluate({
      baseline: now,
      flightHoursSinceBaseline: 0,
      now,
    });

    drone.nextMaintenanceDueDate = due.dueDate;

    return this.drones.save(drone);
  }

  async findById(id: string): Promise<Drone> {
    const drone = await this.drones.findById(id);

    if (!drone) {
      throw new DroneNotFoundError(id);
    }

    return drone;
  }

  findPaginated(query: PaginationQueryDto): Promise<PaginatedResult<Drone>> {
    return this.drones.findPaginated({ page: query.page, limit: query.limit });
  }

  saveInTransaction(drone: Drone, tx?: Tx): Promise<Drone> {
    return this.drones.save(drone, tx);
  }

  saveDrone(drone: Drone, tx?: Tx): Promise<Drone> {
    return this.drones.save(drone, tx);
  }

  async retire(id: string): Promise<Drone> {
    const drone = await this.findById(id);

    const hasActive = await this.missions.hasActiveMissions(id);

    if (hasActive) {
      throw new DroneCannotBeRetiredError(id);
    }

    drone.status = DroneStatus.RETIRED;
    return this.drones.save(drone);
  }

  recalculateMaintenance(drone: Drone): void {
    const now = this.clock.now();
    const baseline = drone.lastMaintenanceDate ?? drone.registeredAt;
    const flightHoursSinceBaseline =
      Number(drone.totalFlightHours) -
      Number(drone.flightHoursAtLastMaintenance);
    const due = this.maintenancePolicy.evaluate({
      baseline,
      flightHoursSinceBaseline,
      now,
    });

    drone.nextMaintenanceDueDate = due.dueDate;
  }

  async findByIdForUpdate(id: string, tx: Tx): Promise<Drone> {
    const drone = await this.drones.findByIdForUpdate(id, tx);

    if (!drone) {
      throw new DroneNotFoundError(id);
    }

    return drone;
  }
}
