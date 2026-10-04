import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "./names";
import { verifySession } from "./session";

// Every server action, upload route and admin page checks this on the server;
// hiding UI is never the protection. Call it inside a Suspense boundary on pages.
export async function isAdmin(): Promise<boolean> {
  const jar = await cookies();
  return verifySession(jar.get(SESSION_COOKIE)?.value);
}

export async function requireAdminPage(path: string): Promise<void> {
  if (!(await isAdmin())) redirect(`/admin/?next=${encodeURIComponent(path)}`);
}
