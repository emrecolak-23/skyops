import { randomUUID } from 'crypto';
import { MissionStatus } from '@skyops/shared';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination';
import { Mission } from '../entities/mission.entity';
import { IMissionRepository, MissionFilter } from './mission.repository';
import { rangesOverlap } from '../domain/time-range';
import { Tx } from 'src/common/persistence/tx';

const ACTIVE_STATUSES: MissionStatus[] = [
  MissionStatus.PLANNED,
  MissionStatus.PRE_FLIGHT_CHECK,
  MissionStatus.IN_PROGRESS,
];

export class InMemoryMissionRepository implements IMissionRepository {
  private readonly store = new Map<string, Mission>();

  findById(id: string, tx?: Tx): Promise<Mission | null> {
    return Promise.resolve(this.store.get(id) ?? null);
  }

  findPaginated(
    filter: MissionFilter,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Mission>> {
    let all = [...this.store.values()];

    if (filter.status) all = all.filter((m) => m.status === filter.status);
    if (filter.droneId) all = all.filter((m) => m.droneId === filter.droneId);
    if (filter.from) all = all.filter((m) => m.plannedStart >= filter.from!);
    if (filter.to) all = all.filter((m) => m.plannedStart <= filter.to!);

    all.sort((a, b) => b.plannedStart.getTime() - a.plannedStart.getTime());

    const start = (pagination.page - 1) * pagination.limit;
    const data = all.slice(start, start + pagination.limit);
    return Promise.resolve({ data, total: all.length });
  }

  findActiveOverlapping(
    droneId: string,
    plannedStart: Date,
    plannedEnd: Date,
  ): Promise<Mission[]> {
    const result = [...this.store.values()].filter(
      (m) =>
        m.droneId === droneId &&
        rangesOverlap(m.plannedStart, m.plannedEnd, plannedStart, plannedEnd),
    );
    return Promise.resolve(result);
  }

  countActiveByDroneId(droneId: string): Promise<number> {
    const count = [...this.store.values()].filter(
      (m) => m.droneId === droneId && ACTIVE_STATUSES.includes(m.status),
    ).length;
    return Promise.resolve(count);
  }

  save(mission: Mission): Promise<Mission> {
    if (!mission.id) mission.id = randomUUID();

    this.store.set(mission.id, mission);
    return Promise.resolve(mission);
  }

  create(data: Partial<Mission>): Mission {
    const mission = new Mission();
    Object.assign(mission, data);
    return mission;
  }
}
