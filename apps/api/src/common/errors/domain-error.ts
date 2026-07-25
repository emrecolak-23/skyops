export enum DomainErrorKind {
  NotFound = 'NOT_FOUND',
  Conflict = 'CONFLICT',
  Validation = 'VALIDATION',
}

export abstract class DomainError extends Error {
  abstract readonly kind: DomainErrorKind;

  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
