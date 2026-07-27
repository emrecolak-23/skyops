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
