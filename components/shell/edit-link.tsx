"use client";

import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { HINT_COOKIE } from "@/lib/auth/names";

// The editor for the page you're on: a product page's or the resume's editor, else the admin home.
export function editHref(pathname: string): string {
  if (pathname === "/resume/") return "/admin/resume/";
  const match = /^\/work\/([a-z0-9-]+)\/$/.exec(pathname);
  return match ? `/admin/work/${match[1]}/` : "/admin/";
}

const subscribe = () => () => {};
const hinted = () => document.cookie.split("; ").includes(`${HINT_COOKIE}=1`);

// A small footer link shown only after sign-in (the admin_hint cookie). It
// grants nothing: the editor checks the real session. The server render and a
// signed-out visitor get nothing, so public pages stay static.
export function EditLink() {
  const pathname = usePathname();
  const signedIn = useSyncExternalStore(subscribe, hinted, () => false);
  if (!signedIn || pathname.startsWith("/admin/")) return null;
  return (
    <span className="flex gap-2 whitespace-nowrap">
      <a href={editHref(pathname)} className="hover:text-fg hover:underline">
        Edit
      </a>
      <span aria-hidden="true">·</span>
    </span>
  );
}
