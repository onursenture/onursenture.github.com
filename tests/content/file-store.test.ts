import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { FileContentStore } from "@/lib/content/file-store";
import { describeContentStore } from "../helpers/content-store-contract";

describeContentStore("FileContentStore", async () => new FileContentStore(join(mkdtempSync(join(tmpdir(), "content-")), "store.json")));

describe("FileContentStore persistence", () => {
  it("is readable by a second instance on the same file", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "content-")), "nested", "store.json");
    await new FileContentStore(path).publish("lab", ["live"], new Date("2026-10-04T10:00:00.000Z"));
    expect((await new FileContentStore(path).getDoc("lab"))?.published).toEqual(["live"]);
  });
});
