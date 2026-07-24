import { MaintenanceDue, MaintenancePolicy } from './maintenance-policy';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export class CalendarIntervalPolicy implements MaintenancePolicy {
  constructor(private readonly intervalDays: number) {}

  evaluate(baseline: Date, now: Date): MaintenanceDue {
    const dueDate = new Date(
      baseline.getTime() + this.intervalDays * MS_PER_DAY,
    );

    const isDue = now.getTime() >= dueDate.getTime();

    return {
      isDue,
      dueDate,
      reason: isDue
        ? `${this.intervalDays} days elapsed since last maintenance`
        : null,
    };
  }
}
