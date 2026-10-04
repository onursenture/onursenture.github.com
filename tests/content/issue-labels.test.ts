import { describe, expect, it } from "vitest";
import { experience } from "@/content/experience";
import { labIndex } from "@/content/lab-index";
import { resume } from "@/content/resume";
import { productPages } from "@/content/work";
import { fieldMessage, labelIssue } from "@/lib/content/issue-labels";
import { formatIssue } from "@/lib/content/issues";

const gonna = productPages.find((page) => page.slug === "gonna")!;
const onGonna = { doc: "work/gonna" as const, value: gonna };
const label = (at: string, message = "is required") => labelIssue({ doc: "work/gonna", at, message }, onGonna);

describe("labelIssue", () => {
  it("names the page, block, image and field of a zod path", () => {
    // The production report: "work/gonna blocks/4/images/0/pin/note: is required".
    const index = gonna.blocks.findIndex((block) => block.id === "highlights");
    const block = gonna.blocks[index];
    const image = block.kind === "images" ? block.images.findIndex((item) => item.id === "gonna-iphone") : -1;
    expect(label(`blocks/${index}/images/${image}/pin/note`)).toEqual({
      parts: ["Gonna", "Highlights", "Gonna for iPhone", "Pin note"],
      text: "Gonna › Highlights › Gonna for iPhone › Pin note: is required",
      target: { block: "highlights", image: "gonna-iphone" },
    });
    expect(label(`blocks/${index}/images/${image}/pin/title`).text).toBe("Gonna › Highlights › Gonna for iPhone › Pin title: is required");
    expect(label(`blocks/${index}/images/${image}/credits/0/name`).text).toBe("Gonna › Highlights › Gonna for iPhone › Credits 1 name: is required");
  });

  it("places validateWork's block and image ids the same way", () => {
    expect(label("highlights/gonna-iphone", 'image "x" is not in the manifest')).toEqual({
      parts: ["Gonna", "Highlights", "Gonna for iPhone"],
      text: 'Gonna › Highlights › Gonna for iPhone: image "x" is not in the manifest',
      target: { block: "highlights", image: "gonna-iphone" },
    });
    expect(label("highlights", "columns 4 must be 1, 2 or 3")).toMatchObject({ text: "Gonna › Highlights: columns 4 must be 1, 2 or 3", target: { block: "highlights" } });
  });

  it("names block fields and falls back to the kind for a block without a heading", () => {
    const index = gonna.blocks.findIndex((block) => block.id === "what-i-did");
    expect(label(`blocks/${index}/body/1`)).toMatchObject({ text: "Gonna › What I did › Body 2: is required", target: { block: "what-i-did" } });
    expect(label(`blocks/${index}/heading`).text).toBe("Gonna › What I did › Heading: is required");
    const page = { ...gonna, blocks: [{ kind: "images" as const, id: "shots", images: [{ id: "one" }] }] };
    expect(labelIssue({ doc: "work/gonna", at: "blocks/0/images/0/caption", message: "x" }, { doc: "work/gonna", value: page }).text).toBe("Gonna › Images › one › Caption: x");
    const then = gonna.blocks.findIndex((block) => block.kind === "then");
    expect(label(`blocks/${then}/year`).parts[1]).toMatch(/^Then \d{4}$/);
  });

  it("reads a block id that is also a page key as the block", () => {
    const page = { ...gonna, blocks: [...gonna.blocks, { kind: "images" as const, id: "links", heading: "Links", images: [{ id: "shot", caption: "Shot" }] }] };
    const on = { doc: "work/gonna" as const, value: page };
    expect(labelIssue({ doc: "work/gonna", at: "links", message: "a" }, on)).toMatchObject({ text: "Gonna › Links: a", target: { block: "links" } });
    expect(labelIssue({ doc: "work/gonna", at: "links/shot", message: "a" }, on)).toMatchObject({ text: "Gonna › Links › Shot: a", target: { block: "links", image: "shot" } });
    // A zod path into the page's own links is still the page field.
    expect(labelIssue({ doc: "work/gonna", at: "links/0/href", message: "a" }, on)).toMatchObject({ text: "Gonna › Live links 1 URL: a", target: null });
  });

  it("names the header fields", () => {
    expect(label("facts", "Experience links this page, so it needs a Years fact").text).toBe("Gonna › Facts: Experience links this page, so it needs a Years fact");
    expect(label("facts/1/value").text).toBe("Gonna › Facts 2 value: is required");
    expect(label("lead/strong").text).toBe("Gonna › Lead: is required");
    expect(label("links/0/href").text).toBe("Gonna › Live links 1 URL: is required");
    expect(label("title").target).toBeNull();
    expect(label("", "intro must not be empty").text).toBe("Gonna: intro must not be empty");
  });

  it("keeps the raw path for what the current value doesn't have", () => {
    expect(label("blocks/99/heading")).toEqual({ parts: ["Gonna", "blocks/99/heading"], text: "Gonna › blocks/99/heading: is required", target: null });
    expect(label("gone/image").text).toBe("Gonna › gone/image: is required");
    // Another document than the one being edited: no value to resolve against.
    const other = labelIssue({ doc: "work/nebuu", at: "highlights/game", message: "a" }, onGonna);
    expect(other).toEqual({ parts: ["work/nebuu", "highlights/game"], text: "work/nebuu › highlights/game: a", target: null });
    expect(labelIssue({ doc: "work/nebuu", at: "highlights/game", message: "a" }).text).toBe("work/nebuu › highlights/game: a");
  });

  it("names Lab, Bio, Experience and Selected work entries", () => {
    expect(labelIssue({ doc: "lab", at: "0/href", message: "must be https" }, { doc: "lab", value: labIndex }).text).toBe(`Lab › ${labIndex[0].title} › Link: must be https`);
    expect(labelIssue({ doc: "lab", at: "0/title", message: "is required" }, { doc: "lab", value: [{ title: "", description: "" }] }).text).toBe("Lab › Entry 1 › Title: is required");
    expect(labelIssue({ doc: "profile", at: "bio/2", message: "unknown" }).text).toBe("Bio › Paragraph 3: unknown");
    expect(labelIssue({ doc: "profile", at: "lead/strong", message: "is required" }).text).toBe("Bio › Lead: is required");
    const child = experience[0].children[0];
    expect(labelIssue({ doc: "experience", at: "0/children/0", message: "needs years" }, { doc: "experience", value: experience }).text).toBe(
      `Experience › Orkestra Studios › ${child.title}: needs years`,
    );
    expect(labelIssue({ doc: "experience", at: "0/start", message: "use YYYY-MM" }, { doc: "experience", value: experience }).text).toBe("Experience › Orkestra Studios › Start: use YYYY-MM");
    const twice = [...experience, experience[0]];
    expect(labelIssue({ doc: "experience", at: "3/org", message: "Orkestra Studios is listed twice" }, { doc: "experience", value: twice }).text).toBe(
      "Experience › Orkestra Studios › Organisation: Orkestra Studios is listed twice",
    );
    expect(fieldMessage({ doc: "experience", at: "3/org", message: "Orkestra Studios is listed twice" })).toBe("Organisation: Orkestra Studios is listed twice");
    expect(labelIssue({ doc: "pins", at: "2", message: "nebuu/game is listed twice" }).text).toBe("Selected work › FIG. 03: nebuu/game is listed twice");
  });

  it("leaves formatIssue as the raw form", () => {
    expect(formatIssue({ doc: "work/gonna", at: "blocks/4/images/0/pin/note", message: "is required" })).toBe("work/gonna blocks/4/images/0/pin/note: is required");
  });
});

describe("fieldMessage", () => {
  it("prefixes the field below a card, from the path alone", () => {
    expect(fieldMessage({ doc: "work/gonna", at: "blocks/4/images/0/pin/note", message: "is required" })).toBe("Pin note: is required");
    expect(fieldMessage({ doc: "work/gonna", at: "blocks/1/body/0", message: "is required" })).toBe("Body 1: is required");
    expect(fieldMessage({ doc: "experience", at: "0/children/2/title", message: "is required" })).toBe("Title: is required");
  });

  it("keeps the bare message when the path names no field", () => {
    expect(fieldMessage({ doc: "work/gonna", at: "highlights/gonna-iphone", message: "a" })).toBe("a");
    expect(fieldMessage({ doc: "work/gonna", at: "blocks/4", message: "a" })).toBe("a");
    expect(fieldMessage({ doc: "experience", at: "0/children/2", message: "a" })).toBe("a");
  });
});

describe("labelIssue for the resume", () => {
  const onResume = { doc: "resume" as const, value: resume };
  const label = (at: string, message = "is required") => labelIssue({ doc: "resume", at, message }, onResume).text;

  it("names the section, the entry and the field", () => {
    expect(label("roles/1/bullets/1")).toBe("Resume › Roles › PrimeTek › Bullet 2: is required");
    expect(label("roles/2", "Etiya has bullets on the resume but is not in Experience; clear them on the resume first")).toBe(
      "Resume › Roles › Etiya: Etiya has bullets on the resume but is not in Experience; clear them on the resume first",
    );
    expect(label("projects/0/href", "/work/gone/ is not a product page; change it on the resume first")).toBe(
      "Resume › Projects › PrimeOne › Link: /work/gone/ is not a product page; change it on the resume first",
    );
    expect(label("projects/1/line")).toBe("Resume › Projects › Theme Designer › Line: is required");
    expect(label("skills/0/items")).toBe("Resume › Skills › Design › Items: is required");
    expect(label("education/0/degree")).toBe("Resume › Education › BS Computer Science › Degree: is required");
    expect(label("contact/email", "is not an email address")).toBe("Resume › Email: is not an email address");
    expect(label("contact/linkedin", "use the handle")).toBe("Resume › LinkedIn: use the handle");
    expect(label("summary")).toBe("Resume › Summary: is required");
  });

  it("keeps a path the value doesn't have", () => {
    expect(label("projects/9/title")).toBe("Resume › Projects › 9/title: is required");
  });

  it("prefixes the field inside a card", () => {
    expect(fieldMessage({ doc: "resume", at: "roles/1/bullets/0", message: "is required" })).toBe("Bullet 1: is required");
    expect(fieldMessage({ doc: "resume", at: "projects/0/title", message: "is required" })).toBe("Title: is required");
    expect(fieldMessage({ doc: "resume", at: "contact/email", message: "is not an email address" })).toBe("Email: is not an email address");
  });
});
