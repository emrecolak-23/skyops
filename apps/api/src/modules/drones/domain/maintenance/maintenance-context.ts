import { MaintenanceContext } from './maintenance-policy';

export function buildMaintenanceContext(
  input: {
    lastMaintenanceDate: Date | null;
    registeredAt: Date;
    totalFlightHours: number;
    flightHoursAtLastMaintenance: number;
  },
  now: Date,
): MaintenanceContext {
  return {
    baseline: input.lastMaintenanceDate ?? input.registeredAt,
    flightHoursSinceBaseline:
      Number(input.totalFlightHours) -
      Number(input.flightHoursAtLastMaintenance),
    now,
  };
}
