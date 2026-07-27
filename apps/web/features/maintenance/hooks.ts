import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { MaintenanceLog, Paginated } from "@/lib/types";
import { MaintenanceType } from "@skyops/shared";

export function useMaintenanceLogs(droneId: string) {
  return useQuery({
    queryKey: ["maintenance-logs", droneId],
    queryFn: () =>
      api.get<Paginated<MaintenanceLog>>(`/drones/${droneId}/maintenance-logs`),
    enabled: !!droneId,
  });
}

export function useOpenMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      droneId: string;
      type: MaintenanceType;
      technicianName: string;
      notes?: string;
      flightHoursAtMaintenance: number;
    }) => api.post<MaintenanceLog>("/maintenance-logs", body),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({
        queryKey: ["maintenance-logs", variables.droneId],
      });
      qc.invalidateQueries({ queryKey: ["drones"] });
      qc.invalidateQueries({ queryKey: ["fleet-health"] });
    },
  });
}

export function useCompleteMaintenance(droneId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (logId: string) =>
      api.patch<MaintenanceLog>(`/maintenance-logs/${logId}/complete`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["maintenance-logs", droneId] });
      qc.invalidateQueries({ queryKey: ["drones"] });
      qc.invalidateQueries({ queryKey: ["fleet-health"] });
    },
  });
}
