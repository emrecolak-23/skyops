export const MAINTENANCE_POLICY = Symbol('MAINTENANCE_POLICY');
export interface MaintenanceContext {
  baseline: Date;
  flightHoursSinceBaseline: number;
  now: Date;
}

export interface MaintenanceDue {
  isDue: boolean;
  dueDate: Date | null;
  reason: string | null;
}

export interface MaintenancePolicy {
  evaluate(ctx: MaintenanceContext): MaintenanceDue;
}
