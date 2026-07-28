"use client";

import { useState } from "react";
import {
  Alert,
  Button,
  Group,
  Modal,
  Select,
  Stack,
  Text,
} from "@mantine/core";
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import {
  IconAlertTriangle,
  IconCalendarEvent,
  IconRestore,
} from "@tabler/icons-react";
import dayjs from "dayjs";
import { Mission } from "@/lib/types";
import { useDrones } from "@/features/drones/hooks";
import { useRescheduleMission } from "@/features/missions/hooks";
import {
  assignabilityReason,
  formatDuration,
  isAssignableForMission,
  shiftWindow,
  toDateTimeInput,
} from "@/lib/utils";
import { rescheduleMissionSchema } from "../schemas";
import { SHIFTS } from "../constants";

interface MissionRescheduleModalProps {
  opened: boolean;
  onClose: () => void;
  mission: Mission;
}

export function MissionRescheduleModal({
  opened,
  onClose,
  mission,
}: MissionRescheduleModalProps) {
  const { data: dronesData } = useDrones(1, 100);
  const reschedule = useRescheduleMission();
  const [initial] = useState(() => ({
    plannedStart: toDateTimeInput(mission.plannedStart),
    plannedEnd: toDateTimeInput(mission.plannedEnd),
    droneId: mission.droneId,
  }));

  const [plannedStart, setPlannedStart] = useState<string | null>(
    initial.plannedStart,
  );
  const [plannedEnd, setPlannedEnd] = useState<string | null>(
    initial.plannedEnd,
  );
  const [droneId, setDroneId] = useState<string | null>(initial.droneId);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const drones = dronesData?.data ?? [];
  const selectedDrone = drones.find((drone) => drone.id === droneId);
  const blockedReason =
    selectedDrone && !isAssignableForMission(selectedDrone)
      ? assignabilityReason(selectedDrone)
      : null;

  const droneOptions = drones.map((drone) => {
    const isCurrent = drone.id === mission.droneId;
    const reason = assignabilityReason(drone);
    const suffix = isCurrent
      ? reason
        ? ` (current — ${reason})`
        : " (current)"
      : reason
        ? ` (${reason})`
        : "";

    return {
      value: drone.id,
      label: `${drone.serialNumber} — ${drone.model}${suffix}`,
      disabled: !isCurrent && !isAssignableForMission(drone),
    };
  });

  const newDuration =
    plannedStart && plannedEnd && dayjs(plannedEnd).isAfter(plannedStart)
      ? formatDuration(
          dayjs(plannedStart).toISOString(),
          dayjs(plannedEnd).toISOString(),
        )
      : null;

  const shiftedDays = plannedStart
    ? dayjs(plannedStart).diff(dayjs(mission.plannedStart), "day")
    : 0;

  const shift = (amount: number, unit: "day" | "week") => {
    if (!plannedStart || !plannedEnd) return;
    const next = shiftWindow(plannedStart, plannedEnd, amount, unit);
    setPlannedStart(next.start);
    setPlannedEnd(next.end);
    setErrors({});
  };

  const isDirty =
    plannedStart !== initial.plannedStart ||
    plannedEnd !== initial.plannedEnd ||
    droneId !== initial.droneId;

  const reset = () => {
    setPlannedStart(initial.plannedStart);
    setPlannedEnd(initial.plannedEnd);
    setDroneId(initial.droneId);
    setErrors({});
    setServerError(null);
  };

  const submit = () => {
    const parsed = rescheduleMissionSchema.safeParse({
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

    setServerError(null);
    reschedule.mutate(
      {
        id: mission.id,
        plannedStart: parsed.data.plannedStart.toISOString(),
        plannedEnd: parsed.data.plannedEnd.toISOString(),
        droneId: droneId && droneId !== mission.droneId ? droneId : undefined,
      },
      {
        onSuccess: () => {
          notifications.show({
            message: "Mission rescheduled",
            color: "green",
          });
          onClose();
        },
        onError: (e) => setServerError(e.message),
      },
    );
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      centered
      size="lg"
      title={
        <Group gap="xs">
          <IconCalendarEvent size={18} />
          <Text fw={600}>Reschedule Mission</Text>
        </Group>
      }
    >
      <Stack>
        <Text size="sm" c="dimmed">
          Currently {new Date(mission.plannedStart).toLocaleString()} →{" "}
          {new Date(mission.plannedEnd).toLocaleString()}
        </Text>

        {serverError && (
          <Alert color="red" variant="light">
            {serverError}
          </Alert>
        )}

        {blockedReason && (
          <Alert
            color="orange"
            variant="light"
            icon={<IconAlertTriangle size={16} />}
            title="Drone unavailable"
          >
            {selectedDrone?.serialNumber} is {blockedReason}. Assign another
            drone to keep this mission, or come back once maintenance is closed.
          </Alert>
        )}

        <Group grow align="flex-start">
          <DateTimePicker
            label="Planned Start"
            minDate={new Date()}
            timePickerProps={{
              hoursInputLabel: "Start hours",
              minutesInputLabel: "Start minutes",
            }}
            submitButtonProps={{ "aria-label": "Confirm start date" }}
            value={plannedStart}
            onChange={(v) => {
              setPlannedStart(v);
              setErrors({});
            }}
            error={errors.plannedStart}
            required
          />
          <DateTimePicker
            label="Planned End"
            minDate={new Date()}
            timePickerProps={{
              hoursInputLabel: "End hours",
              minutesInputLabel: "End minutes",
            }}
            submitButtonProps={{ "aria-label": "Confirm end date" }}
            value={plannedEnd}
            onChange={(v) => {
              setPlannedEnd(v);
              setErrors({});
            }}
            error={errors.plannedEnd}
            required
          />
        </Group>

        <Stack gap={6}>
          <Group gap="xs">
            {SHIFTS.map((option) => (
              <Button
                key={option.label}
                variant="subtle"
                size="compact-sm"
                onClick={() => shift(option.amount, option.unit)}
              >
                {option.label}
              </Button>
            ))}
            <Button
              variant="subtle"
              color="gray"
              size="compact-sm"
              leftSection={<IconRestore size={14} />}
              onClick={reset}
              disabled={!isDirty}
            >
              Reset
            </Button>
          </Group>
          {plannedStart && plannedEnd && newDuration && (
            <Text size="sm" c="dimmed">
              {dayjs(plannedStart).format("D MMM HH:mm")} →{" "}
              {dayjs(plannedEnd).format("D MMM HH:mm")} · {newDuration}
              {shiftedDays !== 0 &&
                ` · ${shiftedDays > 0 ? "+" : ""}${shiftedDays}d from original`}
            </Text>
          )}
        </Stack>

        <Select
          label="Drone"
          data={droneOptions}
          value={droneId}
          onChange={setDroneId}
          allowDeselect={false}
          searchable
        />

        <Group justify="flex-end">
          <Button variant="subtle" color="gray" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            loading={reschedule.isPending}
            disabled={!!blockedReason || !isDirty}
          >
            Save changes
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
