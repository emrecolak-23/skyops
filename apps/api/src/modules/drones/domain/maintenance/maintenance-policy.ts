export interface MaintenanceDue {
  isDue: boolean;
  dueDate: Date | null;
  reason: string | null;
}

export interface MaintenancePolicy {
  evaluate(baseline: Date, now: Date): MaintenanceDue;
}
