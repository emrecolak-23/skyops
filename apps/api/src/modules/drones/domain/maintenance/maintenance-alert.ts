import { Drone } from '../../entities/drone.entity';
import { DroneStatus } from '@skyops/shared';
import { MaintenancePolicy } from './maintenance-policy';
import { buildMaintenanceContext } from './maintenance-context';

export function isMaintenanceDueSoon(
  drone: Drone,
  policy: MaintenancePolicy,
  now: Date,
  withinDays = 7,
): boolean {
  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  if (drone.status === DroneStatus.RETIRED) return false;
  if (!drone.nextMaintenanceDueDate) return false;

  const ctx = buildMaintenanceContext(drone, now);
  if (policy.evaluate(ctx).isDue) return false;

  const due = drone.nextMaintenanceDueDate.getTime();
  const horizon = now.getTime() + withinDays * MS_PER_DAY;
  return due > now.getTime() && due <= horizon;
}
