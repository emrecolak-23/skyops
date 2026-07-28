"use client";
import { IconCalendarEvent } from "@tabler/icons-react";
import { MissionRescheduleModal } from "./MissionRescheduleModal";
import { useState } from "react";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Mission } from "@/lib/types";
import { useMissionTransition } from "@/features/missions/hooks";
import { ACTION_CONFIG, RESCHEDULABLE_STATUSES } from "../constants";
import { MissionCompleteModal } from "./MissionCompleteModal";
import { MissionAbortModal } from "./MissionAbortModal";

export function MissionActions({ mission }: { mission: Mission }) {
  const transition = useMissionTransition();
  const [modal, setModal] = useState<
    "complete" | "abort" | "reschedule" | null
  >(null);
  const [rescheduleKey, setRescheduleKey] = useState(0);

  const runSimple = (action: "pre-flight" | "start", label: string) => {
    transition.mutate(
      { id: mission.id, action },
      {
        onSuccess: () =>
          notifications.show({
            message: `Mission moved to ${label}`,
            color: "green",
          }),
        onError: (e) =>
          notifications.show({ message: String(e), color: "red" }),
      },
    );
  };

  return (
    <>
      <Group>
        {RESCHEDULABLE_STATUSES.includes(mission.status) && (
          <Button
            variant="default"
            leftSection={<IconCalendarEvent size={16} />}
            onClick={() => {
              setRescheduleKey((k) => k + 1);
              setModal("reschedule");
            }}
          >
            Reschedule
          </Button>
        )}
        {mission.availableActions.map((status) => {
          const cfg = ACTION_CONFIG[status];
          if (!cfg) return null;
          return (
            <Button
              key={status}
              variant="light"
              color={cfg.color}
              loading={transition.isPending}
              onClick={() =>
                cfg.needsModal
                  ? setModal(cfg.needsModal)
                  : runSimple(cfg.action!, cfg.label)
              }
            >
              {cfg.label}
            </Button>
          );
        })}
      </Group>
      <MissionCompleteModal
        opened={modal === "complete"}
        onClose={() => setModal(null)}
        missionId={mission.id}
      />
      <MissionAbortModal
        opened={modal === "abort"}
        onClose={() => setModal(null)}
        missionId={mission.id}
      />
      <MissionRescheduleModal
        key={rescheduleKey}
        opened={modal === "reschedule"}
        onClose={() => setModal(null)}
        mission={mission}
      />
    </>
  );
}
