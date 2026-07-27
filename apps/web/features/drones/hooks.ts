import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Drone, Paginated } from "@/lib/types";

export function useDrones(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["drones", page, limit],
    queryFn: () =>
      api.get<Paginated<Drone>>(`/drones?page=${page}&limit=${limit}`),
  });
}

export function useDrone(id: string) {
  return useQuery({
    queryKey: ["drones", id],
    queryFn: () => api.get<Drone>(`/drones/${id}`),
    enabled: !!id,
  });
}

export function useRetireDrone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<Drone>(`/drones/${id}`),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ["drones", id] });
      qc.invalidateQueries({ queryKey: ["drones"] });
      qc.invalidateQueries({ queryKey: ["fleet-health"] });
    },
  });
}

export function useUpdateDroneNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes: string | null }) =>
      api.patch<Drone>(`/drones/${id}`, { notes }),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: ["drones", id] });
    },
  });
}
