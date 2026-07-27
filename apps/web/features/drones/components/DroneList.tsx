"use client";

import { Table, Badge, Text, ScrollArea } from "@mantine/core";
import { useRouter } from "next/navigation";
import { formatFlightHours } from "@/lib/utils";
import { STATUS_COLORS } from "../constants";
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
            <Table.Th>Serial</Table.Th>
            <Table.Th>Model</Table.Th>
            <Table.Th>Status</Table.Th>
            <Table.Th>Flight Hours</Table.Th>
            <Table.Th>Maintenance</Table.Th>
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
              <Table.Td>{drone.model}</Table.Td>
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
