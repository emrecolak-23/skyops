import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Mission } from './entities/mission.entity';
import { MISSION_REPOSITORY } from './repositories/mission.repository';
import { TypeormMissionRepository } from './repositories/typeorm-mission.repository';
import { ACTIVE_MISSION_CHECKER } from '../drones/ports';
import { MissionActiveCheckerAdapter } from './mission-active-checker.adapter';
import { DronesModule } from '../drones/drones.module';
import { MissionsService } from './missions.service';
import { MissionStateMachine } from './domain/mission-state-machine';
import { MissionTransitionRegistry } from './domain/transitions/mission-transition.registry';
import { MissionsController } from './mission.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mission]),
    forwardRef(() => DronesModule),
  ],
  controllers: [MissionsController],
  providers: [
    MissionsService,
    MissionStateMachine,
    MissionTransitionRegistry,
    {
      provide: MISSION_REPOSITORY,
      useClass: TypeormMissionRepository,
    },
    {
      provide: ACTIVE_MISSION_CHECKER,
      useClass: MissionActiveCheckerAdapter,
    },
  ],
  exports: [ACTIVE_MISSION_CHECKER, MISSION_REPOSITORY],
})
export class MissionsModule {}
