"use client";

import { Stack, Title, Loader, Center, Alert, SimpleGrid } from "@mantine/core";
import { useFleetHealth } from "@/features/fleet/hooks";
import { FleetOverview } from "@/features/fleet/components/FleetOverview";
import { MaintenanceAlerts } from "@/features/fleet/components/MaintenanceAlerts";
import { MissionView } from "@/features/fleet/components/MissionView";

export default function DashboardPage() {
  const { data: health, isLoading, error } = useFleetHealth();

  return (
    <Stack gap="lg" style={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
      <Title order={2} style={{ flexShrink: 0 }}>
        Dashboard
      </Title>

      {isLoading && (
        <Center py="xl">
          <Loader />
        </Center>
      )}
      {error && (
        <Alert color="red" title="Error">
          {String(error)}
        </Alert>
      )}

      {health && (
        <>
          <div style={{ flexShrink: 0 }}>
            <FleetOverview health={health} />
          </div>
          <SimpleGrid
            cols={{ base: 1, md: 2 }}
            spacing="lg"
            style={{ flex: 1, minHeight: 0 }}
            styles={{
              container: {
                height: "100%",
                minHeight: 0,
              },
            }}
          >
            <div style={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
              <MaintenanceAlerts health={health} />
            </div>
            <div style={{ height: "100%", minHeight: 0, overflow: "hidden" }}>
              <MissionView />
            </div>
          </SimpleGrid>
        </>
      )}
    </Stack>
  );
}
