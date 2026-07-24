import {
  MaintenanceContext,
  MaintenanceDue,
  MaintenancePolicy,
} from './maintenance-policy';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class CalendarIntervalPolicy implements MaintenancePolicy {
  constructor(private readonly intervalDays: number) {}

  evaluate(ctx: MaintenanceContext): MaintenanceDue {
    const dueDate = new Date(
      ctx.baseline.getTime() + this.intervalDays * MS_PER_DAY,
    );
    const isDue = ctx.now.getTime() >= dueDate.getTime();

    return {
      isDue,
      dueDate,
      reason: isDue
        ? `${this.intervalDays} days elapsed since last maintenance`
        : null,
    };
  }
}
