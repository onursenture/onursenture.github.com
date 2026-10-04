import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { experience } from "@/content/experience";
import { productPages } from "@/content/work";
import type { ProductPage } from "@/content/work/types";
import { createPage, deletePage, discardDraft, newPage, publishDoc, resetDoc, saveDraft } from "@/lib/admin/operations";
import { FileContentStore } from "@/lib/content/file-store";
import { indexSlugs, publishedValues, resolveSite } from "@/lib/content/site";
import type { ContentStore } from "@/lib/content/store";

const t0 = new Date("2026-10-04T10:00:00.000Z");
const t1 = new Date("2026-10-04T10:01:00.000Z");
const any = () => true;
const nebuu = productPages.find((p) => p.slug === "nebuu")!;

let store: ContentStore;
beforeEach(() => {
  store = new FileContentStore(join(mkdtempSync(join(tmpdir(), "ops-")), "store.json"));
});

const live = async () => resolveSite(publishedValues(await store.listDocs()));

describe("saveDraft", () => {
  it("saves, then refuses a stale expected time", async () => {
    const first = await saveDraft(store, "lab", [], null, t0);
    expect(first).toEqual({ status: "ok", draftUpdatedAt: t0.toISOString() });
    expect(await saveDraft(store, "lab", [], null, t1)).toEqual({ status: "conflict" });
    expect(await saveDraft(store, "lab", [], t0.toISOString(), t1)).toEqual({ status: "ok", draftUpdatedAt: t1.toISOString() });
  });

  it("refuses a draft over 1 MB", async () => {
    const result = await saveDraft(store, "lab", "x".repeat(1_000_001), null, t0);
    expect(result).toMatchObject({ status: "invalid" });
  });
});

describe("publishDoc", () => {
  it("needs a draft", async () => {
    expect(await publishDoc(store, "lab", t0, any)).toEqual({ status: "invalid", issues: [{ doc: "lab", at: "", message: "there is no draft to publish" }] });
  });

  it("reports schema problems with their path", async () => {
    await saveDraft(store, "lab", [{ title: "", description: "x" }], null, t0);
    const result = await publishDoc(store, "lab", t1, any);
    expect(result.status).toBe("invalid");
    expect(result.status === "invalid" && result.issues[0]).toMatchObject({ doc: "lab", at: "0/title" });
  });

  it("refuses to publish a draft newer than the caller saw", async () => {
    await saveDraft(store, "lab", [{ title: "A", description: "x" }], null, t0);
    await saveDraft(store, "lab", [{ title: "B", description: "x" }], t0.toISOString(), t1);
    expect(await publishDoc(store, "lab", t1, any, t0.toISOString())).toEqual({ status: "conflict" });
    expect((await store.getDoc("lab"))?.published).toBeNull();
    expect(await publishDoc(store, "lab", t1, any, t1.toISOString())).toEqual({ status: "ok", publishedAt: t1.toISOString() });
  });

  it("publishes an edited page and clears its draft", async () => {
    await saveDraft(store, "work/nebuu", { ...nebuu, intro: "New intro." }, null, t0);
    expect(await publishDoc(store, "work/nebuu", t1, any)).toEqual({ status: "ok", publishedAt: t1.toISOString() });
    expect((await live()).pages.find((p) => p.slug === "nebuu")?.intro).toBe("New intro.");
    expect((await store.getDoc("work/nebuu"))?.draft).toBeNull();
  });

  it("refuses a page that breaks another document", async () => {
    const noYears: ProductPage = { ...nebuu, facts: nebuu.facts.filter((f) => f.label !== "Years") };
    await saveDraft(store, "work/nebuu", noYears, null, t0);
    expect(await publishDoc(store, "work/nebuu", t1, any)).toEqual({
      status: "invalid",
      issues: [{ doc: "work/nebuu", at: "facts", message: "Experience links this page, so it needs a Years fact" }],
    });
    expect((await store.getDoc("work/nebuu"))?.published).toBeNull();
  });

  it("refuses a page whose slug changed", async () => {
    await saveDraft(store, "work/nebuu", { ...nebuu, slug: "nebuu-2" }, null, t0);
    expect(await publishDoc(store, "work/nebuu", t1, any)).toMatchObject({ status: "invalid", issues: [{ at: "slug" }] });
  });
});

describe("createPage", () => {
  it("creates a draft-only page that goes live, last in the index, on its first valid publish", async () => {
    expect(await createPage(store, { slug: "new-thing", org: "orkestra", title: "New Thing", kind: "game" }, t0)).toEqual({ status: "ok", slug: "new-thing" });
    expect(indexSlugs(publishedValues(await store.listDocs()))).not.toContain("new-thing");
    expect((await publishDoc(store, "work/new-thing", t1, any)).status).toBe("invalid");

    const doc = await store.getDoc("work/new-thing");
    const draft = doc!.draft as ProductPage;
    const filled: ProductPage = {
      ...draft,
      intro: "A new thing.",
      facts: draft.facts.map((fact) => (fact.label === "Years" ? { ...fact, value: "2026" } : fact)),
      blocks: [{ kind: "text", id: "what-i-did", heading: "What I did", body: ["Made it."] }],
    };
    await saveDraft(store, "work/new-thing", filled, doc!.draftUpdatedAt!.toISOString(), t1);
    expect((await publishDoc(store, "work/new-thing", t1, any)).status).toBe("ok");
    expect((await live()).pages.at(-1)?.slug).toBe("new-thing");
  });

  it("refuses a taken or malformed slug and a missing title", async () => {
    const result = await createPage(store, { slug: "nebuu", org: "orkestra", title: " ", kind: "" }, t0);
    expect(result).toMatchObject({ status: "invalid" });
    expect(result.status === "invalid" && result.issues.map((i) => i.at)).toEqual(["title", "slug"]);
    expect((await createPage(store, { slug: "Bad Slug", org: "orkestra", title: "X", kind: "" }, t0)).status).toBe("invalid");
  });

  it("starts from the org's role and name and one What I did block", () => {
    const page = newPage({ slug: "x", org: "primetek", title: "X", kind: "kit" });
    expect(page.facts).toEqual([
      { label: "Role", value: experience.find((e) => e.org === "primetek")!.role },
      { label: "Years", value: "" },
      { label: "At", value: "PrimeTek" },
    ]);
    expect(page.lead).toEqual({ strong: "X.", rest: "" });
    expect(page.blocks).toEqual([{ kind: "text", id: "what-i-did", heading: "What I did", body: [""] }]);
  });
});

describe("deletePage", () => {
  it("is blocked while Experience links the page", async () => {
    const result = await deletePage(store, "nebuu", t0, any);
    expect(result).toMatchObject({ status: "invalid", issues: [{ doc: "experience" }] });
  });

  it("removes an unlinked page from the index and drops its row", async () => {
    const withoutNebuu = experience.map((entry) => ({ ...entry, children: entry.children.filter((c) => c.href !== "/work/nebuu/") }));
    await saveDraft(store, "experience", withoutNebuu, null, t0);
    await publishDoc(store, "experience", t0, any);
    await saveDraft(store, "work/nebuu", nebuu, null, t0);
    expect(await deletePage(store, "nebuu", t1, any)).toEqual({ status: "ok" });
    expect((await live()).pages.map((p) => p.slug)).not.toContain("nebuu");
    expect(await store.getDoc("work/nebuu")).toBeNull();
  });

  it("drops a page that was never published", async () => {
    await createPage(store, { slug: "draft-only", org: "orkestra", title: "Draft", kind: "" }, t0);
    expect(await deletePage(store, "draft-only", t1, any)).toEqual({ status: "ok" });
    expect(await store.getDoc("work/draft-only")).toBeNull();
  });
});

describe("discardDraft and resetDoc", () => {
  it("discards the draft and keeps the published value", async () => {
    await saveDraft(store, "lab", [{ title: "A", description: "B" }], null, t0);
    await publishDoc(store, "lab", t0, any);
    await saveDraft(store, "lab", [], null, t1);
    expect(await discardDraft(store, "lab")).toEqual({ status: "ok" });
    expect(await store.getDoc("lab")).toMatchObject({ draft: null, published: [{ title: "A", description: "B" }] });
  });

  it("resets a document to the repo, but not a page that only exists in the admin", async () => {
    await saveDraft(store, "work/nebuu", nebuu, null, t0);
    await publishDoc(store, "work/nebuu", t0, any);
    expect(await resetDoc(store, "work/nebuu")).toEqual({ status: "ok" });
    expect(await store.getDoc("work/nebuu")).toBeNull();
    await createPage(store, { slug: "admin-only", org: "orkestra", title: "A", kind: "" }, t0);
    expect((await resetDoc(store, "work/admin-only")).status).toBe("invalid");
  });
});
