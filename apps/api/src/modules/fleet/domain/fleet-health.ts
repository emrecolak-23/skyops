import { DroneStatus } from '@skyops/shared';
import { MaintenancePolicy } from 'src/modules/drones/domain/maintenance/maintenance-policy';
import { Drone } from 'src/modules/drones/entities/drone.entity';
import { buildMaintenanceContext } from 'src/modules/drones/domain/maintenance/maintenance-context';

export interface StatusCount {
  status: DroneStatus;
  count: number;
}

export interface StatusBreakdown {
  AVAILABLE: number;
  IN_MISSION: number;
  MAINTENANCE: number;
  RETIRED: number;
}

export function buildStatusBreakdown(counts: StatusCount[]): StatusBreakdown {
  const breakdown: StatusBreakdown = {
    AVAILABLE: 0,
    IN_MISSION: 0,
    MAINTENANCE: 0,
    RETIRED: 0,
  };

  counts.forEach((count) => {
    breakdown[count.status] = count.count;
  });

  return breakdown;
}

export function totalFromBreakdown(breakdown: StatusBreakdown): number {
  return (
    breakdown.AVAILABLE +
    breakdown.IN_MISSION +
    breakdown.MAINTENANCE +
    breakdown.RETIRED
  );
}

export function filterOverdueDrones(
  drones: Drone[],
  policy: MaintenancePolicy,
  now: Date,
): Drone[] {
  return drones.filter((drone) => {
    if (drone.status === DroneStatus.RETIRED) return false;

    const ctx = buildMaintenanceContext(drone, now);
    return policy.evaluate(ctx).isDue;
  });
}
