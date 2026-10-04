import { type Issue, formatIssue } from "@/lib/content/issues";

// Every publish problem in one list under the toolbar; fields repeat their own.
export function IssuesList({ issues }: { issues: Issue[] }) {
  if (issues.length === 0) return null;
  return (
    <div role="alert" className="border-b border-line bg-danger-bg px-4 py-2 type-meta text-danger">
      <p>Publishing is blocked:</p>
      <ul className="list-disc pl-5">
        {issues.map((issue, index) => (
          <li key={index}>{formatIssue(issue)}</li>
        ))}
      </ul>
    </div>
  );
}
