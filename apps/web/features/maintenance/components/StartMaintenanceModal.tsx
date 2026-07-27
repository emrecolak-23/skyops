"use client";

import { useState } from "react";
import {
  Modal,
  Select,
  TextInput,
  NumberInput,
  Button,
  Stack,
  Textarea,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useOpenMaintenance } from "@/features/maintenance/hooks";
import { MaintenanceType } from "@skyops/shared";
import { MAINTENANCE_TYPES } from "../constants";

interface StartMaintenanceModalProps {
  opened: boolean;
  onClose: () => void;
  droneId: string;
  currentFlightHours: number;
}

export function StartMaintenanceModal({
  opened,
  onClose,
  droneId,
  currentFlightHours,
}: StartMaintenanceModalProps) {
  const [type, setType] = useState<string | null>(
    MaintenanceType.ROUTINE_CHECK,
  );
  const [technicianName, setTechnicianName] = useState("");
  const [notes, setNotes] = useState("");
  const [flightHours, setFlightHours] = useState<number | string>(
    currentFlightHours,
  );

  const openMaintenance = useOpenMaintenance();

  const handleSubmit = () => {
    if (!type || !technicianName.trim()) {
      notifications.show({
        message: "Type and technician are required",
        color: "red",
      });
      return;
    }

    openMaintenance.mutate(
      {
        droneId,
        type: type as MaintenanceType,
        technicianName: technicianName.trim(),
        notes: notes.trim() || undefined,
        flightHoursAtMaintenance: Number(flightHours),
      },
      {
        onSuccess: () => {
          notifications.show({
            message: "Maintenance started",
            color: "green",
          });
          resetAndClose();
        },
        onError: (e) =>
          notifications.show({ message: String(e), color: "red" }),
      },
    );
  };

  const resetAndClose = () => {
    setType(MaintenanceType.ROUTINE_CHECK);
    setTechnicianName("");
    setNotes("");
    setFlightHours(currentFlightHours);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={resetAndClose}
      title="Start Maintenance"
      centered
    >
      <Stack>
        <Select
          label="Maintenance Type"
          data={MAINTENANCE_TYPES}
          value={type}
          onChange={setType}
          required
        />
        <TextInput
          label="Technician Name"
          value={technicianName}
          onChange={(e) => setTechnicianName(e.currentTarget.value)}
          required
        />
        <NumberInput
          label="Flight Hours at Maintenance"
          value={flightHours}
          onChange={setFlightHours}
          min={0}
          decimalScale={2}
          description={`Current total: ${currentFlightHours}h`}
        />
        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          minRows={2}
        />
        <Button onClick={handleSubmit} loading={openMaintenance.isPending}>
          Start Maintenance
        </Button>
      </Stack>
    </Modal>
  );
}
