import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drone } from './entities/drone.entity';
import { DronesController } from './drones.controller';
import { DronesService } from './drones.service';
import { DRONE_REPOSITORY } from './repositories/drone.repository';
import { TypeOrmDroneRepository } from './repositories/typeorm-drone.repository';
import { MAINTENANCE_POLICY } from './domain/maintenance/maintenance-policy';
import { CompositeMaintenancePolicy } from './domain/maintenance/composite-maintenance.policy';
import { CalendarIntervalPolicy } from './domain/maintenance/calendar-interval.policy';
import { FlightHoursPolicy } from './domain/maintenance/flight-hours.policy';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';
import { MissionsModule } from '../missions/mission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Drone]),
    forwardRef(() => MissionsModule),
  ],
  controllers: [DronesController],
  providers: [
    DronesService,
    {
      provide: DRONE_REPOSITORY,
      useClass: TypeOrmDroneRepository,
    },

    {
      provide: MAINTENANCE_POLICY,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AllConfigType>) => {
        const cfg = config.getOrThrow('maintenance', { infer: true });
        return new CompositeMaintenancePolicy([
          new CalendarIntervalPolicy(cfg.intervalDays),
          new FlightHoursPolicy(cfg.intervalFlightHours),
        ]);
      },
    },
  ],
  exports: [DronesService, DRONE_REPOSITORY, MAINTENANCE_POLICY],
})
export class DronesModule {}
