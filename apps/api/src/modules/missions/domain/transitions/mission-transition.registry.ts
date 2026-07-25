import { MissionStatus } from '@skyops/shared';
import { MissionTransition } from './mission-transition';
import { StartPreFlightTransition } from './start-preflight.transition';
import { StartMissionTransition } from './start-mission.transition';
import { CompleteMissionTransition } from './complete-mission.transition';
import { AbortMissionTransition } from './abort-mission.transition';

export class MissionTransitionRegistry {
  private readonly transitions: Map<MissionStatus, MissionTransition>;
  constructor() {
    this.transitions = new Map<MissionStatus, MissionTransition>([
      [MissionStatus.PRE_FLIGHT_CHECK, new StartPreFlightTransition()],
      [MissionStatus.IN_PROGRESS, new StartMissionTransition()],
      [MissionStatus.COMPLETED, new CompleteMissionTransition()],
      [MissionStatus.ABORTED, new AbortMissionTransition()],
    ]);
  }

  resolve(to: MissionStatus): MissionTransition {
    const transition = this.transitions.get(to);
    if (!transition) {
      throw new Error(`No transition registered for target status: ${to}`);
    }
    return transition;
  }
}
