"use client";

import { use } from "react";
import { Box, Loader, Center, Alert } from "@mantine/core";
import { useMission } from "@/features/missions/hooks";
import { MissionDetailHeader } from "@/features/missions/components/MissionDetailHeader";
import { MissionInfoCards } from "@/features/missions/components/MissionInfoCards";
import { MissionDroneAlert } from "@/features/missions/components/MissionDroneAlert";

export default function MissionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data: mission, isLoading, error } = useMission(id);

  if (isLoading)
    return (
      <Center h="100%">
        <Loader />
      </Center>
    );
  if (error) return <Alert color="red">{String(error)}</Alert>;
  if (!mission) return null;

  return (
    <Box style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <MissionDetailHeader mission={mission} />
      <MissionDroneAlert mission={mission} />
      <MissionInfoCards mission={mission} />
    </Box>
  );
}
