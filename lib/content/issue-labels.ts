import type { ExperienceEntry } from "@/content/experience";
import type { LabEntry } from "@/content/lab-index";
import { ORGS } from "@/content/orgs";
import type { Block, ProductPage, WorkImage } from "@/content/work/types";
import type { Issue } from "./issues";
import { type DocKey, slugOfKey } from "./keys";

// Publish issues in words for the editor (formatIssue stays the raw form for
// logs and tests): "Gonna › Highlights › Gonna for iPhone › Pin note: is
// required" instead of "work/gonna blocks/4/images/1/pin/note: is required".
// Indices are resolved against the editor's current value, so a path the value
// no longer has keeps its raw form after the parts that did resolve.

// The block and image a page issue belongs to: the editor opens that card.
export interface IssueTarget {
  block: string;
  image?: string;
}

export interface IssueLabel {
  // The document, then the block or entry, the image and the field.
  parts: string[];
  // The parts joined with " › ", then ": " and the message.
  text: string;
  target: IssueTarget | null;
}

// The document the editor holds, to resolve indices and ids against.
export interface IssueContext {
  doc: DocKey;
  value: unknown;
}

type Scope = "page" | "block" | "image" | "lab" | "profile" | "role" | "product" | "pin" | "index";

const DOC_NAMES: Partial<Record<DocKey, string>> = {
  lab: "Lab",
  profile: "Bio",
  experience: "Experience",
  pins: "Selected work",
  "work-index": "Pages",
};

// A product page's own keys (zod paths start with one); any other first
// segment is a validateWork block id.
const PAGE_KEYS = new Set(["slug", "org", "title", "kind", "lead", "intro", "facts", "links", "blocks"]);

const NAMES: Record<string, string> = {
  title: "Title",
  kind: "Kind",
  slug: "Slug",
  org: "Organisation",
  intro: "Intro",
  heading: "Heading",
  year: "Year",
  years: "Years",
  id: "Id",
  columns: "Columns",
  caption: "Caption",
  image: "Image",
  description: "Description",
  role: "Role",
  start: "Start",
  end: "End",
  note: "Note",
  order: "Order",
  slugs: "Pages",
};

const COLUMNS: Record<string, string> = { label: "label", value: "value", href: "URL", name: "name", role: "role" };

const INDEX = /^\d+$/;
const ordinal = (segment: string) => Number(segment) + 1;
const pad2 = (n: number) => String(n).padStart(2, "0");

// The field the last segments of a path name, in the form's own words.
function fieldName(scope: Scope, rest: string[]): string | null {
  if (rest.length === 0) return null;
  const [head, second, third] = rest;
  const numbered = second !== undefined && INDEX.test(second);
  switch (head) {
    case "lead":
      return second === "rest" ? "Lead, continued" : "Lead";
    case "pin":
      return second === "title" ? "Pin title" : second === "note" ? "Pin note" : "Pin";
    case "bio":
      return numbered ? `Paragraph ${ordinal(second)}` : "Bio";
    case "body":
      return numbered ? `Body ${ordinal(second)}` : "Body";
    case "facts":
    case "links":
    case "sources":
    case "credits": {
      const legend = head === "links" && scope === "page" ? "Live links" : head[0].toUpperCase() + head.slice(1);
      if (second === undefined) return legend;
      if (!numbered) return rest.join("/");
      return third === undefined ? `${legend} ${ordinal(second)}` : `${legend} ${ordinal(second)} ${COLUMNS[third] ?? third}`;
    }
    case "href":
      return scope === "product" ? "Page" : "Link";
    default:
      return rest.length === 1 && NAMES[head] ? NAMES[head] : rest.join("/");
  }
}

function blockName(block: Block): string {
  switch (block.kind) {
    case "then":
      return block.year?.trim() ? `Then ${block.year.trim()}` : "Then";
    case "text":
      return block.heading?.trim() || "Text";
    case "icons":
      return block.heading?.trim() || "Icon set";
    default:
      return block.heading?.trim() || "Images";
  }
}

function imageName(image: WorkImage, index: number): string {
  return image.caption?.trim() || image.id || `Image ${index + 1}`;
}

interface Walk {
  // The containers under the document (block, image; entry, product).
  parts: string[];
  target: IssueTarget | null;
  scope: Scope;
  // The field's segments, or a raw remainder that didn't resolve.
  rest: string[];
  // `rest` is a path the value doesn't have: show it as it is.
  raw?: boolean;
}

const unresolved = (parts: string[], segments: string[], target: IssueTarget | null = null): Walk => ({ parts, target, scope: "page", rest: segments, raw: true });

function at<T>(list: unknown, segment: string | undefined): T | undefined {
  if (!Array.isArray(list) || segment === undefined || !INDEX.test(segment)) return undefined;
  return list[Number(segment)] as T | undefined;
}

function walkPage(page: ProductPage | undefined, segments: string[]): Walk {
  if (segments.length === 0) return { parts: [], target: null, scope: "page", rest: [] };
  const [first, ...more] = segments;
  if (first === "blocks") {
    if (!page) return unresolved([], segments);
    const block = at<Block>(page.blocks, more[0]);
    if (!block) return unresolved([], segments);
    const parts = [blockName(block)];
    const target: IssueTarget = { block: block.id };
    const inner = more.slice(1);
    if (inner[0] === "images" && inner.length > 1) {
      const index = inner[1];
      const image = block.kind === "images" ? at<WorkImage>(block.images, index) : undefined;
      if (!image) return unresolved(parts, inner, target);
      return { parts: [...parts, imageName(image, Number(index))], target: { block: block.id, image: image.id }, scope: "image", rest: inner.slice(2) };
    }
    return { parts, target, scope: "block", rest: inner };
  }
  // validateWork: <block id> or <block id>/<image id>. A block id can equal a
  // page key ("links"), so a block that has the path wins over the page field.
  const block = page?.blocks?.find((item) => item.id === first);
  const blockHasPath = block && (more.length === 0 || (block.kind === "images" && block.images.some((image) => image.id === more[0])));
  if (!blockHasPath && PAGE_KEYS.has(first)) return { parts: [], target: null, scope: "page", rest: segments };
  if (!block) return unresolved([], segments);
  if (more.length === 0) return { parts: [blockName(block)], target: { block: block.id }, scope: "block", rest: [] };
  const index = block.kind === "images" ? block.images.findIndex((image) => image.id === more[0]) : -1;
  if (block.kind !== "images" || index < 0) return unresolved([blockName(block)], more, { block: block.id });
  const image = block.images[index];
  return { parts: [blockName(block), imageName(image, index)], target: { block: block.id, image: image.id }, scope: "image", rest: more.slice(1), raw: more.length > 1 };
}

function walkLab(lab: LabEntry[] | undefined, segments: string[]): Walk {
  const entry = at<LabEntry>(lab, segments[0]);
  if (!entry) return unresolved([], segments);
  return { parts: [entry.title?.trim() || `Entry ${ordinal(segments[0])}`], target: null, scope: "lab", rest: segments.slice(1) };
}

function walkExperience(roles: ExperienceEntry[] | undefined, segments: string[]): Walk {
  const role = at<ExperienceEntry>(roles, segments[0]);
  if (!role) return unresolved([], segments);
  const roleName = ORGS[role.org]?.name ?? (role.role?.trim() || `Role ${ordinal(segments[0])}`);
  if (segments[1] !== "children" || segments.length < 3) return { parts: [roleName], target: null, scope: "role", rest: segments.slice(1) };
  const child = at<ExperienceEntry["children"][number]>(role.children, segments[2]);
  if (!child) return unresolved([roleName], segments.slice(1));
  return { parts: [roleName, child.title?.trim() || `Product ${ordinal(segments[2])}`], target: null, scope: "product", rest: segments.slice(3) };
}

// Pins need no value: validateSite places them at their index, zod at
// order/<index>, and the editor shows each as FIG. NN.
function walkPins(segments: string[]): Walk {
  const path = segments[0] === "order" ? segments.slice(1) : segments;
  if (path.length === 0 || !INDEX.test(path[0])) return unresolved([], segments);
  return { parts: [`FIG. ${pad2(ordinal(path[0]))}`], target: null, scope: "pin", rest: path.slice(1) };
}

function walk(doc: DocKey, segments: string[], value: unknown): Walk {
  if (slugOfKey(doc) !== null) return walkPage(value as ProductPage | undefined, segments);
  switch (doc) {
    case "lab":
      return walkLab(value as LabEntry[] | undefined, segments);
    case "experience":
      return walkExperience(value as ExperienceEntry[] | undefined, segments);
    case "pins":
      return walkPins(segments);
    case "profile":
      return { parts: [], target: null, scope: "profile", rest: segments };
    default:
      return { parts: [], target: null, scope: "index", rest: segments };
  }
}

function docName(doc: DocKey, value: unknown): string {
  if (slugOfKey(doc) !== null) {
    const title = (value as ProductPage | undefined)?.title;
    return typeof title === "string" && title.trim() ? title.trim() : doc;
  }
  return DOC_NAMES[doc] ?? doc;
}

export function labelIssue(issue: Issue, context?: IssueContext | null): IssueLabel {
  const value = context && context.doc === issue.doc ? context.value : undefined;
  const segments = issue.at ? issue.at.split("/") : [];
  const result = walk(issue.doc, segments, value);
  const field = result.raw ? result.rest.join("/") || null : fieldName(result.scope, result.rest);
  const parts = [docName(issue.doc, value), ...result.parts, ...(field ? [field] : [])];
  return { parts, text: `${parts.join(" › ")}: ${issue.message}`, target: result.target };
}

// Where a path's field starts, from its shape alone (no value needed).
function fieldPath(doc: DocKey, segments: string[]): { scope: Scope; rest: string[] } | null {
  const [a, b, c, d] = segments;
  const index = (segment: string | undefined) => segment !== undefined && INDEX.test(segment);
  if (slugOfKey(doc) !== null) {
    if (a === "blocks" && index(b)) return c === "images" && index(d) ? { scope: "image", rest: segments.slice(4) } : { scope: "block", rest: segments.slice(2) };
    return PAGE_KEYS.has(a) ? { scope: "page", rest: segments } : null;
  }
  switch (doc) {
    case "lab":
      return index(a) ? { scope: "lab", rest: segments.slice(1) } : null;
    case "experience":
      if (!index(a)) return null;
      return b === "children" && index(c) ? { scope: "product", rest: segments.slice(3) } : { scope: "role", rest: segments.slice(1) };
    case "pins":
      return a === "order" && index(b) ? { scope: "pin", rest: segments.slice(2) } : null;
    case "profile":
      return { scope: "profile", rest: segments };
    default:
      return null;
  }
}

// The message with the field it is about ("Pin note: is required"), for the
// issue text inside a card that holds several fields. A path that names no
// field (a validateWork block or image, a whole entry) keeps the bare message.
export function fieldMessage(issue: Issue): string {
  const path = fieldPath(issue.doc, issue.at ? issue.at.split("/") : []);
  const field = path ? fieldName(path.scope, path.rest) : null;
  return field ? `${field}: ${issue.message}` : issue.message;
}
