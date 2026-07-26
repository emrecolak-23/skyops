import { Drone } from '../entities/drone.entity';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination';
import { Tx } from 'src/common/persistence/tx';

export const DRONE_REPOSITORY = Symbol('DRONE_REPOSITORY');

export interface IDroneRepository {
  findById(id: string): Promise<Drone | null>;
  findBySerialNumber(serialNumber: string): Promise<Drone | null>;
  findPaginated(params: PaginationParams): Promise<PaginatedResult<Drone>>;
  save(drone: Drone, tx?: Tx): Promise<Drone>;
  create(data: Partial<Drone>): Drone;
  findByIdForUpdate(id: string, tx?: Tx): Promise<Drone | null>;
}
