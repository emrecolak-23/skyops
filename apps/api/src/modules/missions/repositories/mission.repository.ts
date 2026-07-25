import { Mission } from '../entities/mission.entity';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination';
import { MissionStatus } from '@skyops/shared';
import { Tx } from 'src/common/persistence/tx';

export const MISSION_REPOSITORY = Symbol('MISSION_REPOSITORY');

export interface MissionFilter {
  status?: MissionStatus;
  droneId?: string;
  from?: Date;
  to?: Date;
}

export interface IMissionRepository {
  findById(id: string, tx?: Tx): Promise<Mission | null>;
  findPaginated(
    filter: MissionFilter,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<Mission>>;
  findActiveOverlapping(
    droneId: string,
    plannedStart: Date,
    plannedEnd: Date,
    tx?: Tx,
  ): Promise<Mission[]>;
  countActiveByDroneId(droneId: string): Promise<number>;
  save(mission: Mission, tx?: Tx): Promise<Mission>;
  create(data: Partial<Mission>): Mission;
}
