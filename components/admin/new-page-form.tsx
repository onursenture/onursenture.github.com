"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";
import { createPageAction } from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import type { OrgId } from "@/content/orgs";
import { kebab } from "@/lib/content/ids";
import type { Issue } from "@/lib/content/issues";
import { IssueText, SelectField, TextField } from "./fields";

// /admin/work/new/: slug (permanent), org, title and kind; creates a draft and
// opens its editor. Nothing is live until the first Publish.
export function NewPageForm({ orgs }: { orgs: { id: OrgId; name: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [typedSlug, setTypedSlug] = useState<string | null>(null);
  const [org, setOrg] = useState<OrgId>("orkestra");
  const [kind, setKind] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [pending, start] = useTransition();
  const slug = typedSlug ?? kebab(title);
  const at = (path: string) => issues.filter((issue) => issue.at === path);

  function submit(event: FormEvent) {
    event.preventDefault();
    start(async () => {
      const result = await createPageAction({ slug, org, title, kind });
      if (result.status === "ok") router.push(`/admin/work/${result.slug}/`);
      else if (result.status === "invalid") setIssues(result.issues);
      else setIssues([{ doc: "work-index", at: "", message: result.status === "unauthorized" ? "Signed out — sign in again." : "The database is unavailable." }]);
    });
  }

  return (
    <main className="mx-auto flex max-w-[480px] flex-col gap-4 px-4 py-8">
      <h1 className="type-lead">New page</h1>
      <form onSubmit={submit} className="flex flex-col gap-3">
        <TextField label="Title" value={title} onChange={setTitle} issues={at("title")} />
        <TextField label="Slug" value={slug} onChange={setTypedSlug} hint={`/work/${slug || "…"}/ · permanent`} issues={at("slug")} />
        <SelectField label="Organisation" value={org} options={orgs.map((item) => ({ value: item.id, label: item.name }))} onChange={setOrg} />
        <TextField label="Kind" value={kind} onChange={setKind} hint="A few words, e.g. word game" />
        <IssueText issues={issues.filter((issue) => !["title", "slug"].includes(issue.at))} />
        <div>
          <Button type="submit" variant="primary" disabled={pending}>
            {pending ? "Creating…" : "Create draft"}
          </Button>
        </div>
      </form>
    </main>
  );
}
