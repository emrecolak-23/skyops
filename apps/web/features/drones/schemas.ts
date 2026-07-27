import { z } from "zod";
import { DroneModel } from "@skyops/shared";
import { SERIAL_NUMBER_PATTERN } from "./constants";

export const createDroneSchema = z.object({
  serialNumber: z
    .string()
    .transform((s) => s.trim().toUpperCase())
    .refine((s) => SERIAL_NUMBER_PATTERN.test(s), {
      message: "Expected format: SKY-XXXX-XXXX",
    }),
  model: z.nativeEnum(DroneModel),
  notes: z
    .string()
    .max(1000)
    .transform((s) => s.trim() || undefined)
    .optional(),
});
