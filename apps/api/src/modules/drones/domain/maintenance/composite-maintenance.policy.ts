import {
  MaintenanceContext,
  MaintenanceDue,
  MaintenancePolicy,
} from './maintenance-policy';

export class CompositeMaintenancePolicy implements MaintenancePolicy {
  constructor(private readonly policies: MaintenancePolicy[]) {}

  evaluate(ctx: MaintenanceContext): MaintenanceDue {
    const results = this.policies.map((policy) => policy.evaluate(ctx));

    const isDue = results.some((r) => r.isDue);

    const dueDate = results.find((r) => r.dueDate !== null)?.dueDate ?? null;

    const reason = isDue
      ? results
          .filter((r) => r.isDue && r.reason !== null)
          .map((r) => r.reason)
          .join('; ')
      : null;

    return { isDue, dueDate, reason };
  }
}
