import { Table, Badge, Text, ScrollArea } from "@mantine/core";
import Link from "next/link";
import { STATUS_COLORS } from "../../missions/constants";
import { MissionStatus } from "@skyops/shared";

export function MissionTable({
  missions,
  dateField,
}: {
  missions: any[];
  dateField: "plannedStart" | "actualEnd";
}) {
  if (missions.length === 0) {
    return <Text c="dimmed">No missions.</Text>;
  }
  return (
    <ScrollArea style={{ height: "100%", minHeight: 0 }}>
      <Table stickyHeader>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Date</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {missions.map((m) => (
            <Table.Tr key={m.id}>
              <Table.Td>
                <Link href={`/missions/${m.id}`}>{m.name}</Link>
              </Table.Td>
              <Table.Td>
                <Badge
                  color={STATUS_COLORS[m.status as MissionStatus]}
                  variant="light"
                >
                  {m.status}
                </Badge>
              </Table.Td>
              <Table.Td>
                {m[dateField]
                  ? new Date(m[dateField]).toLocaleDateString()
                  : "—"}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
