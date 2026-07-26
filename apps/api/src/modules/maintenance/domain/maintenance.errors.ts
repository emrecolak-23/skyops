import { DomainError, DomainErrorKind } from 'src/common/errors/domain-error';

export class MaintenanceLogNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  constructor(id: string) {
    super(`Maintenance log not found: ${id}`);
  }
}

export class InconsistentFlightHoursError extends DomainError {
  readonly kind = DomainErrorKind.Validation;
  constructor(recorded: number, actual: number) {
    super(
      `Recorded flight hours (${recorded}) are inconsistent with the drone's actual total (${actual})`,
    );
  }
}

export class MaintenanceAlreadyCompletedError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  constructor(id: string) {
    super(`Maintenance log ${id} is already completed`);
  }
}

export class DroneNotAvailableForMaintenanceError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  constructor(droneId: string) {
    super(
      `Drone ${droneId} is not available for maintenance (in mission or retired)`,
    );
  }
}
