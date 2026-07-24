import { isValidSerialNumber } from './searial-number';

describe('isValidSerialNumber', () => {
  describe('valid formats', () => {
    it('accepts a mix of letters and digits', () => {
      expect(isValidSerialNumber('SKY-A1B2-C3D4')).toBe(true);
    });

    it('accepts digits only', () => {
      expect(isValidSerialNumber('SKY-0000-1111')).toBe(true);
    });

    it('accepts letters only', () => {
      expect(isValidSerialNumber('SKY-ABCD-EFGH')).toBe(true);
    });
  });

  describe('invalid formats', () => {
    it('rejects a missing SKY prefix', () => {
      expect(isValidSerialNumber('XYZ-A1B2-C3D4')).toBe(false);
    });

    it('rejects too few characters', () => {
      expect(isValidSerialNumber('SKY-A1B2-C3D')).toBe(false);
    });

    it('rejects too many characters', () => {
      expect(isValidSerialNumber('SKY-A1B2-C3D45')).toBe(false);
    });

    it('rejects extra segments', () => {
      expect(isValidSerialNumber('SKY-A1B2-C3D4-E5F6')).toBe(false);
    });

    it('rejects lowercase', () => {
      expect(isValidSerialNumber('sky-a1b2-c3d4')).toBe(false);
    });

    it('rejects trailing whitespace', () => {
      expect(isValidSerialNumber('SKY-A1B2-C3D4 ')).toBe(false);
    });

    it('rejects an empty string', () => {
      expect(isValidSerialNumber('')).toBe(false);
    });

    it('rejects wrong separators', () => {
      expect(isValidSerialNumber('SKY_A1B2_C3D4')).toBe(false);
    });
  });
});
