import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CaseStudyHeader } from "@/components/work/case-study-header";
import { StudyBody } from "@/components/work/study-body";
import { StudyBrowser } from "@/components/work/study-browser";
import { renditionUrl } from "@/lib/images/plan";
import { pageMetadata } from "@/lib/metadata";
import { getPrimeIcons } from "@/lib/work/primeicons";
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
  // PrimeIcons shows the real set (spec §4.1); its size and version are facts
  // counted from the package, not written by hand.
  const icons = study.slug === "primeicons" ? await getPrimeIcons() : undefined;
  const facts = icons
    ? [...caseStudyFacts(study, view), { label: "Set", value: `v${icons.version} · ${icons.icons.length} icons` }]
    : caseStudyFacts(study, view);
  return (
    <main className="pb-16">
      <CaseStudyHeader study={study} facts={facts} />
      {/* The fallback is the prerendered page without a figure open.
          StudyBrowser reads ?fig after hydration, so every query shares one
          cached HTML (spec §3.2). */}
      <Suspense fallback={<StudyBody study={view} />}>
        <StudyBrowser study={view} icons={icons} />
      </Suspense>
    </main>
  );
}
