"use client";

import { Card, Title, Table, Badge, Text, ScrollArea } from "@mantine/core";
import { MaintenanceStatus } from "@skyops/shared";
import { useMaintenanceLogs } from "@/features/maintenance/hooks";
import { formatFlightHours, humanizeEnum } from "@/lib/utils";

export function MaintenanceHistory({ droneId }: { droneId: string }) {
  const { data, isLoading } = useMaintenanceLogs(droneId);
  const logs = data?.data ?? [];

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      h="100%"
      style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Title order={4} mb="md" style={{ flexShrink: 0 }}>
        Maintenance History
      </Title>

      {isLoading ? (
        <Text c="dimmed">Loading...</Text>
      ) : logs.length === 0 ? (
        <Text c="dimmed">No maintenance logs for this drone.</Text>
      ) : (
        <ScrollArea style={{ flex: 1, minHeight: 0 }}>
          <Table stickyHeader>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Technician</Table.Th>
                <Table.Th>Hours</Table.Th>
                <Table.Th>Started</Table.Th>
                <Table.Th>Completed</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {logs.map((log) => (
                <Table.Tr key={log.id}>
                  <Table.Td>{humanizeEnum(log.type)}</Table.Td>{" "}
                  <Table.Td>
                    <Badge
                      color={
                        log.status === MaintenanceStatus.COMPLETED
                          ? "green"
                          : "orange"
                      }
                      variant="light"
                      size="sm"
                    >
                      {log.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>{log.technicianName}</Table.Td>
                  <Table.Td>
                    {formatFlightHours(log.flightHoursAtMaintenance)}
                  </Table.Td>
                  <Table.Td>
                    {new Date(log.startedAt).toLocaleDateString()}
                  </Table.Td>
                  <Table.Td>
                    {log.completedAt
                      ? new Date(log.completedAt).toLocaleDateString()
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
