import { Table, Badge, Text, ScrollArea } from "@mantine/core";
import { STATUS_COLORS } from "../../missions/constants";
import { MissionStatus } from "@skyops/shared";
import { Mission } from "@/lib/types";
import { useRouter } from "next/navigation";

export function MissionTable({
  missions,
  dateField,
}: {
  missions: Mission[];
  dateField: "plannedStart" | "actualEnd";
}) {
  const router = useRouter();
  if (missions.length === 0) {
    return <Text c="dimmed">No missions.</Text>;
  }
  return (
    <ScrollArea style={{ height: "100%", minHeight: 0 }}>
      <Table stickyHeader highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Name</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Date</Table.Th>
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
