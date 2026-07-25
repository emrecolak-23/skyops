import { DroneStatus, MissionStatus } from '@skyops/shared';
import { MissionTransition, TransitionContext } from './mission-transition';

export class AbortMissionTransition implements MissionTransition {
  readonly to = MissionStatus.ABORTED;

  apply(ctx: TransitionContext): void {
    ctx.mission.status = MissionStatus.ABORTED;
    ctx.mission.actualEnd = ctx.now;
    ctx.mission.abortReason = ctx.abortReason ?? null;

    if (ctx.drone.status === DroneStatus.IN_MISSION) {
      ctx.drone.status = DroneStatus.AVAILABLE;
    }
  }
}
