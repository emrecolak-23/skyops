import { MissionStatus } from '@skyops/shared';

const RESCHEDULABLE_STATUSES: readonly MissionStatus[] = [
  MissionStatus.PLANNED,
  MissionStatus.PRE_FLIGHT_CHECK,
];

export function isReschedulable(status: MissionStatus): boolean {
  return RESCHEDULABLE_STATUSES.includes(status);
}
