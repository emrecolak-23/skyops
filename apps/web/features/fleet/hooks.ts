import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Drone } from "@/lib/types";
import { FleetHealth } from "@/lib/types";

export function useFleetHealth() {
  return useQuery({
    queryKey: ["fleet-health"],
    queryFn: () => api.get<FleetHealth>("/fleet/health"),
  });
}

export function useRetireDrone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<Drone>(`/drones/${id}`),
    onSuccess: (_d, id) => {
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
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: ["drones", id] });
    },
  });
}
