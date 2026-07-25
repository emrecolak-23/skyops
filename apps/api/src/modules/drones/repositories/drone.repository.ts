import { Drone } from '../entities/drone.entity';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination';

export const DRONE_REPOSITORY = Symbol('DRONE_REPOSITORY');

export interface IDroneRepository {
  findById(id: string): Promise<Drone | null>;
  findBySerialNumber(serialNumber: string): Promise<Drone | null>;
  findPaginated(params: PaginationParams): Promise<PaginatedResult<Drone>>;
  save(drone: Drone): Promise<Drone>;
  create(data: Partial<Drone>): Drone;
}
