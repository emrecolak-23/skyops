"use client";

import { SimpleGrid } from "@mantine/core";
import { Drone } from "@/lib/types";
import { formatFlightHours, formatDate } from "@/lib/utils";
import { humanizeEnum } from "@/lib/utils";
import { InfoCard } from "./DroneInfoCard";

export function DroneInfoCards({ drone }: { drone: Drone }) {
  const fields = [
    { label: "Model", value: humanizeEnum(drone.model) },
    { label: "Flight Hours", value: formatFlightHours(drone.totalFlightHours) },
    { label: "Last Maintenance", value: formatDate(drone.lastMaintenanceDate) },
    { label: "Next Due", value: formatDate(drone.nextMaintenanceDueDate) },
  ];

  return (
    <SimpleGrid
      cols={{ base: 2, sm: 4 }}
      spacing="md"
      style={{ flexShrink: 0 }}
    >
      {fields.map((field) => (
        <InfoCard key={field.label} label={field.label} value={field.value} />
      ))}
    </SimpleGrid>
  );
}
