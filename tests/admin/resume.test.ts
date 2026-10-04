import { describe, expect, it } from "vitest";
import { experience } from "@/content/experience";
import { alignRoles } from "@/lib/admin/resume";

describe("alignRoles", () => {
  it("gives every Experience org one role, in Experience order, keeping existing bullets", () => {
    const roles = alignRoles(
      [
        { org: "primetek", bullets: ["A"] },
        { org: "orkestra", bullets: ["B"] },
      ],
      experience,
    );
    expect(roles).toEqual([
      { org: "orkestra", bullets: ["B"] },
      { org: "primetek", bullets: ["A"] },
      { org: "etiya", bullets: [] },
    ]);
  });

  it("drops a role whose org left Experience", () => {
    expect(alignRoles([{ org: "bilkent", bullets: ["x"] }], experience).map((role) => role.org)).toEqual(["orkestra", "primetek", "etiya"]);
  });

  it("gives an org listed twice in Experience one role, at its first entry", () => {
    const twice = [...experience, { ...experience[0], role: "Again" }];
    expect(alignRoles([{ org: "orkestra", bullets: ["B"] }], twice)).toEqual([
      { org: "orkestra", bullets: ["B"] },
      { org: "primetek", bullets: [] },
      { org: "etiya", bullets: [] },
    ]);
  });
});
