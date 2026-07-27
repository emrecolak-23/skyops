import { describe, it, expect } from "vitest";
import { humanizeEnum } from "../utils";

describe("humanizeEnum", () => {
  it("converts single word", () => {
    expect(humanizeEnum("AVAILABLE")).toBe("Available");
  });

  it("converts snake_case to title case", () => {
    expect(humanizeEnum("ROUTINE_CHECK")).toBe("Routine Check");
  });

  it("handles multiple underscores", () => {
    expect(humanizeEnum("MAVIC_3_ENTERPRISE")).toBe("Mavic 3 Enterprise");
  });

  it("converts mission type", () => {
    expect(humanizeEnum("WIND_TURBINE_INSPECTION")).toBe(
      "Wind Turbine Inspection",
    );
  });
});
