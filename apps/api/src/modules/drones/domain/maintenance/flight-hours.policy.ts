import {
  MaintenanceContext,
  MaintenanceDue,
  MaintenancePolicy,
} from './maintenance-policy';

export class FlightHoursPolicy implements MaintenancePolicy {
  constructor(private readonly threshold: number) {}

  evaluate(ctx: MaintenanceContext): MaintenanceDue {
    const isDue = ctx.flightHoursSinceBaseline >= this.threshold;
    return {
      isDue,
      dueDate: null,
      reason: isDue
        ? `${this.threshold} flight hours since last maintenance`
        : null,
    };
  }
}
