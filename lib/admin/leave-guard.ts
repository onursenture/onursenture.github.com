// The editors' keyboard shortcut and leave warning, as pure checks so they can
// be tested without a DOM. components/admin/use-doc-editor.ts wires them to
// window listeners while an editor is mounted.

export const LEAVE_QUESTION = "You have unsaved changes. Leave without saving?";

interface Keys {
  key: string;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
}

// Cmd+S on a Mac, Ctrl+S elsewhere (either is accepted everywhere).
export function isSaveShortcut(event: Keys): boolean {
  return (event.metaKey || event.ctrlKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === "s";
}

export interface LeaveClick {
  button: number;
  metaKey: boolean;
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  defaultPrevented: boolean;
}

export interface LeaveAnchor {
  href: string;
  target: string;
  download: boolean;
}

// Whether a click on this anchor takes the current tab to another page of the
// site: a plain left click, no new tab or window, no download, same origin and
// another path or query (a hash-only change stays on the page). Other origins
// unload the page, so the browser's own beforeunload prompt covers them.
export function leavesPage(click: LeaveClick, anchor: LeaveAnchor, current: string): boolean {
  if (click.defaultPrevented || click.button !== 0) return false;
  if (click.metaKey || click.ctrlKey || click.altKey || click.shiftKey) return false;
  if (anchor.download || (anchor.target !== "" && anchor.target !== "_self")) return false;
  let next: URL;
  let here: URL;
  try {
    next = new URL(anchor.href, current);
    here = new URL(current);
  } catch {
    return false;
  }
  if (next.origin !== here.origin) return false;
  return next.pathname !== here.pathname || next.search !== here.search;
}
