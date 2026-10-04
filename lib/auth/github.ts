// GitHub OAuth for a single user (Sprint 7 spec §4.1). No scopes: the public
// profile is enough to read the numeric user id.

type Fetch = typeof globalThis.fetch;

export function authorizeUrl(clientId: string, redirectUri: string, state: string): string {
  const params = new URLSearchParams({ client_id: clientId, redirect_uri: redirectUri, state, scope: "", allow_signup: "false" });
  return `https://github.com/login/oauth/authorize?${params}`;
}

export async function exchangeCode(
  code: string,
  app: { clientId: string; clientSecret: string; redirectUri: string },
  fetchImpl: Fetch = fetch,
): Promise<string> {
  const response = await fetchImpl("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { accept: "application/json", "content-type": "application/json" },
    body: JSON.stringify({ client_id: app.clientId, client_secret: app.clientSecret, code, redirect_uri: app.redirectUri }),
  });
  const data = (await response.json()) as { access_token?: string; error?: string };
  if (!data.access_token) throw new Error(`GitHub token exchange failed: ${data.error ?? response.status}`);
  return data.access_token;
}

export async function fetchGithubUserId(token: string, fetchImpl: Fetch = fetch): Promise<string> {
  const response = await fetchImpl("https://api.github.com/user", {
    headers: { accept: "application/vnd.github+json", authorization: `Bearer ${token}`, "user-agent": "onursenture.com-admin" },
  });
  if (!response.ok) throw new Error(`GitHub user lookup failed: ${response.status}`);
  const data = (await response.json()) as { id?: number };
  if (typeof data.id !== "number") throw new Error("GitHub user lookup returned no id");
  return String(data.id);
}

// Where to land after sign-in: only paths under /admin/, never another origin.
export function safeNext(next: string | null | undefined): string {
  return next && next.startsWith("/admin/") && !next.includes("\\") ? next : "/admin/";
}
