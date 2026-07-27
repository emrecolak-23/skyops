"use client";

import { useState } from "react";
import {
  Button,
  Modal,
  Select,
  Stack,
  Textarea,
  TextInput,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { DroneModel } from "@skyops/shared";
import { ApiError } from "@/lib/api";
import { useCreateDrone } from "@/features/drones/hooks";
import { DRONE_MODELS, SERIAL_NUMBER_PATTERN } from "../constants";
import { createDroneSchema } from "../schemas";

interface CreateDroneModalProps {
  opened: boolean;
  onClose: () => void;
}

export function CreateDroneModal({ opened, onClose }: CreateDroneModalProps) {
  const [serialNumber, setSerialNumber] = useState("");
  const [model, setModel] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const createDrone = useCreateDrone();

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const close = () => {
    setSerialNumber("");
    setModel(null);
    setNotes("");
    setErrors({});
    onClose();
  };

  const submit = () => {
    const parsed = createDroneSchema.safeParse({ serialNumber, model, notes });
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0]);
        next[key] ??= issue.message;
      }
      setErrors(next);
      return;
    }

    createDrone.mutate(parsed.data, {
      onSuccess: (drone) => {
        notifications.show({
          message: `Drone ${drone.serialNumber} registered`,
          color: "green",
        });
        close();
      },
      onError: (e) => {
        if (e instanceof ApiError && e.status === 409) {
          setErrors({ serialNumber: e.message });
          return;
        }
        notifications.show({ message: e.message, color: "red" });
      },
    });
  };

  return (
    <Modal
      opened={opened}
      onClose={close}
      title="Register Drone"
      centered
      closeOnClickOutside={!createDrone.isPending}
    >
      <Stack>
        <TextInput
          label="Serial Number"
          placeholder="SKY-1234-ABCD"
          value={serialNumber}
          onChange={(e) => {
            setSerialNumber(e.currentTarget.value.toUpperCase());
            clearError("serialNumber");
          }}
          error={errors.serialNumber}
          required
        />
        <Select
          label="Model"
          placeholder="Select a model"
          data={DRONE_MODELS}
          value={model}
          onChange={(v) => {
            setModel(v);
            clearError("model");
          }}
          error={errors.model}
          required
        />
        <Textarea
          label="Notes"
          placeholder="Optional"
          value={notes}
          onChange={(e) => setNotes(e.currentTarget.value)}
          maxLength={1000}
          autosize
          minRows={3}
        />
        <Button onClick={submit} loading={createDrone.isPending}>
          Register Drone
        </Button>
      </Stack>
    </Modal>
  );
}
