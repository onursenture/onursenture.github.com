import { describe, expect, it } from "vitest";
import { buildLlmsTxt } from "@/lib/agent/llms-txt";
import type { AgentInput } from "@/lib/agent/onur-md";

const input: AgentInput = {
  siteUrl: "https://onursenture.com",
  name: "Onur Senture",
  role: "Designer who builds",
  place: "Ankara",
  available: true,
  intro: ["I'm Onur Senture, a designer who builds. More here.", "Second."],
  bio: [],
  experience: [],
  work: [{ title: "PrimeOne", summary: "A design system.", href: "/work/primeone/" }],
  lab: [],
  booking: [],
  socials: [],
};

describe("buildLlmsTxt", () => {
  const txt = buildLlmsTxt(input);

  it("follows the llms.txt shape: one H1, a summary quote, then H2 sections of links", () => {
    expect(txt.match(/^# /gm)).toHaveLength(1);
    expect(txt.startsWith("# Onur Senture\n\n> Designer who builds. I'm Onur Senture, a designer who builds.\n")).toBe(true);
    expect(txt.match(/^## (.+)$/gm)).toEqual(["## Profile", "## Work", "## Optional"]);
    for (const line of txt.split("\n").filter((l) => l.startsWith("- "))) {
      expect(line).toMatch(/^- \[[^\]]+\]\(https:\/\/[^)]+\)(: .+)?$/);
    }
  });

  it("lists onur.md first under Profile", () => {
    const profile = txt.split("## Profile\n\n")[1];
    expect(profile.startsWith("- [onur.md](https://onursenture.com/onur.md)")).toBe(true);
  });

  it("leaves out Work when nothing is pinned", () => {
    expect(buildLlmsTxt({ ...input, work: [] })).not.toContain("## Work");
  });
});
