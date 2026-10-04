import { z } from "zod";
import { MAX_IMAGES, NOTE_LANGS, NOTE_SIDES } from "./types";

// The shape every write is checked against (client and server). Loose on
// purpose: a draft may be over the limit or miss alt text; publishIssues
// (rules.ts) holds the rules for going live.

export const noteImageSchema = z.object({
  key: z.string().min(1).max(300),
  alt: z.string().max(2000),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  widths: z.array(z.number().int().positive()).min(1),
  baseUrl: z.string().max(2000).optional(),
});

const linkSchema = z.object({
  kind: z.literal("link"),
  url: z.string().min(1).max(2000),
  title: z.string().max(300),
  description: z.string().max(1000),
  siteName: z.string().max(200),
});

export const noteEmbedSchema = z.union([
  z.object({ kind: z.literal("images"), images: z.array(noteImageSchema).max(MAX_IMAGES) }),
  linkSchema,
  z.null(),
]);

export const noteContentSchema = z.object({
  // Generous for drafts; publishing enforces MAX_GRAPHEMES.
  text: z.string().max(3000),
  side: z.enum(NOTE_SIDES),
  lang: z.enum(NOTE_LANGS),
  embed: noteEmbedSchema,
});
