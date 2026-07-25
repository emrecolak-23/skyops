import { MissionStatus } from '@skyops/shared';
import { InvalidMissionTransitionError } from './mission-state-machine.errors';

export class MissionStateMachine {
  private static readonly GRAPH: Readonly<
    Record<MissionStatus, readonly MissionStatus[]>
  > = {
    [MissionStatus.PLANNED]: [
      MissionStatus.PRE_FLIGHT_CHECK,
      MissionStatus.ABORTED,
    ],
    [MissionStatus.PRE_FLIGHT_CHECK]: [
      MissionStatus.IN_PROGRESS,
      MissionStatus.ABORTED,
    ],
    [MissionStatus.IN_PROGRESS]: [
      MissionStatus.COMPLETED,
      MissionStatus.ABORTED,
    ],
    [MissionStatus.COMPLETED]: [],
    [MissionStatus.ABORTED]: [],
  };

  canTransition(from: MissionStatus, to: MissionStatus): boolean {
    return MissionStateMachine.GRAPH[from].includes(to);
  }

  assertTransition(from: MissionStatus, to: MissionStatus): void {
    if (!this.canTransition(from, to)) {
      throw new InvalidMissionTransitionError(from, to);
    }
  }

  allowedTransitions(from: MissionStatus): MissionStatus[] {
    return [...MissionStateMachine.GRAPH[from]];
  }
}
