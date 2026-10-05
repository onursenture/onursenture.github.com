import { z } from "zod";
import { isTakenAt } from "./taken-at";

// Validation for what the admin sends and what the database holds.

const takenAt = z.string().refine(isTakenAt, "Use a valid date.");

export const photoContentSchema = z.object({
  title: z.string().max(200, "Keep the title under 200 characters."),
  alt: z.string().max(1000, "Keep the alt text under 1,000 characters."),
  takenAt,
  camera: z.string().max(100, "Keep the camera under 100 characters."),
});

export const photoImageSchema = z.object({
  key: z.string().min(1),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  widths: z.array(z.number().int().positive()).min(1),
  baseUrl: z.string().optional(),
});

export const photoExifSchema = z.object({
  takenAt: takenAt.nullable(),
  camera: z.string().max(100).nullable(),
});
