import { Drone } from '../entities/drone.entity';
import { IDroneRepository } from './drone.repository';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination';
import { randomUUID } from 'crypto';
import { Tx } from 'src/common/persistence/tx';

export class InMemoryDroneRepository implements IDroneRepository {
  private readonly store = new Map<string, Drone>();

  findById(id: string): Promise<Drone | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findBySerialNumber(serialNumber: string): Promise<Drone | null> {
    const found = [...this.store.values()].find(
      (d) => d.serialNumber === serialNumber,
    );
    return Promise.resolve(found ?? null);
  }

  findPaginated(params: PaginationParams): Promise<PaginatedResult<Drone>> {
    const all = [...this.store.values()];
    const start = (params.page - 1) * params.limit;
    const data = all.slice(start, start + params.limit);
    return Promise.resolve({ data, total: all.length });
  }

  save(drone: Drone, _tx?: Tx): Promise<Drone> {
    if (!drone.id) {
      drone.id = randomUUID();
    }
    this.store.set(drone.id, drone);
    return Promise.resolve(drone);
  }

  create(data: Partial<Drone>): Drone {
    const drone = new Drone();
    Object.assign(drone, data);
    return drone;
  }

  findByIdForUpdate(id: string, _tx: Tx): Promise<Drone | null> {
    return this.findById(id);
  }
}
