import { DomainError, DomainErrorKind } from 'src/common/errors/domain-error';

export class InvalidSerialNumberError extends DomainError {
  readonly kind = DomainErrorKind.Validation;
  constructor(serialNumber: string) {
    super(`Invalid serial number format: ${serialNumber}`);
  }
}

export class DuplicateSerialNumberError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  constructor(serialNumber: string) {
    super(`A drone with serial number ${serialNumber} already exists`);
  }
}

export class DroneNotFoundError extends DomainError {
  readonly kind = DomainErrorKind.NotFound;
  constructor(id: string) {
    super(`Drone not found: ${id}`);
  }
}

export class DroneCannotBeRetiredError extends DomainError {
  readonly kind = DomainErrorKind.Conflict;
  constructor(id: string) {
    super(`Drone ${id} cannot be retired while it has active missions`);
  }
}
