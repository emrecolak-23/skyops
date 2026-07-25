import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import maintenanceConfig from './config/maintenance.config';
import { DatabaseModule } from './database/database.module';
import { DronesModule } from './modules/drones/drones.module';
import { MissionsModule } from './modules/missions/mission.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, maintenanceConfig],
    }),
    DatabaseModule,
    DronesModule,
    MissionsModule,
    MaintenanceModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
