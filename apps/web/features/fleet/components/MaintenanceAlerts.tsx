"use client";

import {
  Card,
  Title,
  Table,
  Badge,
  Text,
  Group,
  ScrollArea,
} from "@mantine/core";
import { FleetHealth } from "@/lib/types";
import { humanizeEnum } from "@/lib/utils";
import { useRouter } from "next/navigation";

type AlertDrone = FleetHealth["overdueMaintenance"][number] & {
  kind: "overdue" | "dueSoon";
};

export function MaintenanceAlerts({ health }: { health: FleetHealth }) {
  const router = useRouter();
  const overdue = health.overdueMaintenance;
  const dueSoon = health.dueSoonMaintenance;

  const overdueIds = new Set(overdue.map((d) => d.id));
  const rows: AlertDrone[] = [
    ...overdue.map((d) => ({ ...d, kind: "overdue" as const })),
    ...dueSoon
      .filter((d) => !overdueIds.has(d.id))
      .map((d) => ({ ...d, kind: "dueSoon" as const })),
  ];
  const isEmpty = rows.length === 0;

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      h="100%"
      style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Group justify="space-between" mb="md" style={{ flexShrink: 0 }}>
        <Title order={3}>Maintenance Alerts</Title>
        <Badge
          color={
            overdue.length > 0 ? "red" : rows.length > 0 ? "orange" : "green"
          }
          variant="light"
        >
          {rows.length} alert{rows.length === 1 ? "" : "s"}
        </Badge>
      </Group>

      {isEmpty ? (
        <Text c="dimmed">No drones require maintenance.</Text>
      ) : (
        <ScrollArea style={{ flex: 1, minHeight: 0 }}>
          <Table stickyHeader highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Serial</Table.Th>
                <Table.Th>Model</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Due Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((drone) => (
                <Table.Tr
                  key={drone.id}
                  style={{
                    cursor: "pointer",
                    ...(drone.kind === "overdue"
                      ? { backgroundColor: "var(--mantine-color-red-0)" }
                      : {}),
                  }}
                  onClick={() => router.push(`/drones/${drone.id}`)}
                >
                  <Table.Td>{drone.serialNumber}</Table.Td>
                  <Table.Td>{humanizeEnum(drone.model)}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={drone.kind === "overdue" ? "red" : "orange"}
                      variant="light"
                    >
                      {drone.kind === "overdue" ? "Overdue" : "Due soon"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {drone.nextMaintenanceDueDate
                      ? new Date(
                          drone.nextMaintenanceDueDate,
                        ).toLocaleDateString()
                      : "—"}
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      )}
    </Card>
  );
}
