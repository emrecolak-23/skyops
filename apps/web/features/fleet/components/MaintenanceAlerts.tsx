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
import Link from "next/link";
import { FleetHealth } from "@/lib/types";
import { humanizeEnum } from "@/lib/utils";

export function MaintenanceAlerts({ health }: { health: FleetHealth }) {
  const overdue = health.overdueMaintenance;

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      h="100%"
      style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      {/* fixed header row — doesn't scroll */}
      <Group justify="space-between" mb="md" style={{ flexShrink: 0 }}>
        <Title order={3}>Maintenance Alerts</Title>
        <Badge color={overdue.length > 0 ? "red" : "green"} variant="light">
          {overdue.length} overdue
        </Badge>
      </Group>

      {overdue.length === 0 ? (
        <Text c="dimmed">No drones require maintenance.</Text>
      ) : (
        <ScrollArea style={{ flex: 1, minHeight: 0 }}>
          <Table stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Serial</Table.Th>
                <Table.Th>Model</Table.Th>
                <Table.Th>Due Date</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {overdue.map((drone) => (
                <Table.Tr key={drone.id}>
                  <Table.Td>
                    <Link href={`/drones/${drone.id}`}>
                      {drone.serialNumber}
                    </Link>
                  </Table.Td>
                  <Table.Td>{humanizeEnum(drone.model)}</Table.Td>{" "}
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
