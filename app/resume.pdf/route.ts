import { publishedResumePdf } from "@/lib/resume/pdf/published";

// /resume.pdf (Sprint 8 spec §3.2): prerendered from the published resume and
// regenerated when a publish updates the content tag. The extension keeps it
// out of the trailing-slash redirect. A render error is a plain 500; /resume/
// never depends on this route.
export async function GET() {
  try {
    const pdf = Buffer.from(await publishedResumePdf(), "base64");
    return new Response(new Uint8Array(pdf), {
      headers: { "Content-Type": "application/pdf", "Content-Disposition": 'inline; filename="onur-senture-resume.pdf"' },
    });
  } catch (e) {
    console.error("[resume.pdf]", e instanceof Error ? e.message : e);
    return new Response("The resume PDF could not be rendered.", { status: 500, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  }
}
