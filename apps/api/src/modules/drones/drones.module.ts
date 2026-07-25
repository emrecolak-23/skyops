import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Drone } from './entities/drone.entity';
import { DronesController } from './drones.controller';
import { DronesService } from './drones.service';
import { DRONE_REPOSITORY } from './repositories/drone.repository';
import { TypeOrmDroneRepository } from './repositories/typeorm-drone.repository';
import { CLOCK, SystemClock } from 'src/common/clock';
import { MAINTENANCE_POLICY } from './domain/maintenance/maintenance-policy';
import { CompositeMaintenancePolicy } from './domain/maintenance/composite-maintenance.policy';
import { CalendarIntervalPolicy } from './domain/maintenance/calendar-interval.policy';
import { FlightHoursPolicy } from './domain/maintenance/flight-hours.policy';
import { ACTIVE_MISSION_CHECKER, NoActiveMissionsChecker } from './ports';
import { ConfigService } from '@nestjs/config';
import { AllConfigType } from 'src/config/config.type';

@Module({
  imports: [TypeOrmModule.forFeature([Drone])],
  controllers: [DronesController],
  providers: [
    DronesService,
    {
      provide: DRONE_REPOSITORY,
      useClass: TypeOrmDroneRepository,
    },
    {
      provide: CLOCK,
      useClass: SystemClock,
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
    {
      provide: ACTIVE_MISSION_CHECKER,
      useClass: NoActiveMissionsChecker,
    },
  ],
  exports: [DronesService],
})
export class DronesModule {}
