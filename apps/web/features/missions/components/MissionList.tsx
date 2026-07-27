"use client";

import { Table, Badge, Text, ScrollArea } from "@mantine/core";
import { useRouter } from "next/navigation";
import { Mission } from "@/lib/types";
import { STATUS_COLORS } from "../constants";

export function MissionList({ missions }: { missions: Mission[] }) {
  const router = useRouter();

  if (missions.length === 0) {
    return <Text c="dimmed">No missions found.</Text>;
  }

  return (
    <ScrollArea style={{ flex: 1, minHeight: 0 }}>
      <Table stickyHeader highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Type</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Pilot</Table.Th>
            <Table.Th>Planned Start</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {missions.map((m) => (
            <Table.Tr
              key={m.id}
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/missions/${m.id}`)}
            >
              <Table.Td fw={500}>{m.name}</Table.Td>
              <Table.Td>{m.type}</Table.Td>
              <Table.Td>
                <Badge color={STATUS_COLORS[m.status]} variant="light">
                  {m.status}
                </Badge>
              </Table.Td>
              <Table.Td>{m.pilotName}</Table.Td>
              <Table.Td>{new Date(m.plannedStart).toLocaleString()}</Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
