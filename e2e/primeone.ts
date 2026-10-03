import { caseStudies } from "../content/work";
import { buildStudyView, filterMedia, pad2 } from "../lib/work/derive";

// PrimeOne as the page derives it (no images needed: labels, counts and order
// don't depend on them), so the e2e expectations grow with the content.
const study = caseStudies.find((item) => item.slug === "primeone")!;
export const primeone = buildStudyView(study, () => undefined);

export const media = primeone.media;
export const total = media.length;
export const position = (index: number) => `${pad2(index + 1)} / ${pad2(total)}`;
export const byId = (id: string) => media.find((item) => item.id === id)!;
export const entry = (id: string) => primeone.groups.flatMap((group) => group.items).find((item) => item.id === id)!;
export const tagged = (tag: string) => filterMedia(media, tag);
