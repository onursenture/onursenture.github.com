import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Button, ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EraStamp } from "@/components/ui/era-stamp";
import { LiveClock } from "@/components/ui/live-clock";
import { MetaLabel } from "@/components/ui/meta-label";
import { RelativeTime } from "@/components/ui/relative-time";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import { Toggle } from "@/components/ui/toggle";

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
    expect(markup).toMatch(/^<span class="[^"]*type-mono-11[^"]*uppercase/);
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
  it("ends with → and keeps internal links internal", () => {
    const markup = html(<TextLink href="/life/">Life</TextLink>);
    expect(markup).toMatch(/^<a [^>]*href="\/life\/"/);
    expect(markup).not.toContain("rel=");
    expect(markup).toContain(" →</span>");
  });

  it("adds rel=noopener noreferrer to external links and never uses ↗", () => {
    const markup = html(<TextLink href="https://letterboxd.com/onur/">Letterboxd</TextLink>);
    expect(markup).toContain('rel="noopener noreferrer"');
    expect(markup).not.toContain("↗");
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

describe("Toggle", () => {
  it("marks exactly the current option as pressed", () => {
    const markup = html(
      <Toggle
        label="View"
        testId="view-toggle"
        value="site"
        options={[
          { value: "site", label: "Site" },
          { value: "dashboard", label: "Dashboard" },
        ]}
      />,
    );
    expect(markup).toContain('role="group" aria-label="View" data-testid="view-toggle"');
    expect(markup.match(/aria-pressed="true"/g)).toHaveLength(1);
    expect(markup).toMatch(/aria-pressed="true"[^>]*>Site</);
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
