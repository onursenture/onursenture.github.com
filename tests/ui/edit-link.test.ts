import { describe, expect, it } from "vitest";
import { editHref } from "@/components/shell/edit-link";

describe("editHref", () => {
  it("opens a product page's editor, and the admin home from anywhere else", () => {
    expect(editHref("/work/nebuu/")).toBe("/admin/work/nebuu/");
    expect(editHref("/")).toBe("/admin/");
    expect(editHref("/life/")).toBe("/admin/");
    expect(editHref("/work/nebuu/extra/")).toBe("/admin/");
    expect(editHref("/resume/")).toBe("/admin/resume/");
  });
});
