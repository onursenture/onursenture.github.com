import Link from "next/link";
import type { ReactNode } from "react";
import { buttonClass } from "@/components/ui/button";
import { noteCounts } from "@/lib/admin/notes";
import { docRows } from "@/lib/admin/overview";
import { loadPinsEditor } from "@/lib/admin/load";
import { readSourceRows } from "@/lib/admin/sources";
import { getContentStore } from "@/lib/content/get-store";
import type { ContentDoc } from "@/lib/content/store";
import { DocState } from "./doc-state";
import { PinsEditor } from "./pins-editor";
import { SourcesPanel } from "./sources-panel";

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="type-body text-fg">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

async function loadDocs(): Promise<ContentDoc[] | null> {
  try {
    const store = getContentStore();
    return store ? await store.listDocs() : null;
  } catch {
    return null;
  }
}

// The admin home (spec §2.2).
export async function AdminHome() {
  const [docs, sources, pins, counts] = await Promise.all([loadDocs(), readSourceRows(), loadPinsEditor(), noteCounts()]);
  const { pages, home } = docRows(docs ?? []);
  const list = (rows: typeof pages) => (
    <ul className="type-body">
      {rows.map((row) => (
        <li key={row.key} className="flex items-baseline justify-between gap-4 border-t border-line py-1.5">
          <Link href={row.editHref} className="text-accent hover:underline">
            {row.title}
          </Link>
          <span className="type-meta text-fg-muted">
            <DocState row={row} />
          </span>
        </li>
      ))}
    </ul>
  );
  return (
    <main className="mx-auto flex max-w-[960px] flex-col gap-10 px-4 py-8">
      {docs === null ? (
        <p role="alert" className="bg-danger-bg px-3 py-2 type-meta text-danger">
          Database unavailable: editing is off. Public pages show the repo content.
        </p>
      ) : null}
      <Section
        title="Pages"
        action={
          <Link href="/admin/work/new/" className={buttonClass("ghost")}>
            New page
          </Link>
        }
      >
        {list(pages)}
      </Section>
      <Section title="Home">{list(home)}</Section>
      <Section title="Selected work">
        <PinsEditor init={pins.init} items={pins.items} />
      </Section>
      <Section
        title="Notes"
        action={
          <Link href="/admin/notes/" className={buttonClass("ghost")}>
            New note
          </Link>
        }
      >
        <p className="type-body">
          <Link href="/admin/notes/" className="text-accent hover:underline">
            All notes
          </Link>{" "}
          <span className="type-meta text-fg-muted">
            {counts ? `· ${counts.drafts} drafts · ${counts.scheduled} scheduled · ${counts.published} published` : "· database unavailable"}
          </span>
        </p>
      </Section>
      <Section title="Sources">
        <SourcesPanel rows={sources} />
      </Section>
    </main>
  );
}
