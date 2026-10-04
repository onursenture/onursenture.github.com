import type { Metadata } from "next";
import { ResumeBody } from "@/components/resume/resume-body";
import { bookingEnabled } from "@/content/booking";
import { pageMetadata } from "@/lib/metadata";
import { getResume } from "@/lib/resume";
import { firstSentence } from "@/lib/resume/view";

export async function generateMetadata(): Promise<Metadata> {
  const resume = await getResume();
  const description = firstSentence(resume.summary) || `${resume.name}, ${resume.role}.`;
  return pageMetadata("Resume", { description, openGraph: { description } });
}

export default async function ResumePage() {
  return <ResumeBody resume={await getResume()} bookable={bookingEnabled()} />;
}
