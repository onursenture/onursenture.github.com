import { z } from "zod";
import { type DocKey, slugOfKey } from "./keys";

// zod schemas for every admin document (Sprint 7 spec §1.2). They mirror the
// TypeScript types in content/; tests/content/schemas.test.ts proves the two
// are identical, so the repo content and the database can't drift in shape.
// Shape only: the content rules (ids, links, the then block) live in
// validateWork / validateSite.

export const orgIdSchema = z.enum(["primetek", "orkestra", "etiya", "bilkent"]);

const linkSchema = z.object({ label: z.string().min(1), href: z.string().min(1) });
const creditSchema = z.object({ name: z.string().min(1), role: z.string().optional(), href: z.string().optional() });
const pinSchema = z.object({ title: z.string().min(1), note: z.string().min(1) });

const workImageSchema = z.object({
  id: z.string(),
  caption: z.string().optional(),
  credits: z.array(creditSchema).optional(),
  image: z.string().optional(),
  pin: pinSchema.optional(),
});

const blockSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("text"), id: z.string(), heading: z.string().min(1), body: z.array(z.string()), links: z.array(linkSchema).optional() }),
  z.object({
    kind: z.literal("images"),
    id: z.string(),
    heading: z.string().optional(),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
    images: z.array(workImageSchema),
  }),
  z.object({ kind: z.literal("icons"), id: z.string(), heading: z.string().optional() }),
  z.object({ kind: z.literal("then"), id: z.string(), year: z.string(), body: z.array(z.string()), sources: z.array(linkSchema).optional() }),
]);

export const productPageSchema = z.object({
  slug: z.string(),
  org: orgIdSchema,
  title: z.string().min(1),
  kind: z.string(),
  lead: z.object({ strong: z.string().min(1), rest: z.string() }),
  intro: z.string(),
  facts: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })),
  links: z.array(linkSchema).optional(),
  blocks: z.array(blockSchema),
});

export const workIndexSchema = z.object({ slugs: z.array(z.string()) });

export const pinsSchema = z.object({ order: z.array(z.object({ slug: z.string(), imageId: z.string() })) });

export const labSchema = z.array(
  z.object({ title: z.string().min(1), description: z.string().min(1), year: z.string().optional(), href: z.string().optional() }),
);

export const profileSchema = z.object({
  lead: z.object({ strong: z.string().min(1), rest: z.string() }),
  bio: z.array(z.array(z.union([z.string(), z.object({ org: orgIdSchema })]))),
});

// YYYY-MM
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "use YYYY-MM");

export const experienceSchema = z.array(
  z.object({
    org: orgIdSchema,
    role: z.string().min(1),
    start: monthSchema,
    end: monthSchema.nullable(),
    children: z.array(z.object({ title: z.string().min(1), note: z.string(), href: z.string().optional(), years: z.string().optional() })),
  }),
);

export function schemaFor(key: DocKey): z.ZodType {
  if (slugOfKey(key) !== null) return productPageSchema;
  switch (key) {
    case "work-index":
      return workIndexSchema;
    case "pins":
      return pinsSchema;
    case "lab":
      return labSchema;
    case "profile":
      return profileSchema;
    case "experience":
      return experienceSchema;
    default:
      throw new Error(`no schema for ${key}`);
  }
}
