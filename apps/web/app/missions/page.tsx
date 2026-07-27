"use client";

import { useState } from "react";
import {
  Box,
  Title,
  Group,
  Button,
  Loader,
  Center,
  Alert,
  Pagination,
  Select,
} from "@mantine/core";
import { MissionStatus } from "@skyops/shared";
import { useMissions } from "@/features/missions/hooks";
import { MissionList } from "@/features/missions/components/MissionList";
import { CreateMissionModal } from "@/features/missions/components/CreateMissionModal";

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  ...Object.values(MissionStatus).map((s) => ({ value: s, label: s })),
];

export default function MissionsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [createOpen, setCreateOpen] = useState(false);

  const { data, isLoading, error } = useMissions({
    status: (status || undefined) as MissionStatus | undefined,
    page,
    limit: 20,
  });

  return (
    <>
      <Box
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          minHeight: 0,
        }}
      >
        <Group justify="space-between" style={{ flexShrink: 0 }}>
          <Title order={2}>Missions</Title>
          <Button onClick={() => setCreateOpen(true)}>New Mission</Button>
        </Group>

        <Group style={{ flexShrink: 0 }}>
          <Select
            data={STATUS_OPTIONS}
            value={status}
            onChange={(v) => {
              setStatus(v ?? "");
              setPage(1);
            }}
            placeholder="Filter by status"
            w={200}
          />
        </Group>

        {isLoading && (
          <Center style={{ flex: 1 }}>
            <Loader />
          </Center>
        )}
        {error && <Alert color="red">{String(error)}</Alert>}

        {data && (
          <>
            <MissionList missions={data.data} />
            <Group justify="center" style={{ flexShrink: 0 }}>
              <Pagination
                total={data.meta.totalPages}
                value={page}
                onChange={setPage}
              />
            </Group>
          </>
        )}
      </Box>
      <CreateMissionModal
        opened={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </>
  );
}
