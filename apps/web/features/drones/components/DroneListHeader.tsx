"use client";

import { Group, Title, Badge } from "@mantine/core";
import { Drone } from "@/lib/types";
import { STATUS_COLORS } from "../constants";

export function DroneDetailHeader({ drone }: { drone: Drone }) {
  return (
    <Group>
      <Title order={2}>{drone.serialNumber}</Title>
      <Badge
        data-testid="drone-status"
        color={STATUS_COLORS[drone.status]}
        size="lg"
        variant="light"
      >
        {drone.status}
      </Badge>
      {drone.maintenanceDue && (
        <Badge color="red" variant="light">
          Maintenance Due
        </Badge>
      )}
    </Group>
  );
}
