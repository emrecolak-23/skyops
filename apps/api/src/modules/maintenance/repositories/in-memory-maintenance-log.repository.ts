import { randomUUID } from 'crypto';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination';
import { MaintenanceLog } from '../entities/maintenance-log.entity';
import { IMaintenanceLogRepository } from './maintenance-log.repository';

export class InMemoryMaintenanceLogRepository implements IMaintenanceLogRepository {
  private readonly store = new Map<string, MaintenanceLog>();

  findById(id: string): Promise<MaintenanceLog | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findByDroneId(
    droneId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<MaintenanceLog>> {
    const all = [...this.store.values()]
      .filter((log) => log.droneId === droneId)
      .sort((a, b) => this.sortKey(b) - this.sortKey(a));

    const start = (pagination.page - 1) * pagination.limit;
    const data = all.slice(start, start + pagination.limit);
    return Promise.resolve({ data, total: all.length });
  }

  findLatestForDrone(droneId: string): Promise<MaintenanceLog | null> {
    const latest = [...this.store.values()]
      .filter((log) => log.droneId === droneId)
      .sort((a, b) => this.sortKey(b) - this.sortKey(a))[0];
    return Promise.resolve(latest ?? null);
  }

  save(log: MaintenanceLog): Promise<MaintenanceLog> {
    if (!log.id) {
      log.id = randomUUID();
    }
    this.store.set(log.id, log);
    return Promise.resolve(log);
  }

  create(data: Partial<MaintenanceLog>): MaintenanceLog {
    const log = new MaintenanceLog();
    Object.assign(log, data);
    return log;
  }

  private sortKey(log: MaintenanceLog): number {
    return log.completedAt
      ? log.completedAt.getTime()
      : log.startedAt.getTime();
  }
}
