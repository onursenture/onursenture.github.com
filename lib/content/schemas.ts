import { z } from "zod";
import { type DocKey, slugOfKey } from "./keys";

// zod schemas for every admin document (Sprint 7 spec §1.2). They mirror the
// TypeScript types in content/; tests/content/schemas.test.ts proves the two
// are identical, so the repo content and the database can't drift in shape.
// Shape only: the content rules (ids, links, the then block) live in
// validateWork / validateSite.

export const orgIdSchema = z.enum(["primetek", "orkestra", "etiya", "bilkent"]);

// Strict schemas gate publishing and public reads. The loose variants have
// the same structure without the "must not be empty" and format rules, so the
// admin preview can show a draft that isn't publishable yet (a new page, a
// field being retyped).
function build(strict: boolean) {
  const text = () => (strict ? z.string().min(1) : z.string());
  const linkSchema = z.object({ label: text(), href: text() });
  const creditSchema = z.object({ name: text(), role: z.string().optional(), href: z.string().optional() });
  // The note is optional copy: the home leaves out its line when it is blank.
  const pinSchema = z.object({ title: text(), note: z.string() });

  const workImageSchema = z.object({
    id: z.string(),
    caption: z.string().optional(),
    credits: z.array(creditSchema).optional(),
    image: z.string().optional(),
    pin: pinSchema.optional(),
  });

  // Body paragraphs: at least one, none empty.
  const paragraphs = () => (strict ? z.array(z.string().min(1)).min(1) : z.array(z.string()));

  const blockSchema = z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("text"), id: z.string(), heading: text(), body: paragraphs(), links: z.array(linkSchema).optional() }),
    z.object({
      kind: z.literal("images"),
      id: z.string(),
      heading: z.string().optional(),
      columns: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional(),
      images: z.array(workImageSchema),
    }),
    z.object({ kind: z.literal("icons"), id: z.string(), heading: z.string().optional() }),
    z.object({ kind: z.literal("then"), id: z.string(), year: z.string(), body: paragraphs(), sources: z.array(linkSchema).optional() }),
  ]);

  const productPageSchema = z.object({
    slug: z.string(),
    org: orgIdSchema,
    title: text(),
    kind: z.string(),
    lead: z.object({ strong: text(), rest: z.string() }),
    intro: z.string(),
    facts: z.array(z.object({ label: text(), value: text() })),
    links: z.array(linkSchema).optional(),
    blocks: z.array(blockSchema),
  });

  const workIndexSchema = z.object({ slugs: z.array(z.string()) });

  const pinsSchema = z.object({ order: z.array(z.object({ slug: z.string(), imageId: z.string() })) });

  const labSchema = z.array(z.object({ title: text(), description: text(), year: z.string().optional(), href: z.string().optional() }));

  const profileSchema = z.object({
    lead: z.object({ strong: text(), rest: z.string() }),
    bio: z.array(z.array(z.union([z.string(), z.object({ org: orgIdSchema })]))),
    // Sprint 8; optional so rows published before it still parse.
    available: z.boolean().optional(),
    bookOnHome: z.boolean().optional(),
  });

  // YYYY-MM
  const monthSchema = () => (strict ? z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "use YYYY-MM") : z.string());

  const experienceSchema = z.array(
    z.object({
      org: orgIdSchema,
      role: text(),
      start: monthSchema(),
      end: monthSchema().nullable(),
      children: z.array(z.object({ title: text(), note: z.string(), href: z.string().optional(), years: z.string().optional() })),
    }),
  );

  return { productPageSchema, workIndexSchema, pinsSchema, labSchema, profileSchema, experienceSchema };
}

const strictSchemas = build(true);
const looseSchemas = build(false);

export const { productPageSchema, workIndexSchema, pinsSchema, labSchema, profileSchema, experienceSchema } = strictSchemas;
export const looseProductPageSchema = looseSchemas.productPageSchema;
export const looseWorkIndexSchema = looseSchemas.workIndexSchema;
export const loosePinsSchema = looseSchemas.pinsSchema;
export const looseLabSchema = looseSchemas.labSchema;
export const looseProfileSchema = looseSchemas.profileSchema;
export const looseExperienceSchema = looseSchemas.experienceSchema;

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
