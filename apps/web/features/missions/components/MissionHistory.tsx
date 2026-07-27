"use client";

import { Card, Title, Table, Badge, Text, ScrollArea } from "@mantine/core";
import { useRouter } from "next/navigation";
import { useMissions } from "@/features/missions/hooks";
import { STATUS_COLORS } from "../constants";

export function MissionHistory({ droneId }: { droneId: string }) {
  const router = useRouter();
  const { data, isLoading } = useMissions({ droneId, limit: 20 });
  const missions = data?.data ?? [];

  return (
    <Card
      withBorder
      padding="lg"
      radius="md"
      h="100%"
      style={{ display: "flex", flexDirection: "column", minHeight: 0 }}
    >
      <Title order={4} mb="md" style={{ flexShrink: 0 }}>
        Mission History
      </Title>

      {isLoading ? (
        <Text c="dimmed">Loading...</Text>
      ) : missions.length === 0 ? (
        <Text c="dimmed">No missions for this drone.</Text>
      ) : (
        <ScrollArea style={{ flex: 1, minHeight: 0 }}>
          <Table stickyHeader highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Planned</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {missions.map((m) => (
                <Table.Tr
                  key={m.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/missions/${m.id}`)}
                >
                  <Table.Td>{m.name}</Table.Td>
                  <Table.Td>
                    <Badge
                      color={STATUS_COLORS[m.status]}
                      variant="light"
                      size="sm"
                    >
                      {m.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {new Date(m.plannedStart).toLocaleDateString()}
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
