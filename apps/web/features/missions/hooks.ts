import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Mission, Paginated } from "@/lib/types";
import { MissionStatus } from "@skyops/shared";

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
