import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MissionStatus } from '@skyops/shared';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination';
import { Tx } from 'src/common/persistence/tx';
import { Mission } from '../entities/mission.entity';
import { IMissionRepository, MissionFilter } from './mission.repository';

const ACTIVE_STATUSES: MissionStatus[] = [
  MissionStatus.PLANNED,
  MissionStatus.PRE_FLIGHT_CHECK,
  MissionStatus.IN_PROGRESS,
];

@Injectable()
export class TypeormMissionRepository implements IMissionRepository {
  constructor(
    @InjectRepository(Mission) private readonly repo: Repository<Mission>,
  ) {}

  private manager(tx?: Tx): Repository<Mission> {
    return tx ? tx.getRepository(Mission) : this.repo;
  }

  findById(id: string, tx?: Tx): Promise<Mission | null> {
    return this.manager(tx)
      .createQueryBuilder('mission')
      .innerJoinAndSelect('mission.drone', 'drone')
      .where('mission.id = :id', { id })
      .getOne();
  }

  async findPaginated(
    filter: MissionFilter,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Mission>> {
    const qb = this.repo
      .createQueryBuilder('mission')
      .innerJoin('mission.drone', 'drone')
      .addSelect(['drone.id', 'drone.serialNumber', 'drone.model']);

    if (filter.status) {
      qb.andWhere('mission.status = :status', { status: filter.status });
    }

    if (filter.droneId) {
      qb.andWhere('mission.droneId = :droneId', { droneId: filter.droneId });
    }

    if (filter.from) {
      qb.andWhere('mission.plannedStart >= :from', { from: filter.from });
    }

    if (filter.to) {
      qb.andWhere('mission.plannedStart <= :to', { to: filter.to });
    }

    const [data, total] = await qb
      .orderBy('mission.plannedStart', 'DESC')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();

    return {
      data,
      total,
    };
  }

  findActiveOverlapping(
    droneId: string,
    plannedStart: Date,
    plannedEnd: Date,
    tx?: Tx,
  ): Promise<Mission[]> {
    return this.manager(tx)
      .createQueryBuilder('mission')
      .where('mission.droneId = :droneId', { droneId })
      .andWhere('mission.status IN (:...activeStatuses)', {
        activeStatuses: ACTIVE_STATUSES,
      })
      .andWhere('mission.plannedStart < :plannedEnd', { plannedEnd })
      .andWhere('mission.plannedEnd > :plannedStart', { plannedStart })
      .getMany();
  }

  countActiveByDroneId(droneId: string): Promise<number> {
    return this.repo
      .createQueryBuilder('mission')
      .where('mission.droneId = :droneId', { droneId })
      .andWhere('mission.status IN (:...statuses)', {
        statuses: ACTIVE_STATUSES,
      })
      .getCount();
  }

  save(mission: Mission, tx?: Tx): Promise<Mission> {
    return this.manager(tx).save(mission);
  }

  create(data: Partial<Mission>): Mission {
    return this.repo.create(data);
  }

  countInNext24Hours(now: Date): Promise<number> {
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    return this.repo
      .createQueryBuilder('mission')
      .where('mission.plannedStart >= :now', { now })
      .andWhere('mission.plannedStart <= :in24h', { in24h })
      .andWhere('mission.status IN (:...statuses)', {
        statuses: [MissionStatus.PLANNED, MissionStatus.PRE_FLIGHT_CHECK],
      })
      .getCount();
  }
}
