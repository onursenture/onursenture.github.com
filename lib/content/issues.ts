import type { DocKey } from "./keys";

// A publish problem, placed in its document: `at` is a slash path inside it
// ("highlights/game", "facts", "0/children/2", "" for the whole document), so
// the editor can show it next to the field it belongs to.
export interface Issue {
  doc: DocKey;
  at: string;
  message: string;
}

export function formatIssue(issue: Issue): string {
  return issue.at ? `${issue.doc} ${issue.at}: ${issue.message}` : `${issue.doc}: ${issue.message}`;
}

// The issues of one document at `at` or anywhere under it.
export function issuesAt(issues: Issue[], doc: DocKey, at: string): Issue[] {
  return issues.filter((issue) => issue.doc === doc && (issue.at === at || issue.at.startsWith(`${at}/`)));
}
