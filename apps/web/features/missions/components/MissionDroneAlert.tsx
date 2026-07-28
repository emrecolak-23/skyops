"use client";

import { Alert } from "@mantine/core";
import { IconAlertTriangle } from "@tabler/icons-react";
import { Mission } from "@/lib/types";
import { useDrone } from "@/features/drones/hooks";
import { assignabilityReason, isAssignableForMission } from "@/lib/utils";
import { RESCHEDULABLE_STATUSES } from "@/features/missions/constants";

export function MissionDroneAlert({ mission }: { mission: Mission }) {
  const { data: drone } = useDrone(mission.droneId);

  if (!drone || isAssignableForMission(drone)) return null;
  if (!RESCHEDULABLE_STATUSES.includes(mission.status)) return null;

  return (
    <Alert
      color="orange"
      variant="light"
      icon={<IconAlertTriangle size={16} />}
      title="This mission cannot start yet"
    >
      {drone.serialNumber} is {assignabilityReason(drone)}. Reschedule the
      mission or assign another drone before the planned start.
    </Alert>
  );
}
