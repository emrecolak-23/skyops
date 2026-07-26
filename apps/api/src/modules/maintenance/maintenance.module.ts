import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceLog } from './entities/maintenance-log.entity';
import { DronesModule } from '../drones/drones.module';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceService } from './maintenance.service';
import { MAINTENANCE_LOG_REPOSITORY } from './repositories/maintenance-log.repository';
import { TypeOrmMaintenanceLogRepository } from './repositories/typeorm-maintenance-log.repository';
import { MAINTENANCE_TOLERANCE } from './maintenance.tokens';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';

@Module({
  imports: [
    TypeOrmModule.forFeature([MaintenanceLog]),
    forwardRef(() => DronesModule),
  ],
  controllers: [MaintenanceController],
  providers: [
    MaintenanceService,
    {
      provide: MAINTENANCE_LOG_REPOSITORY,
      useClass: TypeOrmMaintenanceLogRepository,
    },
    {
      provide: MAINTENANCE_TOLERANCE,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) =>
        config.getOrThrow('maintenance', { infer: true }).toleranceHours,
    },
  ],
})
export class MaintenanceModule {}
