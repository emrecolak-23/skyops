"use client";

import { Group, Title, Badge } from "@mantine/core";
import { Mission } from "@/lib/types";
import { MissionActions } from "@/features/missions/components/MissionActions";
import { STATUS_COLORS } from "@/features/missions/constants";

export function MissionDetailHeader({ mission }: { mission: Mission }) {
  return (
    <Group justify="space-between">
      <Group>
        <Title order={2}>{mission.name}</Title>
        <Badge
          data-testid="mission-status"
          color={STATUS_COLORS[mission.status]}
          size="lg"
          variant="light"
        >
          {mission.status}
        </Badge>
        {mission.maintenanceDue && (
          <Badge color="orange" variant="light">
            Drone maintenance due
          </Badge>
        )}
      </Group>
      <MissionActions mission={mission} />
    </Group>
  );
}
