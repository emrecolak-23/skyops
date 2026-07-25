import { DomainError, DomainErrorKind } from 'src/common/errors/domain-error';

export class MissionNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  constructor(id: string) {
    super(`Mission not found: ${id}`);
  }
}

export class DroneNotAvailableError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  constructor(droneId: string) {
    super(`Drone ${droneId} is not available for this operation`);
  }
}

export class MissionOverlapError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  constructor(droneId: string) {
    super(
      `Drone ${droneId} already has a mission scheduled in this time range`,
    );
  }
}

export class MissionInPastError extends DomainError {
  readonly kind = DomainErrorKind.Validation;
  constructor() {
    super('Mission cannot be scheduled in the past');
  }
}

export class InvalidMissionScheduleError extends DomainError {
  readonly kind = DomainErrorKind.Validation;
  constructor() {
    super('Mission planned end must be after planned start');
  }
}
