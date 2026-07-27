"use client";

import { useState } from "react";
import { Modal, TextInput, Select, Button, Stack, Group } from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { MissionType } from "@skyops/shared";
import { useDrones } from "@/features/drones/hooks";
import { useCreateMission } from "@/features/missions/hooks";
import { isAssignableForMission, assignabilityReason } from "@/lib/utils";
import { MISSION_TYPES } from "@/features/missions/constants";

export function CreateMissionModal({
  opened,
  onClose,
}: {
  opened: boolean;
  onClose: () => void;
}) {
  const { data: dronesData } = useDrones(1, 100);
  const createMission = useCreateMission();

  const [name, setName] = useState("");
  const [type, setType] = useState<string | null>(
    MissionType.WIND_TURBINE_INSPECTION,
  );
  const [droneId, setDroneId] = useState<string | null>(null);
  const [pilotName, setPilotName] = useState("");
  const [siteLocation, setSiteLocation] = useState("");
  const [plannedStart, setPlannedStart] = useState<string | null>(null);
  const [plannedEnd, setPlannedEnd] = useState<string | null>(null);

  const droneOptions = (dronesData?.data ?? []).map((drone) => {
    const reason = assignabilityReason(drone);
    const suffix = reason ? ` (${reason})` : "";
    return {
      value: drone.id,
      label: `${drone.serialNumber} — ${drone.model}${suffix}`,
      disabled: !isAssignableForMission(drone),
    };
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
    if (
      !name ||
      !type ||
      !droneId ||
      !pilotName ||
      !siteLocation ||
      !plannedStart ||
      !plannedEnd
    ) {
      notifications.show({ message: "All fields are required", color: "red" });
      return;
    }
    createMission.mutate(
      {
        name,
        type: type as MissionType,
        droneId,
        pilotName,
        siteLocation,
        plannedStart: new Date(plannedStart).toISOString(),
        plannedEnd: new Date(plannedEnd).toISOString(),
      },
      {
        onSuccess: () => {
          notifications.show({ message: "Mission created", color: "green" });
          reset();
          onClose();
        },
        onError: (e) =>
          notifications.show({ message: String(e), color: "red" }),
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
          onChange={(e) => setName(e.currentTarget.value)}
          required
        />
        <Select
          label="Type"
          data={MISSION_TYPES}
          value={type}
          onChange={setType}
          required
        />
        <Select
          label="Drone"
          placeholder="Select a drone"
          data={droneOptions}
          value={droneId}
          onChange={setDroneId}
          searchable
          required
        />
        <TextInput
          label="Pilot Name"
          value={pilotName}
          onChange={(e) => setPilotName(e.currentTarget.value)}
          required
        />
        <TextInput
          label="Site Location"
          value={siteLocation}
          onChange={(e) => setSiteLocation(e.currentTarget.value)}
          required
        />
        <Group grow>
          <DateTimePicker
            label="Planned Start"
            value={plannedStart}
            onChange={setPlannedStart}
            required
          />
          <DateTimePicker
            label="Planned End"
            value={plannedEnd}
            onChange={setPlannedEnd}
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
