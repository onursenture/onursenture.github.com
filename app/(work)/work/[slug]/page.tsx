import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CaseStudyHeader } from "@/components/work/case-study-header";
import { StudyBody } from "@/components/work/study-body";
import { renditionUrl } from "@/lib/images/plan";
import { pageMetadata } from "@/lib/metadata";
import { caseStudyFacts, getCaseStudies, getCaseStudy, getStudyView } from "@/lib/work";

// One page per PrimeTek product (Sprint 5 spec §3). Unknown slugs 404 inside
// the Work shell, like unknown photos.
export function generateStaticParams() {
  return getCaseStudies().map((study) => ({ slug: study.slug }));
}

export async function generateMetadata({ params }: PageProps<"/work/[slug]">): Promise<Metadata> {
  const study = getCaseStudy((await params).slug);
  if (!study) return {};
  const description = `${study.lead.strong} ${study.lead.rest}`;
  const hero = getStudyView(study).hero.image;
  if (!hero) return pageMetadata(study.title, { description, openGraph: { description } });
  // Social crawlers don't reliably render AVIF: always the largest JPEG.
  const ogImage = { url: renditionUrl(hero.key, hero.width, "jpg"), width: hero.width, height: hero.height, alt: study.title };
  return pageMetadata(study.title, {
    description,
    openGraph: { type: "article", description, images: [ogImage] },
    twitter: { card: "summary_large_image", images: [ogImage.url] },
  });
}

export default async function CaseStudyPage({ params }: PageProps<"/work/[slug]">) {
  const study = getCaseStudy((await params).slug);
  if (!study) notFound();
  const view = getStudyView(study);
  return (
    <main className="pb-16">
      <CaseStudyHeader study={study} facts={caseStudyFacts(study, view)} />
      <StudyBody study={view} />
    </main>
  );
}
