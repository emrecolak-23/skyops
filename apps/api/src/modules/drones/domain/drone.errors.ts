export class InvalidSerialNumberError extends Error {
  constructor(serialNumber: string) {
    super(`Invalid serial number format: ${serialNumber}`);
    this.name = 'InvalidSerialNumberError';
  }
}

export class DuplicateSerialNumberError extends Error {
  constructor(serialNumber: string) {
    super(`A drone with serial number ${serialNumber} already exists`);
    this.name = 'DuplicateSerialNumberError';
  }
}

export class DroneNotFoundError extends Error {
  constructor(id: string) {
    super(`Drone not found: ${id}`);
    this.name = 'DroneNotFoundError';
  }
}

export class DroneCannotBeRetiredError extends Error {
  constructor(id: string) {
    super(`Drone ${id} cannot be retired while it has active missions`);
    this.name = 'DroneCannotBeRetiredError';
  }
}
