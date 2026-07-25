import { Injectable } from '@nestjs/common';
import { ActiveMissionChecker } from './active-mission.checker';

@Injectable()
export class NoActiveMissionsChecker implements ActiveMissionChecker {
  hasActiveMissions(droneId: string): Promise<boolean> {
    return Promise.resolve(false);
  }
}
