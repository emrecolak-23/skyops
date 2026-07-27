"use client";

import { SimpleGrid } from "@mantine/core";
import { Drone } from "@/lib/types";
import { formatFlightHours, formatDate } from "@/lib/utils";
import { InfoCard } from "./DroneInfoCard";

export function DroneInfoCards({ drone }: { drone: Drone }) {
  return (
    <SimpleGrid
      cols={{ base: 2, sm: 4 }}
      spacing="md"
      style={{ flexShrink: 0 }}
    >
      <InfoCard label="Model" value={drone.model} />
      <InfoCard
        label="Flight Hours"
        value={formatFlightHours(drone.totalFlightHours)}
      />
      <InfoCard
        label="Last Maintenance"
        value={formatDate(drone.lastMaintenanceDate)}
      />
      <InfoCard
        label="Next Due"
        value={formatDate(drone.nextMaintenanceDueDate)}
      />
    </SimpleGrid>
  );
}
