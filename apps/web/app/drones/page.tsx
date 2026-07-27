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
} from "@mantine/core";
import { useDrones } from "@/features/drones/hooks";
import { DroneList } from "@/features/drones/components/DroneList";

export default function DronesPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useDrones(page, 20);

  return (
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
        <Title order={2}>Drones</Title>
        <Button>New Drone</Button>
      </Group>

      {isLoading && (
        <Center style={{ flex: 1 }}>
          <Loader />
        </Center>
      )}
      {error && (
        <Alert color="red" title="Error">
          {String(error)}
        </Alert>
      )}

      {data && (
        <>
          <DroneList drones={data.data} />
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
  );
}
