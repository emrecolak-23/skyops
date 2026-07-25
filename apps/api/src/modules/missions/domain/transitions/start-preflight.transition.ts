import { MissionStatus } from '@skyops/shared';
import { MissionTransition, TransitionContext } from './mission-transition';

export class StartPreFlightTransition implements MissionTransition {
  readonly to = MissionStatus.PRE_FLIGHT_CHECK;

  apply(ctx: TransitionContext): void {
    ctx.mission.status = this.to;
  }
}
