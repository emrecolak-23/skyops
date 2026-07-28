import { describe, it, expect } from "vitest";
import { shiftWindow } from "../utils";

describe("shiftWindow", () => {
  it("moves both ends by whole days", () => {
    const next = shiftWindow(
      "2026-08-05 09:00:00",
      "2026-08-05 11:00:00",
      1,
      "day",
    );

    expect(next.start).toBe("2026-08-06 09:00:00");
    expect(next.end).toBe("2026-08-06 11:00:00");
  });

  it("preserves the window length when shifting by a week", () => {
    const next = shiftWindow(
      "2026-08-05 09:00:00",
      "2026-08-05 12:30:00",
      1,
      "week",
    );

    expect(next.start).toBe("2026-08-12 09:00:00");
    expect(next.end).toBe("2026-08-12 12:30:00");
  });
});
