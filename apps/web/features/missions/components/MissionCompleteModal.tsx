"use client";

import { useState } from "react";
import { Button, Modal, NumberInput, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMissionTransition } from "@/features/missions/hooks";
import { completeMissionSchema } from "../schemas";
import { Mission } from "@/lib/types";

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
  const [error, setError] = useState<string | null>(null);

  const transition = useMissionTransition();

  const close = () => {
    setHours("");
    setError(null);
    onClose();
  };

  const submit = () => {
    const parsed = completeMissionSchema.safeParse({
      flightHoursLogged: hours,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    transition.mutate(
      { id: missionId, action: "complete", body: parsed.data },
      {
        onSuccess: (m: Mission) => {
          notifications.show({
            message: m.maintenanceDue
              ? "Mission completed — drone now requires maintenance"
              : "Mission completed",
            color: m.maintenanceDue ? "orange" : "green",
          });
          close();
        },
        onError: (e) =>
          notifications.show({ message: e.message, color: "red" }),
      },
    );
  };

  return (
    <Modal opened={opened} onClose={close} title="Complete Mission" centered>
      <Stack>
        <NumberInput
          label="Flight Hours Logged"
          value={hours}
          onChange={(v) => {
            setHours(v);
            setError(null);
          }}
          error={error}
          min={0.01}
          max={1000}
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
