import type { ReactNode } from "react";
import { Empty } from "@/components/sections/empty";
import { PageHeader } from "@/components/shell/page-header";
import { SourcesTable } from "@/components/sources/sources-table";
import { DataTable } from "@/components/ui/data-table";
import { Panel, PanelGrid } from "@/components/ui/panel";
import { RelativeTime } from "@/components/ui/relative-time";
import { Stat, StatRow } from "@/components/ui/stat";
import { StatusGlyph } from "@/components/ui/status-glyph";
import { TextLink } from "@/components/ui/text-link";
import { labIndex } from "@/content/lab-index";
import { profile } from "@/content/profile";
import { workIndex } from "@/content/work-index";
import { type ActivityItem, buildActivity } from "@/lib/activity";
import { readSource } from "@/lib/sources/read";
import { readSourceStatuses } from "@/lib/sources/status";
import { LabPanel } from "./lab-index";
import { workColumns } from "./work-index";

function StatusRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex h-9 items-center justify-between gap-3 border-b px-3 last:border-b-0">
      <dt className="type-mono-11 tracking-[0.02em] text-fg-muted uppercase">{label}</dt>
      <dd className="inline-flex items-center gap-2 type-sans-13">{children}</dd>
    </div>
  );
}

function ActivityList({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <div className="p-3">
        <Empty>No activity yet.</Empty>
      </div>
    );
  }
  return (
    <ul>
      {items.map((item, index) => (
        <li key={`${index}-${item.href}`} className="flex h-9 items-center gap-3 border-b px-3 last:border-b-0">
          <StatusGlyph status="ok" className="type-sans-13 text-fg-muted" />
          <span className="w-16 shrink-0 type-mono-11 tracking-[0.02em] text-fg-muted uppercase">{item.verb}</span>
          <a
            href={item.href}
            rel="noopener noreferrer"
            className="min-w-0 flex-1 truncate type-sans-13 hover:underline hover:underline-offset-[0.2em]"
          >
            {item.title}
          </a>
          <RelativeTime iso={item.date} className="shrink-0 type-mono-12 text-fg-muted" />
        </li>
      ))}
    </ul>
  );
}

// Dashboard view of "/" (Overview): a metric row, then the Work, Status, Lab,
// Activity and Sources panels on the 12-column grid. The metrics are the ones
// that mean something at a glance: GitHub contributions over the last 12
// months and the books being read now. A tile whose source has no data is
// left out rather than shown as 0.
export async function HomeDashboard() {
  const [films, books, articles, github, statuses] = await Promise.all([
    readSource("letterboxd"),
    readSource("goodreads"),
    readSource("instapaper"),
    readSource("github"),
    readSourceStatuses(),
  ]);
  const activity = buildActivity({ films: films.data, books: books.data.read, articles: articles.data });
  const metrics = [
    github.data.weeks.length > 0
      ? { label: "Contributions · 12 mo", value: github.data.total }
      : null,
    books.lastSuccessAt ? { label: "Reading now", value: books.data.currentlyReading.length } : null,
    ...(profile.metrics ?? []),
  ].filter((metric) => metric !== null);

  return (
    <main>
      <PageHeader view="dashboard" title="Overview" meta={`${workIndex.length} projects`} />
      <PanelGrid>
        {metrics.length > 0 ? (
          <div data-testid="stat-row" className="col-span-full">
            <StatRow>
              {metrics.map((metric) => (
                <Stat key={metric.label} label={metric.label} value={metric.value} />
              ))}
            </StatRow>
          </div>
        ) : null}
        <Panel title="Work" count={workIndex.length} span={8} id="work">
          <DataTable caption="Selected work" columns={workColumns(workIndex)} rows={workIndex} rowKey={(entry) => entry.title} />
        </Panel>
        <Panel title="Status" span={4} id="status">
          <dl>
            <StatusRow label="Availability">
              {profile.available ? (
                <>
                  <StatusGlyph status="ok" /> Open to roles
                </>
              ) : (
                <>
                  <StatusGlyph status="empty" /> Not announced
                </>
              )}
            </StatusRow>
            <StatusRow label="Booking">
              {profile.bookingUrl ? (
                <TextLink href={profile.bookingUrl}>Book a call</TextLink>
              ) : (
                <>
                  <StatusGlyph status="empty" /> Not set up yet
                </>
              )}
            </StatusRow>
          </dl>
        </Panel>
        <LabPanel entries={labIndex} />
        <Panel title="Activity" count={activity.length} span={8} id="activity">
          <ActivityList items={activity} />
        </Panel>
        <Panel title="Sources" count={statuses.length} span={4} id="sources">
          <SourcesTable statuses={statuses} />
        </Panel>
      </PanelGrid>
    </main>
  );
}
