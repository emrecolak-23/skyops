"use client";

import { useState } from "react";
import { Button, Modal, Textarea, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMissionTransition } from "@/features/missions/hooks";

interface MissionAbortModalProps {
  opened: boolean;
  onClose: () => void;
  missionId: string;
}

export function MissionAbortModal({
  opened,
  onClose,
  missionId,
}: MissionAbortModalProps) {
  const [reason, setReason] = useState("");
  const transition = useMissionTransition();

  const submit = () => {
    if (reason.trim().length < 3) {
      notifications.show({
        message: "Reason must be at least 3 characters",
        color: "red",
      });
      return;
    }
    transition.mutate(
      { id: missionId, action: "abort", body: { reason: reason.trim() } },
      {
        onSuccess: () => {
          notifications.show({ message: "Mission aborted", color: "orange" });
          setReason("");
          onClose();
        },
        onError: (e) =>
          notifications.show({ message: String(e), color: "red" }),
      },
    );
  };

  return (
    <Modal opened={opened} onClose={onClose} title="Abort Mission" centered>
      <Stack>
        <Textarea
          label="Abort Reason"
          value={reason}
          onChange={(e) => setReason(e.currentTarget.value)}
          minRows={3}
          required
        />
        <Button onClick={submit} loading={transition.isPending} color="red">
          Abort Mission
        </Button>
      </Stack>
    </Modal>
  );
}
