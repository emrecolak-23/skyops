import { AppConfig } from './app.config';
import { DatabaseConfig } from './database.config';
import { MaintenanceConfig } from './maintenance.config';

export type AllConfigType = {
  app: AppConfig;
  database: DatabaseConfig;
  maintenance: MaintenanceConfig;
};
