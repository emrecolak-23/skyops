"use client";

import { use, useState } from "react";
import { Box, Group, SimpleGrid, Loader, Center, Alert } from "@mantine/core";
import { useDrone } from "@/features/drones/hooks";
import { useMaintenanceLogs } from "@/features/maintenance/hooks";
import { DroneDetailHeader } from "@/features/drones/components/DroneListHeader";
import { DroneActions } from "@/features/drones/components/DroneActions";
import { DroneInfoCards } from "@/features/drones/components/DroneInfoCards";
import { MissionHistory } from "@/features/missions/components/MissionHistory";

export default function DroneDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: drone, isLoading, error } = useDrone(id);
  const logs = useMaintenanceLogs(id);
  const [maintenanceModalOpen, setMaintenanceModalOpen] = useState(false);

  if (isLoading)
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  if (error) return <Alert color="red">{String(error)}</Alert>;
  if (!drone) return null;

  const inProgressLog = logs.data?.data.find((l) => l.status === "IN_PROGRESS");

  return (
    <Box
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        minHeight: 0,
      }}
    >
      <Group justify="space-between" style={{ flexShrink: 0 }}>
        <DroneDetailHeader drone={drone} />
        <DroneActions
          drone={drone}
          inProgressLog={inProgressLog}
          onStartMaintenance={() => setMaintenanceModalOpen(true)}
        />
      </Group>

      <DroneInfoCards drone={drone} />

      <SimpleGrid
        cols={{ base: 1, md: 2 }}
        spacing="lg"
        style={{ flex: 1, minHeight: 0 }}
      >
        <MissionHistory droneId={id} />
      </SimpleGrid>
    </Box>
  );
}
