import { DroneStatus, MissionStatus } from '@skyops/shared';
import { MissionTransition, TransitionContext } from './mission-transition';

export class CompleteMissionTransition implements MissionTransition {
  readonly to = MissionStatus.COMPLETED;

  apply(ctx: TransitionContext): void {
    const hours = ctx.flightHoursLogged ?? 0;

    ctx.mission.status = MissionStatus.COMPLETED;
    ctx.mission.actualEnd = ctx.now;
    ctx.mission.flightHoursLogged = hours;

    ctx.drone.totalFlightHours = Number(ctx.drone.totalFlightHours) + hours;
    ctx.drone.status = DroneStatus.AVAILABLE;
  }
}
