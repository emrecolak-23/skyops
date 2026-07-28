import { MissionStatus } from '@skyops/shared';
import { Mission } from '../../entities/mission.entity';
import { Drone } from 'src/modules/drones/entities/drone.entity';

export interface TransitionContext {
  mission: Mission;
  drone: Drone;
  now: Date;
  maintenanceDue: boolean;
  flightHoursLogged?: number;
  abortReason?: string;
}

export interface MissionTransition {
  readonly to: MissionStatus;
  apply(ctx: TransitionContext): void;
}
