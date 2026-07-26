import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination';
import { Tx } from 'src/common/persistence/tx';
import { MaintenanceLog } from '../entities/maintenance-log.entity';
import { IMaintenanceLogRepository } from './maintenance-log.repository';

@Injectable()
export class TypeOrmMaintenanceLogRepository implements IMaintenanceLogRepository {
  constructor(
    @InjectRepository(MaintenanceLog)
    private readonly repo: Repository<MaintenanceLog>,
  ) {}

  private manager(tx?: Tx): Repository<MaintenanceLog> {
    return tx ? tx.getRepository(MaintenanceLog) : this.repo;
  }

  findById(id: string, tx?: Tx): Promise<MaintenanceLog | null> {
    return this.manager(tx).findOne({ where: { id } });
  }

  async findByDroneId(
    droneId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<MaintenanceLog>> {
    const [data, total] = await this.repo
      .createQueryBuilder('log')
      .where('log.droneId = :droneId', { droneId })
      .orderBy('log.startedAt', 'DESC')
      .skip((pagination.page - 1) * pagination.limit)
      .take(pagination.limit)
      .getManyAndCount();
    return { data, total };
  }

  findLatestForDrone(droneId: string, tx?: Tx): Promise<MaintenanceLog | null> {
    return this.manager(tx)
      .createQueryBuilder('log')
      .where('log.droneId = :droneId', { droneId })
      .orderBy('log.completedAt', 'DESC', 'NULLS LAST')
      .getOne();
  }

  save(log: MaintenanceLog, tx?: Tx): Promise<MaintenanceLog> {
    return this.manager(tx).save(log);
  }

  create(data: Partial<MaintenanceLog>): MaintenanceLog {
    return this.repo.create(data);
  }
}
