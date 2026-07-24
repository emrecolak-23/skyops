const SERIAL_NUMBER_PATTERN = /^SKY-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

export function isValidSerialNumber(value: string): boolean {
  return SERIAL_NUMBER_PATTERN.test(value);
}
