import { MaintenanceLog } from '../entities/maintenance-log.entity';
import {
  PaginatedResult,
  PaginationParams,
} from 'src/common/pagination/pagination';
import { Tx } from 'src/common/persistence/tx';

export const MAINTENANCE_LOG_REPOSITORY = 'MAINTENANCE_LOG_REPOSITORY';

export interface IMaintenanceLogRepository {
  findById(id: string, tx?: Tx): Promise<MaintenanceLog | null>;
  findByDroneId(
    droneId: string,
    pagination: PaginationParams,
  ): Promise<PaginatedResult<MaintenanceLog>>;
  findLatestForDrone(droneId: string, tx?: Tx): Promise<MaintenanceLog | null>;
  save(log: MaintenanceLog, tx?: Tx): Promise<MaintenanceLog>;
  create(data: Partial<MaintenanceLog>): MaintenanceLog;
}
