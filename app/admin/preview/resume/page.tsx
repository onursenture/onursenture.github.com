import { Suspense } from "react";
import { ResumeBody } from "@/components/resume/resume-body";
import { bookingEnabled } from "@/content/booking";
import { requireAdminPage } from "@/lib/auth/admin";
import { getContentStore } from "@/lib/content/get-store";
import { draftResumeView } from "@/lib/content/preview";

export default function PreviewResumePage() {
  return (
    <Suspense fallback={null}>
      <PreviewResume />
    </Suspense>
  );
}

async function PreviewResume() {
  await requireAdminPage("/admin/resume/");
  return <ResumeBody resume={await draftResumeView(getContentStore())} bookable={bookingEnabled()} />;
}
