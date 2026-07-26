import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination';
import { Drone } from '../entities/drone.entity';
import { IDroneRepository } from './drone.repository';
import { Tx } from 'src/common/persistence/tx';
import { DroneStatus } from '@skyops/shared';

@Injectable()
export class TypeOrmDroneRepository implements IDroneRepository {
  constructor(
    @InjectRepository(Drone) private readonly repo: Repository<Drone>,
  ) {}

  findById(id: string): Promise<Drone | null> {
    return this.repo.findOne({ where: { id } });
  }

  findBySerialNumber(serialNumber: string): Promise<Drone | null> {
    return this.repo.findOne({ where: { serialNumber } });
  }

  async findPaginated(
    params: PaginationParams,
  ): Promise<PaginatedResult<Drone>> {
    const [data, total] = await this.repo
      .createQueryBuilder('drone')
      .orderBy('drone.registeredAt', 'DESC')
      .skip((params.page - 1) * params.limit)
      .take(params.limit)
      .getManyAndCount();

    return { data, total };
  }

  save(drone: Drone, tx?: Tx): Promise<Drone> {
    const repo = tx ? tx.getRepository(Drone) : this.repo;
    return repo.save(drone);
  }

  create(data: Partial<Drone>): Drone {
    return this.repo.create(data);
  }

  findByIdForUpdate(id: string, tx?: Tx): Promise<Drone | null> {
    if (!tx) {
      return this.findById(id);
    }

    return tx
      .createQueryBuilder(Drone, 'drone')
      .setLock('pessimistic_write')
      .where('drone.id = :id', { id })
      .getOne();
  }

  async countByStatus(): Promise<{ status: DroneStatus; count: number }[]> {
    const rows = await this.repo
      .createQueryBuilder('drone')
      .select('drone.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('drone.status')
      .getRawMany<{ status: DroneStatus; count: string }>();
    return rows.map((r) => ({
      status: r.status,
      count: parseInt(r.count, 10),
    }));
  }

  async averageFlightHours(): Promise<number> {
    const row = await this.repo
      .createQueryBuilder('drone')
      .select('AVG(drone.total_flight_hours)', 'avg')
      .where('drone.status != :retired', { retired: DroneStatus.RETIRED })
      .getRawOne<{ avg: string | null }>();
    return row?.avg ? parseFloat(row.avg) : 0;
  }

  findNonRetired(): Promise<Drone[]> {
    return this.repo
      .createQueryBuilder('drone')
      .where('drone.status != :retired', { retired: DroneStatus.RETIRED })
      .getMany();
  }
}
