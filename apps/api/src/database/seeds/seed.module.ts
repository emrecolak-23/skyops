import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { dataSourceOptions } from '../typeorm.config';
import appConfig from 'src/config/app.config';
import databaseConfig from '../../config/database.config';
import maintenanceConfig from '../../config/maintenance.config';
import { DronesModule } from 'src/modules/drones/drones.module';
import { MissionsModule } from 'src/modules/missions/mission.module';
import { MaintenanceModule } from 'src/modules/maintenance/maintenance.module';
import { CommonModule } from 'src/common/common.module';
import { SeedService } from './seed.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, maintenanceConfig],
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    CommonModule,
    DronesModule,
    MissionsModule,
    MaintenanceModule,
  ],
  providers: [SeedService],
})
export class SeedModule {}
