import { type IssueContext, type IssueTarget, labelIssue } from "@/lib/content/issue-labels";
import type { Issue } from "@/lib/content/issues";

// Every publish problem in one list under the toolbar; fields repeat their own.
// After the edit that follows a failed publish the list stays (it says what the
// last attempt found) but no longer claims publishing is blocked. Each issue is
// named in words against the document being edited (`context`); one that maps
// to a block or image card is a button that opens it (`onSelect`).
export function IssuesList({
  issues,
  blocking = true,
  context,
  onSelect,
}: {
  issues: Issue[];
  blocking?: boolean;
  context?: IssueContext;
  onSelect?: (target: IssueTarget) => void;
}) {
  if (issues.length === 0) return null;
  return (
    <div role="alert" className="border-b border-line bg-danger-bg px-4 py-2 type-meta text-danger">
      <p>{blocking ? "Publishing is blocked:" : "The last publish attempt found:"}</p>
      <ul className="list-disc pl-5">
        {issues.map((issue, index) => {
          const { text, target } = labelIssue(issue, context);
          return (
            <li key={index}>
              {target && onSelect ? (
                <button type="button" onClick={() => onSelect(target)} className="text-left underline decoration-dotted underline-offset-2 hover:decoration-solid">
                  {text}
                </button>
              ) : (
                text
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
