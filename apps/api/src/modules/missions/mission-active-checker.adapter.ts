import { Inject, Injectable } from '@nestjs/common';
import { ActiveMissionChecker } from 'src/modules/drones/ports';
import { MISSION_REPOSITORY } from './repositories/mission.repository';
import type { IMissionRepository } from './repositories/mission.repository';

@Injectable()
export class MissionActiveCheckerAdapter implements ActiveMissionChecker {
  constructor(
    @Inject(MISSION_REPOSITORY) private readonly missions: IMissionRepository,
  ) {}

  async hasActiveMissions(droneId: string): Promise<boolean> {
    const count = await this.missions.countActiveByDroneId(droneId);
    return count > 0;
  }
}
