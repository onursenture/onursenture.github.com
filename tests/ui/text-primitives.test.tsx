import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "@/components/ui/button";
import { ItemLink } from "@/components/sections/item-link";
import { Chip } from "@/components/ui/chip";
import { EraStamp } from "@/components/ui/era-stamp";
import { LiveClock } from "@/components/ui/live-clock";
import { MetaLabel } from "@/components/ui/meta-label";
import { RelativeTime } from "@/components/ui/relative-time";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";

const html = renderToStaticMarkup;

describe("StatusGlyph", () => {
  it("maps each status to its S1 glyph", () => {
    expect(html(<StatusGlyph status="ok" />)).toContain(">●<");
    expect(html(<StatusGlyph status="empty" />)).toContain(">○<");
    expect(html(<StatusGlyph status="late" />)).toContain(">◐<");
  });

  it("colors only the error glyph with --color-danger", () => {
    expect(html(<StatusGlyph status="error" />)).toContain("text-danger");
    expect(html(<StatusGlyph status="ok" />)).not.toContain("text-danger");
  });

  it("is decorative unless labelled", () => {
    expect(html(<StatusGlyph status="ok" />)).toContain('aria-hidden="true"');
    expect(html(<StatusGlyph status="late" label="late" />)).toContain('role="img" aria-label="late"');
  });
});

describe("MetaLabel", () => {
  it("renders an uppercase mono label with an optional leading glyph", () => {
    const markup = html(<MetaLabel status="ok">Films</MetaLabel>);
    expect(markup).toMatch(/^<span class="[^"]*type-label[^"]*uppercase/);
    expect(markup).toContain("●</span>Films");
  });

  it("can render as a heading", () => {
    expect(html(<MetaLabel as="h2">Lab</MetaLabel>)).toMatch(/^<h2 /);
  });
});

describe("Chip and EraStamp", () => {
  it("inverts by default and uses danger colors for errors", () => {
    expect(html(<Chip>live</Chip>)).toContain("bg-fg text-bg");
    expect(html(<Chip tone="danger">error</Chip>)).toContain("bg-danger-bg text-danger");
  });

  it("joins era parts with a middle dot", () => {
    expect(html(<EraStamp parts={["2013", "iOS 6", "pre-flat"]} />)).toContain("2013 · iOS 6 · pre-flat");
    expect(html(<EraStamp parts={[]} />)).toBe("");
  });
});

describe("TextLink", () => {
  it("ends internal links with a non-breaking → and keeps them internal", () => {
    const markup = html(<TextLink href="/life/">Life</TextLink>);
    expect(markup).toMatch(/^<a [^>]*href="\/life\/"/);
    expect(markup).not.toContain("rel=");
    // U+00A0 before the arrow, so it never wraps onto its own line.
    expect(markup).toContain("\u00a0\u2192</span>");
  });

  it("ends external links with ↗ and adds rel=noopener noreferrer", () => {
    const markup = html(<TextLink href="https://letterboxd.com/onur/">Letterboxd</TextLink>);
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).toContain("\u00a0\u2197</span>");
    expect(markup).not.toContain("\u2192");
  });
});

describe("Button", () => {
  it("uses the control radius for every variant", () => {
    expect(html(<Button>Menu</Button>)).toContain("rounded-control");
    expect(html(<Button variant="primary">Go</Button>)).toContain("bg-fg text-bg");
    expect(html(<ButtonLink href="https://cal.com/x">Book a call →</ButtonLink>)).toContain(
      'rel="noopener noreferrer"',
    );
  });
});

describe("client times before hydration", () => {
  it("RelativeTime prerenders the absolute time", () => {
    expect(html(<RelativeTime iso="2026-09-30T22:30:00.000Z" />)).toBe(
      '<time dateTime="2026-09-30T22:30:00.000Z" title="Oct 1, 2026, 1:30 AM">Oct 1, 2026, 1:30 AM</time>',
    );
  });

  it("LiveClock prerenders --:--", () => {
    expect(html(<LiveClock timeZone="Europe/Istanbul" place="Ankara" />)).toBe(
      '<time aria-label="Local time in Ankara">--:--</time>',
    );
  });
});

describe("links in running text", () => {
  it("TextLink underlines always when asked, and only on hover by default", () => {
    expect(html(<TextLink href="/x/">Read</TextLink>)).toContain("group-hover:underline");
    const always = html(
      <TextLink href="/x/" underline="always">
        Read
      </TextLink>,
    );
    expect(always).toContain('class="underline decoration-1 underline-offset-[0.2em]"');
    expect(always).not.toContain("group-hover:underline");
  });

  it("ItemLink underlines always when asked", () => {
    expect(html(<ItemLink href="/x/">PrimeOne</ItemLink>)).toContain("hover:underline");
    const always = html(
      <ItemLink href="/x/" underline="always">
        PrimeOne
      </ItemLink>,
    );
    expect(always).toContain("underline decoration-1 underline-offset-[0.2em]");
    expect(always).not.toContain("hover:underline");
  });
});
