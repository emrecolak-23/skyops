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
}
