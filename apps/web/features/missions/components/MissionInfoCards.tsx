"use client";

import { Card, Text, SimpleGrid, Anchor } from "@mantine/core";
import Link from "next/link";
import { Mission } from "@/lib/types";
import { formatFlightHours, formatDuration } from "@/lib/utils";

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card withBorder padding="md" radius="sm">
      <Text size="xs" c="dimmed">
        {label}
      </Text>
      <Text fw={600}>{value}</Text>
    </Card>
  );
}

export function MissionInfoCards({ mission }: { mission: Mission }) {
  return (
    <SimpleGrid cols={{ base: 2, sm: 3 }} spacing="md">
      <Info label="Type" value={mission.type} />
      <Info label="Pilot" value={mission.pilotName} />
      <Info label="Site" value={mission.siteLocation} />
      <Info
        label="Planned Start"
        value={new Date(mission.plannedStart).toLocaleString()}
      />
      <Info
        label="Planned End"
        value={new Date(mission.plannedEnd).toLocaleString()}
      />
      <Info
        label="Drone"
        value={
          <Anchor component={Link} href={`/drones/${mission.droneId}`}>
            {mission.droneSerialNumber ?? "View drone"}
          </Anchor>
        }
      />
      <Info
        label="Planned Duration"
        value={formatDuration(mission.plannedStart, mission.plannedEnd)}
      />
      {mission.actualStart && mission.actualEnd && (
        <Info
          label="Actual Duration"
          value={formatDuration(mission.actualStart, mission.actualEnd)}
        />
      )}
      {mission.actualStart && (
        <Info
          label="Actual Start"
          value={new Date(mission.actualStart).toLocaleString()}
        />
      )}
      {mission.actualEnd && (
        <Info
          label="Actual End"
          value={new Date(mission.actualEnd).toLocaleString()}
        />
      )}
      {mission.flightHoursLogged != null && (
        <Info
          label="Flight Hours"
          value={formatFlightHours(mission.flightHoursLogged)}
        />
      )}
      {mission.abortReason && (
        <Info label="Abort Reason" value={mission.abortReason} />
      )}
    </SimpleGrid>
  );
}
