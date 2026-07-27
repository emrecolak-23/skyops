"use client";

import { useState } from "react";
import { Button, Modal, NumberInput, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMissionTransition } from "@/features/missions/hooks";

interface MissionCompleteModalProps {
  opened: boolean;
  onClose: () => void;
  missionId: string;
}

export function MissionCompleteModal({
  opened,
  onClose,
  missionId,
}: MissionCompleteModalProps) {
  const [hours, setHours] = useState<number | string>("");
  const transition = useMissionTransition();

  const submit = () => {
    if (!hours || Number(hours) <= 0) {
      notifications.show({
        message: "Flight hours must be greater than 0",
        color: "red",
      });
      return;
    }
    transition.mutate(
      {
        id: missionId,
        action: "complete",
        body: { flightHoursLogged: Number(hours) },
      },
      {
        onSuccess: (m: any) => {
          notifications.show({
            message: m.maintenanceDue
              ? "Mission completed — drone now requires maintenance"
              : "Mission completed",
            color: m.maintenanceDue ? "orange" : "green",
          });
          setHours("");
          onClose();
        },
        onError: (e) =>
          notifications.show({ message: String(e), color: "red" }),
      },
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Complete Mission" centered>
      <Stack>
        <NumberInput
          label="Flight Hours Logged"
          value={hours}
          onChange={setHours}
          min={0.01}
          decimalScale={2}
          required
        />
        <Button onClick={submit} loading={transition.isPending} color="green">
          Complete Mission
        </Button>
      </Stack>
    </Modal>
  );
}
