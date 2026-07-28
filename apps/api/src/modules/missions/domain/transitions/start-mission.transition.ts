import { DroneStatus, MissionStatus } from '@skyops/shared';
import { MissionTransition, TransitionContext } from './mission-transition';
import {
  DroneMaintenanceDueError,
  DroneNotAvailableError,
} from '../mission.errors';

export class StartMissionTransition implements MissionTransition {
  readonly to = MissionStatus.IN_PROGRESS;

  apply(ctx: TransitionContext): void {
    if (ctx.drone.status !== DroneStatus.AVAILABLE) {
      throw new DroneNotAvailableError(ctx.drone.id);
    }

    if (ctx.maintenanceDue) {
      throw new DroneMaintenanceDueError(ctx.drone.id);
    }

    ctx.mission.status = this.to;
    ctx.mission.actualStart = ctx.now;
    ctx.drone.status = DroneStatus.IN_MISSION;
  }
}
