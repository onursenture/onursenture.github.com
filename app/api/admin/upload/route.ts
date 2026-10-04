import { type HandleUploadBody, handleUpload } from "@vercel/blob/client";
import { isAdmin } from "@/lib/auth/admin";
import { MAX_BYTES, UPLOAD_TYPES } from "@/lib/media/rules";

// Issues the browser a short-lived token to upload one original straight to
// Blob (spec §3.1): the file never passes through a function, so the 4.5 MB
// body limit doesn't apply. Signed-in admins only (401 otherwise, which the
// client reads as "signed out"), uploads/ only.
export async function POST(request: Request) {
  if (!(await isAdmin())) return Response.json({ error: "unauthorized" }, { status: 401 });
  try {
    const body = (await request.json()) as HandleUploadBody;
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await isAdmin())) throw new Error("unauthorized");
        if (!pathname.startsWith("uploads/")) throw new Error("uploads go under uploads/");
        return { allowedContentTypes: [...UPLOAD_TYPES], maximumSizeInBytes: MAX_BYTES, addRandomSuffix: true };
      },
    });
    return Response.json(json);
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "upload refused" }, { status: 400 });
  }
}
