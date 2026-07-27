"use client";

import { Card, Title, Tabs } from "@mantine/core";
import { MissionStatus } from "@skyops/shared";
import { useMissions } from "@/features/missions/hooks";
import { MissionTable } from "./MissionTable";

export function MissionView() {
  const upcoming = useMissions({ status: MissionStatus.PLANNED, limit: 5 });
  const recent = useMissions({ status: MissionStatus.COMPLETED, limit: 5 });

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      h="100%"
      style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Title order={3} mb="md" style={{ flexShrink: 0 }}>
        Missions
      </Title>
      <Tabs
        defaultValue="upcoming"
        style={{
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Tabs.List mb="md" style={{ flexShrink: 0 }}>
          <Tabs.Tab value="upcoming">Upcoming</Tabs.Tab>
          <Tabs.Tab value="recent">Recent</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="upcoming" style={{ flex: 1, minHeight: 0 }}>
          <MissionTable
            missions={upcoming.data?.data ?? []}
            dateField="plannedStart"
          />
        </Tabs.Panel>
        <Tabs.Panel value="recent" style={{ flex: 1, minHeight: 0 }}>
          <MissionTable
            missions={recent.data?.data ?? []}
            dateField="actualEnd"
          />
        </Tabs.Panel>
      </Tabs>
    </Card>
  );
}
