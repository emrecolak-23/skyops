import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Mission, Paginated } from "@/lib/types";
import { MissionStatus, MissionType } from "@skyops/shared";

interface MissionFilters {
  status?: MissionStatus;
  droneId?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export function useMissions(filters: MissionFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set("status", filters.status);
  if (filters.droneId) params.set("droneId", filters.droneId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  params.set("page", String(filters.page ?? 1));
  params.set("limit", String(filters.limit ?? 20));

  return useQuery({
    queryKey: ["missions", filters],
    queryFn: () =>
      api.get<Paginated<Mission>>(`/missions?${params.toString()}`),
  });
}

export function useCreateMission() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      name: string;
      type: MissionType;
      droneId: string;
      pilotName: string;
      siteLocation: string;
      plannedStart: string;
      plannedEnd: string;
    }) => api.post<Mission>("/missions", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missions"] });
      qc.invalidateQueries({ queryKey: ["fleet-health"] });
    },
  });
}

export function useMissionTransition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      action,
      body,
    }: {
      id: string;
      action: "pre-flight" | "start" | "complete" | "abort";
      body?: unknown;
    }) => api.patch<Mission>(`/missions/${id}/${action}`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["missions"] });
      qc.invalidateQueries({ queryKey: ["drones"] }); // drone status değişebilir
      qc.invalidateQueries({ queryKey: ["fleet-health"] });
    },
  });
}
