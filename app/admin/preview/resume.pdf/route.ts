import { isAdmin } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { draftResumeView } from "@/lib/content/preview";
import { renderResumePdf } from "@/lib/resume/pdf/document";

// The resume editor's "Preview PDF": the draft, rendered on every request.
// Signed-in only; anyone else gets a 404.
export async function GET() {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });
  try {
    const pdf = await renderResumePdf(await draftResumeView(getContentStore()));
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'inline; filename="onur-senture-resume-draft.pdf"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (e) {
    console.error("[admin resume.pdf]", e instanceof Error ? e.message : e);
    return new Response("The draft PDF could not be rendered.", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
