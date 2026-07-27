"use client";

import { Card, Group, Text, Title, SimpleGrid, Badge } from "@mantine/core";
import { DroneStatus } from "@skyops/shared";
import { FleetHealth } from "@/lib/types";

const STATUS_COLORS: Record<DroneStatus, string> = {
  [DroneStatus.AVAILABLE]: "green",
  [DroneStatus.IN_MISSION]: "blue",
  [DroneStatus.MAINTENANCE]: "orange",
  [DroneStatus.RETIRED]: "gray",
};

const STATUS_LABELS: Record<DroneStatus, string> = {
  [DroneStatus.AVAILABLE]: "Available",
  [DroneStatus.IN_MISSION]: "In Mission",
  [DroneStatus.MAINTENANCE]: "Maintenance",
  [DroneStatus.RETIRED]: "Retired",
};

export function FleetOverview({ health }: { health: FleetHealth }) {
  return (
    <Card withBorder padding="lg" radius="md">
      <Group justify="space-between" mb="md">
        <Title order={3}>Fleet Overview</Title>
        <Badge size="lg" variant="light">
          {health.totalDrones} drones
        </Badge>
      </Group>

      <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
        {(Object.values(DroneStatus) as DroneStatus[]).map((status) => (
          <Card key={status} withBorder padding="md" radius="sm">
            <Text size="xl" fw={700}>
              {health.statusBreakdown[status] ?? 0}
            </Text>
            <Badge color={STATUS_COLORS[status]} variant="light" mt={4}>
              {STATUS_LABELS[status]}
            </Badge>
          </Card>
        ))}
      </SimpleGrid>

      <Group mt="lg" gap="xl">
        <div>
          <Text size="sm" c="dimmed">
            Avg Flight Hours
          </Text>
          <Text size="lg" fw={600}>
            {health.averageFlightHours.toFixed(2)}h
          </Text>
        </div>
        <div>
          <Text size="sm" c="dimmed">
            Missions (next 24h)
          </Text>
          <Text size="lg" fw={600}>
            {health.missionsNext24Hours}
          </Text>
        </div>
      </Group>
    </Card>
  );
}
