import { z } from "zod";
import { MissionType } from "@skyops/shared";

const requiredDateTime = (label: string) =>
  z
    .string(`${label} is required`)
    .min(1, `${label} is required`)
    .pipe(z.coerce.date(`${label} is invalid`));

export const createMissionSchema = z
  .object({
    name: z.string().trim().min(1, "Mission name is required").max(200),
    type: z.enum(MissionType, "Select a mission type"),
    droneId: z.string("Select a drone").min(1, "Select a drone"),
    pilotName: z.string().trim().min(1, "Pilot name is required").max(120),
    siteLocation: z
      .string()
      .trim()
      .min(1, "Site location is required")
      .max(200),
    plannedStart: requiredDateTime("Planned start"),
    plannedEnd: requiredDateTime("Planned end"),
  })
  .refine((v) => v.plannedEnd > v.plannedStart, {
    message: "Planned end must be after planned start",
    path: ["plannedEnd"],
  })
  .refine((v) => v.plannedStart > new Date(), {
    message: "Mission cannot be scheduled in the past",
    path: ["plannedStart"],
  });

export const abortMissionSchema = z.object({
  reason: z
    .string()
    .trim()
    .min(10, "Reason must be at least 10 characters")
    .max(200, "Reason must be at most 200 characters"),
});

export const completeMissionSchema = z.object({
  flightHoursLogged: z.coerce
    .number("Flight hours are required")
    .min(0.01, "Flight hours must be greater than 0")
    .max(1000, "Flight hours cannot exceed 1000")
    .refine((n) => Math.round(n * 100) / 100 === n, "At most 2 decimal places"),
});

export const rescheduleMissionSchema = z
  .object({
    plannedStart: requiredDateTime("Planned start"),
    plannedEnd: requiredDateTime("Planned end"),
  })
  .refine((v) => v.plannedEnd > v.plannedStart, {
    message: "Planned end must be after planned start",
    path: ["plannedEnd"],
  })
  .refine((v) => v.plannedStart > new Date(), {
    message: "Mission cannot be scheduled in the past",
    path: ["plannedStart"],
  });
