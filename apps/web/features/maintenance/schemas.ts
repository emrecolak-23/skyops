import { z } from "zod";
import { MaintenanceType } from "@skyops/shared";

export const startMaintenanceSchema = z.object({
  type: z.enum(MaintenanceType, "Select a maintenance type"),
  technicianName: z
    .string()
    .trim()
    .min(1, "Technician name is required")
    .max(120, "Technician name is too long"),
  notes: z
    .string()
    .max(1000)
    .transform((s) => s.trim() || undefined)
    .optional(),
  flightHoursAtMaintenance: z.coerce
    .number("Flight hours are required")
    .min(0, "Flight hours cannot be negative")
    .max(999999, "Flight hours value is too large"),
});
