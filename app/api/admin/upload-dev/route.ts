import { isAdmin } from "@/lib/auth/admin";
import { checkType, MAX_BYTES } from "@/lib/media/rules";
import { getMediaStorage, uploadMode } from "@/lib/media/storage";

// The local stand-in for Blob client uploads (dev and the admin e2e). 404 on
// Vercel and whenever Blob is configured.
export async function POST(request: Request) {
  if (uploadMode() !== "local") return new Response("Not found", { status: 404 });
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  const type = request.headers.get("content-type") ?? "";
  const typeProblem = checkType(type);
  if (typeProblem) return Response.json({ error: typeProblem }, { status: 415 });
  const bytes = Buffer.from(await request.arrayBuffer());
  if (bytes.length > MAX_BYTES) return Response.json({ error: "The file is larger than 25 MB." }, { status: 413 });
  return Response.json({ source: await getMediaStorage().saveSource(bytes, type) });
}
