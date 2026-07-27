"use client";

import { useState } from "react";
import { Button, Modal, Textarea, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { useMissionTransition } from "@/features/missions/hooks";
import { abortMissionSchema } from "../schemas";

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
  const [error, setError] = useState<string | null>(null);

  const transition = useMissionTransition();

  const close = () => {
    setReason("");
    setError(null);
    onClose();
  };

  const submit = () => {
    const parsed = abortMissionSchema.safeParse({ reason });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    transition.mutate(
      { id: missionId, action: "abort", body: parsed.data },
      {
        onSuccess: () => {
          notifications.show({ message: "Mission aborted", color: "orange" });
          close();
        },
        onError: (e) =>
          notifications.show({ message: e.message, color: "red" }),
      },
    );
  };

  return (
    <Modal opened={opened} onClose={close} title="Abort Mission" centered>
      <Stack>
        <Textarea
          label="Abort Reason"
          description="At least 10 characters"
          value={reason}
          onChange={(e) => {
            setReason(e.currentTarget.value);
            setError(null);
          }}
          error={error}
          minRows={3}
          maxLength={200}
          required
        />
        <Button onClick={submit} loading={transition.isPending} color="red">
          Abort Mission
        </Button>
      </Stack>
    </Modal>
  );
}
