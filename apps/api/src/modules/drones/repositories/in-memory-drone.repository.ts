import { Drone } from '../entities/drone.entity';
import { IDroneRepository } from './drone.repository';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination';
import { randomUUID } from 'crypto';
import { Tx } from 'src/common/persistence/tx';
import { DroneStatus } from '@skyops/shared';

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

  findByIdForUpdate(id: string, _tx?: Tx): Promise<Drone | null> {
    return this.findById(id);
  }

  countByStatus(): Promise<{ status: DroneStatus; count: number }[]> {
    const counts = new Map<DroneStatus, number>();
    for (const d of this.store.values()) {
      counts.set(d.status, (counts.get(d.status) ?? 0) + 1);
    }
    return Promise.resolve(
      [...counts.entries()].map(([status, count]) => ({ status, count })),
    );
  }

  averageFlightHours(): Promise<number> {
    const active = [...this.store.values()].filter(
      (d) => d.status !== DroneStatus.RETIRED,
    );
    if (active.length === 0) return Promise.resolve(0);
    const sum = active.reduce((s, d) => s + Number(d.totalFlightHours), 0);
    return Promise.resolve(sum / active.length);
  }

  findNonRetired(): Promise<Drone[]> {
    return Promise.resolve(
      [...this.store.values()].filter((d) => d.status !== DroneStatus.RETIRED),
    );
  }
}
