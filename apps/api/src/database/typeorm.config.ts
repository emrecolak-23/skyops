import 'dotenv/config';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Drone } from 'src/modules/drones/entities/drone.entity';
import { Mission } from 'src/modules/missions/entities/mission.entity';
import { MaintenanceLog } from 'src/modules/maintenance/entities/maintenance-log.entity';

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  entities: [Drone, Mission, MaintenanceLog],
  migrations: ['src/database/migrations/*.ts'],
  synchronize: false,
  migrationsRun: false,
};

export default new DataSource(dataSourceOptions);
