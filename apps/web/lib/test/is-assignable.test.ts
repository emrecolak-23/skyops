import { describe, it, expect } from "vitest";
import { DroneModel, DroneStatus } from "@skyops/shared";
import { isAssignableForMission, assignabilityReason } from "../utils";
import { Drone } from "@/lib/types";

function makeDrone(overrides: Partial<Drone> = {}): Drone {
  return {
    id: "1",
    serialNumber: "SKY-TEST-0001",
    model: "PHANTOM_4" as DroneModel,
    status: DroneStatus.AVAILABLE,
    totalFlightHours: 0,
    lastMaintenanceDate: null,
    nextMaintenanceDueDate: null,
    registeredAt: new Date().toISOString(),
    notes: null,
    maintenanceDue: false,
    ...overrides,
  };
}

describe("isAssignableForMission", () => {
  it("allows AVAILABLE drone", () => {
    expect(
      isAssignableForMission(makeDrone({ status: DroneStatus.AVAILABLE })),
    ).toBe(true);
  });

  it("allows IN_MISSION drone (future scheduling)", () => {
    expect(
      isAssignableForMission(makeDrone({ status: DroneStatus.IN_MISSION })),
    ).toBe(true);
  });

  it("rejects RETIRED drone", () => {
    expect(
      isAssignableForMission(makeDrone({ status: DroneStatus.RETIRED })),
    ).toBe(false);
  });

  it("rejects MAINTENANCE drone", () => {
    expect(
      isAssignableForMission(makeDrone({ status: DroneStatus.MAINTENANCE })),
    ).toBe(false);
  });

  it("rejects drone with maintenance due", () => {
    expect(
      isAssignableForMission(
        makeDrone({ status: DroneStatus.AVAILABLE, maintenanceDue: true }),
      ),
    ).toBe(false);
  });
});

describe("assignabilityReason", () => {
  it("returns null for assignable AVAILABLE drone", () => {
    expect(
      assignabilityReason(makeDrone({ status: DroneStatus.AVAILABLE })),
    ).toBeNull();
  });

  it("explains retired", () => {
    expect(
      assignabilityReason(makeDrone({ status: DroneStatus.RETIRED })),
    ).toBe("retired");
  });

  it("explains maintenance due", () => {
    expect(assignabilityReason(makeDrone({ maintenanceDue: true }))).toBe(
      "maintenance due",
    );
  });

  it("labels on-mission drone", () => {
    expect(
      assignabilityReason(makeDrone({ status: DroneStatus.IN_MISSION })),
    ).toBe("on mission");
  });
});
