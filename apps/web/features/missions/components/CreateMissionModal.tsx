"use client";

import { useState } from "react";
import { Modal, TextInput, Select, Button, Stack, Group } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { MissionType } from "@skyops/shared";
import { useDrones } from "@/features/drones/hooks";
import { useCreateMission } from "@/features/missions/hooks";
import {
  isAssignableForMission,
  assignabilityReason,
  defaultPlannedStart,
  defaultPlannedEnd,
} from "@/lib/utils";
import { MISSION_TYPES } from "@/features/missions/constants";
import { createMissionSchema } from "../schemas";
import { useRouter } from "next/navigation";

export function CreateMissionModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const { data: dronesData } = useDrones(1, 100);
  const createMission = useCreateMission();

  const [name, setName] = useState("");
  const [type, setType] = useState<string | null>(
    MissionType.WIND_TURBINE_INSPECTION,
  );
  const [droneId, setDroneId] = useState<string | null>(null);
  const [pilotName, setPilotName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [plannedStart, setPlannedStart] = useState<string | null>(
    defaultPlannedStart(),
  );
  const [plannedEnd, setPlannedEnd] = useState<string | null>(
    defaultPlannedEnd(),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const droneOptions = (dronesData?.data ?? []).map((drone) => {
    const reason = assignabilityReason(drone);
    const suffix = reason ? ` (${reason})` : "";
    return {
      value: drone.id,
      label: `${drone.serialNumber} — ${drone.model}${suffix}`,
      disabled: !isAssignableForMission(drone),
    };
  });

  const close = () => {
    reset();
    setErrors({});
    onClose();
  };

  const clearError = (field: string) =>
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });

  const reset = () => {
    setName("");
    setType(MissionType.WIND_TURBINE_INSPECTION);
    setDroneId(null);
    setPilotName("");
    setSiteLocation("");
    setPlannedStart(null);
    setPlannedEnd(null);
  };

  const submit = () => {
    const parsed = createMissionSchema.safeParse({
      name,
      type,
      droneId,
      pilotName,
      siteLocation,
      plannedStart,
      plannedEnd,
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

    createMission.mutate(
      {
        ...parsed.data,
        plannedStart: parsed.data.plannedStart.toISOString(),
        plannedEnd: parsed.data.plannedEnd.toISOString(),
      },
      {
        onSuccess: (created) => {
          notifications.show({ message: "Mission created", color: "green" });
          reset();
          close();
          router.push(`/missions/${created.id}`);
        },
        onError: (e) =>
          notifications.show({ message: e.message, color: "red" }),
      },
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="New Mission"
      centered
      size="lg"
    >
      <Stack>
        <TextInput
          label="Mission Name"
          value={name}
          onChange={(e) => {
            setName(e.currentTarget.value);
            clearError("name");
          }}
          error={errors.name}
          required
        />
        <Select
          label="Type"
          data={MISSION_TYPES}
          value={type}
          onChange={(v) => {
            setType(v);
            clearError("type");
          }}
          error={errors.type}
          required
        />
        <Select
          label="Drone"
          placeholder="Select a drone"
          data={droneOptions}
          value={droneId}
          onChange={(v) => {
            setDroneId(v);
            clearError("droneId");
          }}
          error={errors.droneId}
          searchable
          required
        />
        <TextInput
          label="Pilot Name"
          value={pilotName}
          onChange={(e) => {
            setPilotName(e.currentTarget.value);
            clearError("pilotName");
          }}
          error={errors.pilotName}
          required
        />
        <TextInput
          label="Site Location"
          value={siteLocation}
          onChange={(e) => {
            setSiteLocation(e.currentTarget.value);
            clearError("siteLocation");
          }}
          error={errors.siteLocation}
          required
        />
        <Group grow align="flex-start">
          <DateTimePicker
            label="Planned Start"
            timePickerProps={{
              hoursInputLabel: "Start hours",
              minutesInputLabel: "Start minutes",
            }}
            submitButtonProps={{ "aria-label": "Confirm start date" }}
            value={plannedStart}
            onChange={(v) => {
              setPlannedStart(v);
              clearError("plannedStart");
              clearError("plannedEnd");
            }}
            error={errors.plannedStart}
            required
          />
          <DateTimePicker
            label="Planned End"
            timePickerProps={{
              hoursInputLabel: "End hours",
              minutesInputLabel: "End minutes",
            }}
            submitButtonProps={{ "aria-label": "Confirm end date" }}
            value={plannedEnd}
            onChange={(v) => {
              setPlannedEnd(v);
              clearError("plannedEnd");
              clearError("plannedStart");
            }}
            error={errors.plannedEnd}
            required
          />
        </Group>
        <Button onClick={submit} loading={createMission.isPending}>
          Create Mission
        </Button>
      </Stack>
    </Modal>
  );
}
