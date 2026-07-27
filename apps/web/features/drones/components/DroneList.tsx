"use client";

import { Table, Badge, Text, ScrollArea } from "@mantine/core";
import { useRouter } from "next/navigation";
import { formatFlightHours, humanizeEnum } from "@/lib/utils";
import { STATUS_COLORS, DRONE_LIST_TABLE_HEADERS } from "../constants";
import { Drone } from "@/lib/types";

export function DroneList({ drones }: { drones: Drone[] }) {
  const router = useRouter();

  if (drones.length === 0) {
    return <Text c="dimmed">No drones found.</Text>;
  }

  return (
    <ScrollArea style={{ flex: 1, minHeight: 0 }}>
      <Table stickyHeader highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            {DRONE_LIST_TABLE_HEADERS.map(({ label, key }) => (
              <Table.Th key={key}>{label}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {drones.map((drone) => (
            <Table.Tr
              key={drone.id}
              style={{ cursor: "pointer" }}
              onClick={() => router.push(`/drones/${drone.id}`)}
            >
              <Table.Td>{drone.serialNumber}</Table.Td>
              <Table.Td>{humanizeEnum(drone.model)}</Table.Td>{" "}
              <Table.Td>
                <Badge color={STATUS_COLORS[drone.status]} variant="light">
                  {drone.status}
                </Badge>
              </Table.Td>
              <Table.Td>{formatFlightHours(drone.totalFlightHours)}</Table.Td>
              <Table.Td>
                {drone.maintenanceDue ? (
                  <Badge color="red" variant="light">
                    Due
                  </Badge>
                ) : (
                  <Text size="sm" c="dimmed">
                    OK
                  </Text>
                )}
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
