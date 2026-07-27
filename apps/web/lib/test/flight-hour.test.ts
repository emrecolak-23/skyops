import { describe, it, expect } from "vitest";
import { formatFlightHours } from "../utils";

describe("formatFlightHours", () => {
  it("formats whole hours", () => {
    expect(formatFlightHours(2)).toBe("2h 0m");
  });

  it("formats fractional hours as minutes", () => {
    expect(formatFlightHours(2.5)).toBe("2h 30m");
  });

  it("formats quarter hours", () => {
    expect(formatFlightHours(1.25)).toBe("1h 15m");
  });

  it("handles zero", () => {
    expect(formatFlightHours(0)).toBe("0h 0m");
  });

  it("rounds to nearest minute", () => {
    // 1.008h = 60.5min -> rounds
    expect(formatFlightHours(1.008)).toBe("1h 0m");
  });
});
