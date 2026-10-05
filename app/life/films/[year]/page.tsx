import type { Metadata } from "next";
import { FilmsArchive } from "@/components/life/archive/films-archive";
import { filmArchive } from "@/lib/life/archive";
import { readLifeLog } from "@/lib/life-log/read";
import { pageMetadata } from "@/lib/metadata";

// cacheComponents needs at least one param: with no films yet, "undated"
// stands in (it 404s until there are undated films). Other years render on
// demand and are cached.
export async function generateStaticParams() {
  const archive = filmArchive(await readLifeLog("letterboxd"));
  const params = [
    ...archive.years.map((group) => ({ year: String(group.year) })),
    ...(archive.undated.length > 0 ? [{ year: "undated" }] : []),
  ];
  return params.length > 0 ? params : [{ year: "undated" }];
}

export async function generateMetadata({ params }: PageProps<"/life/films/[year]">): Promise<Metadata> {
  const { year } = await params;
  return pageMetadata(year === "undated" ? "Films · Undated" : `Films · ${year}`);
}

export default async function FilmsYearPage({ params }: PageProps<"/life/films/[year]">) {
  return <FilmsArchive year={(await params).year} />;
}
