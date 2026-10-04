import { type Issue, formatIssue } from "@/lib/content/issues";

// Every publish problem in one list under the toolbar; fields repeat their own.
// After the edit that follows a failed publish the list stays (it says what the
// last attempt found) but no longer claims publishing is blocked.
export function IssuesList({ issues, blocking = true }: { issues: Issue[]; blocking?: boolean }) {
  if (issues.length === 0) return null;
  return (
    <div role="alert" className="border-b border-line bg-danger-bg px-4 py-2 type-meta text-danger">
      <p>{blocking ? "Publishing is blocked:" : "The last publish attempt found:"}</p>
      <ul className="list-disc pl-5">
        {issues.map((issue, index) => (
          <li key={index}>{formatIssue(issue)}</li>
        ))}
      </ul>
    </div>
  );
}
