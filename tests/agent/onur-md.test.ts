import { describe, expect, it } from "vitest";
import { type AgentInput, absoluteUrl, bioPlain, buildOnurMd, workSummary } from "@/lib/agent/onur-md";

const input: AgentInput = {
  siteUrl: "https://onursenture.com",
  name: "Onur Senture",
  role: "Designer who builds",
  place: "Ankara",
  available: true,
  intro: ["I'm Onur.", "Second paragraph."],
  bio: ["For ten years I led design at PrimeTek."],
  experience: [{ org: "PrimeTek", role: "Design lead", span: "May 2016–Apr 2026", products: [{ title: "PrimeOne", href: "/work/primeone/" }, { title: "Old thing" }] }],
  work: [{ title: "PrimeOne", summary: "A design system. Eighty components.", href: "/work/primeone/" }],
  lab: [{ title: "count.do [Remastered]", description: "A countdown app.", year: "2026", href: "https://countdo.orkestra.co/" }, { title: "No link", description: "Private." }],
  booking: [{ title: "Role / hiring", minutes: 30, href: "https://cal.com/onursenture/role" }],
  socials: [{ label: "GitHub", href: "https://github.com/onursenture" }],
};

describe("absoluteUrl", () => {
  it("prefixes site paths and keeps full URLs", () => {
    expect(absoluteUrl("https://onursenture.com", "/work/x/")).toBe("https://onursenture.com/work/x/");
    expect(absoluteUrl("https://onursenture.com", "https://x.com/w00f")).toBe("https://x.com/w00f");
  });
});

describe("buildOnurMd", () => {
  const md = buildOnurMd(input);

  it("opens with the name and the intro, then the sections in order", () => {
    expect(md.startsWith("# Onur Senture\n\nI'm Onur.\n\nSecond paragraph.\n\n## Profile\n")).toBe(true);
    const order = ["## Profile", "## Experience", "## Selected work", "## Lab", "## Resume", "## Contact", "## More"].map((h) => md.indexOf(h));
    expect(order.every((at, i) => at > 0 && (i === 0 || at > order[i - 1]))).toBe(true);
  });

  it("states availability only when it is true", () => {
    expect(md).toContain("- Open to work");
    expect(buildOnurMd({ ...input, available: false })).not.toContain("Open to work");
  });

  it("writes absolute links and escapes brackets in titles", () => {
    expect(md).toContain("[PrimeOne](https://onursenture.com/work/primeone/)");
    expect(md).toContain("[count.do \\[Remastered\\]](https://countdo.orkestra.co/) (2026): A countdown app.");
    expect(md).toContain("- No link: Private.");
    expect(md).toContain("**PrimeTek**, Design lead (May 2016–Apr 2026): [PrimeOne](https://onursenture.com/work/primeone/), Old thing");
    expect(md).toContain("[Resume (PDF)](https://onursenture.com/resume.pdf)");
  });

  it("lists booking links, then socials, and never an email address", () => {
    expect(md).toContain("- [Book a call: Role / hiring (30 min)](https://cal.com/onursenture/role)");
    expect(md).toContain("- [GitHub](https://github.com/onursenture)");
    expect(md).not.toMatch(/[\w.+-]+@[\w-]+\.[\w.]+/);
    expect(md).not.toContain("mailto:");
  });

  it("leaves out an empty section", () => {
    const bare = buildOnurMd({ ...input, lab: [], work: [], booking: [] });
    expect(bare).not.toContain("## Lab");
    expect(bare).not.toContain("## Selected work");
    expect(bare).not.toContain("Book a call");
    expect(bare).toContain("## Contact");
  });
});

describe("bioPlain", () => {
  it("names the organisations in plain text", () => {
    expect(bioPlain([["At ", { org: "primetek" }, " and ", { org: "orkestra" }, "."]])).toEqual(["At PrimeTek and Orkestra Studios."]);
  });
});

describe("workSummary", () => {
  it("is the lead's continuation, not the name it opens with", () => {
    expect(workSummary({ strong: "PrimeOne.", rest: " The Figma design system. " })).toBe("The Figma design system.");
  });

  it("falls back to the opening words when there is no continuation", () => {
    expect(workSummary({ strong: " Nebuu. ", rest: "  " })).toBe("Nebuu.");
  });
});
