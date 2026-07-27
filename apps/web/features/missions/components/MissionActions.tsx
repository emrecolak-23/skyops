"use client";

import { useState } from "react";
import { Button, Group } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Mission } from "@/lib/types";
import { useMissionTransition } from "@/features/missions/hooks";
import { ACTION_CONFIG } from "../constants";
import { MissionCompleteModal } from "./MissionCompleteModal";

export function MissionActions({ mission }: { mission: Mission }) {
  const transition = useMissionTransition();
  const [modal, setModal] = useState<"complete" | "abort" | null>(null);

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
      {/* <AbortModal
        opened={modal === 'abort'}
        onClose={() => setModal(null)}
        missionId={mission.id}
      /> */}
    </>
  );
}
