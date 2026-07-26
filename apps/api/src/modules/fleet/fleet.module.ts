import { Module } from '@nestjs/common';
import { DronesModule } from 'src/modules/drones/drones.module';
import { MissionsModule } from '../missions/mission.module';
import { FleetController } from './fleet.controller';
import { FleetService } from './fleet.service';

@Module({
  imports: [DronesModule, MissionsModule],
  controllers: [FleetController],
  providers: [FleetService],
})
export class FleetModule {}
