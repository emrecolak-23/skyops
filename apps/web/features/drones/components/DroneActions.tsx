"use client";

import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { DroneStatus } from "@skyops/shared";
import { Drone, MaintenanceLog } from "@/lib/types";
import { useRetireDrone } from "@/features/drones/hooks";
import { useCompleteMaintenance } from "@/features/maintenance/hooks";

interface DroneActionsProps {
  drone: Drone;
  inProgressLog?: MaintenanceLog;
  onStartMaintenance: () => void;
}

export function DroneActions({
  drone,
  inProgressLog,
  onStartMaintenance,
}: DroneActionsProps) {
  const retire = useRetireDrone();
  const completeMaint = useCompleteMaintenance(drone.id);

  const handleRetire = () => {
    retire.mutate(drone.id, {
      onSuccess: () =>
        notifications.show({ message: "Drone retired", color: "green" }),
      onError: (e: Error) =>
        notifications.show({ message: String(e), color: "red" }),
    });
  };

  const handleComplete = () => {
    if (!inProgressLog) return;
    completeMaint.mutate(inProgressLog.id, {
      onSuccess: () =>
        notifications.show({
          message: "Maintenance completed",
          color: "green",
        }),
      onError: (e) => notifications.show({ message: String(e), color: "red" }),
    });
  };

  return (
    <Group>
      {drone.status === DroneStatus.AVAILABLE && (
        <Button variant="light" color="orange" onClick={onStartMaintenance}>
          Start Maintenance
        </Button>
      )}

      {drone.status === DroneStatus.MAINTENANCE && inProgressLog && (
        <Button
          variant="light"
          color="green"
          onClick={handleComplete}
          loading={completeMaint.isPending}
        >
          Complete Maintenance
        </Button>
      )}

      {drone.status !== DroneStatus.RETIRED && (
        <Button
          variant="light"
          color="red"
          onClick={handleRetire}
          loading={retire.isPending}
        >
          Retire
        </Button>
      )}
    </Group>
  );
}
