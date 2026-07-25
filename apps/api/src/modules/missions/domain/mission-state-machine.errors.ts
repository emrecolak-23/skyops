import { MissionStatus } from '@skyops/shared';

export class InvalidMissionTransitionError extends Error {
  constructor(
    readonly from: MissionStatus,
    readonly to: MissionStatus,
  ) {
    super(`Invalid mission transition: ${from} -> ${to}`);
    this.name = 'InvalidMissionTransitionError';
  }
}
