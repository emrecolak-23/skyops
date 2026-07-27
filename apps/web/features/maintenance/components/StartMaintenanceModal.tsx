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
import { startMaintenanceSchema } from "../schemas";

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const openMaintenance = useOpenMaintenance();

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const handleSubmit = () => {
    const parsed = startMaintenanceSchema.safeParse({
      type,
      technicianName,
      notes,
      flightHoursAtMaintenance: flightHours,
    });

    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    openMaintenance.mutate(
      { droneId, ...parsed.data },
      {
        onSuccess: () => {
          notifications.show({
            message: "Maintenance started",
            color: "green",
          });
          resetAndClose();
        },
        onError: (e) =>
          notifications.show({ message: e.message, color: "red" }),
      },
    );
  };

  const resetAndClose = () => {
    setType(MaintenanceType.ROUTINE_CHECK);
    setTechnicianName("");
    setNotes("");
    setFlightHours(currentFlightHours);
    setErrors({});
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
          onChange={(v) => {
            setType(v);
            clearError("type");
          }}
          error={errors.type}
          required
        />
        <TextInput
          label="Technician Name"
          value={technicianName}
          onChange={(e) => {
            setTechnicianName(e.currentTarget.value);
            clearError("technicianName");
          }}
          error={errors.technicianName}
          maxLength={120}
          required
        />
        <NumberInput
          label="Flight Hours at Maintenance"
          value={flightHours}
          onChange={(v) => {
            setFlightHours(v);
            clearError("flightHoursAtMaintenance");
          }}
          error={errors.flightHoursAtMaintenance}
          min={0}
          max={999999}
          decimalScale={2}
          description={`Current total: ${currentFlightHours}h`}
        />
        <Textarea
          label="Notes (optional)"
          value={notes}
          onChange={(e) => {
            setNotes(e.currentTarget.value);
            clearError("notes");
          }}
          error={errors.notes}
          maxLength={1000}
          minRows={2}
        />
        <Button onClick={handleSubmit} loading={openMaintenance.isPending}>
          Start Maintenance
        </Button>
      </Stack>
    </Modal>
  );
}
