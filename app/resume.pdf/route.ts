import { publishedResumePdf } from "@/lib/resume/pdf/published";

// /resume.pdf (Sprint 8 spec §3.2): prerendered from the published resume and
// regenerated when a publish updates the content tag. The extension keeps it
// out of the trailing-slash redirect. A render error is logged and rethrown,
// never answered: a prerendered route stores its status, so a 500 would
// replace the last good PDF. Thrown, a background regeneration keeps serving
// the last good PDF, and a build fails loudly if the repo resume can't render.
// /resume/ never depends on this route.
export async function GET() {
  try {
    const pdf = Buffer.from(await publishedResumePdf(), "base64");
    return new Response(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="onur-senture-resume.pdf"' },
    });
  } catch (e) {
    console.error("[resume.pdf]", e instanceof Error ? e.message : e);
    throw e;
  }
}
