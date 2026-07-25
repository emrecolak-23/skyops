export const ACTIVE_MISSION_CHECKER = Symbol('ACTIVE_MISSION_CHECKER');

export interface ActiveMissionChecker {
  hasActiveMissions(droneId: string): Promise<boolean>;
}
