"use client";

import { Table, Badge, Text, ScrollArea } from "@mantine/core";
import { useRouter } from "next/navigation";
import { Mission } from "@/lib/types";
import { STATUS_COLORS, MISSION_TABLE_HEADERS } from "../constants";
import { humanizeEnum } from "@/lib/utils";

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
            {MISSION_TABLE_HEADERS.map(({ label, key }) => (
              <Table.Th key={key}>{label}</Table.Th>
            ))}
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
              <Table.Td>{humanizeEnum(m.type)}</Table.Td>
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
