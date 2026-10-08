// Every public page route (app/**/page.tsx outside app/admin) and the URL the
// axe guard audits for it. tests/a11y-routes.test.ts fails when a page route
// is missing, so a new page can't skip the guard. `path: null` means nothing
// to audit in that build: the page needs data the build doesn't have (it would
// only be the 404, which the [...missing] rows cover) or it renders the same
// component as another row (noted inline).
export interface AuditData {
  workNoteTid?: string;
  lifeNoteTid?: string;
  photoSlug?: string;
  workNotesPage2?: boolean;
  lifeNotesPage2?: boolean;
}

export interface AuditRoute {
  route: string;
  path: string | null;
}

export function auditRoutes(data: AuditData = {}): AuditRoute[] {
  return [
    { route: "(work)", path: "/" },
    { route: "(work)/[...missing]", path: "/does-not-exist/" },
    { route: "(work)/book", path: "/book/" },
    { route: "(work)/changelog", path: "/changelog/" },
    { route: "(work)/colophon", path: "/colophon/" },
    { route: "(work)/notes", path: "/notes/" },
    { route: "(work)/notes/[tid]", path: data.workNoteTid ? `/notes/${data.workNoteTid}/` : null },
    { route: "(work)/notes/page/[n]", path: data.workNotesPage2 ? "/notes/page/2/" : null },
    { route: "(work)/resume", path: "/resume/" },
    { route: "(work)/system", path: "/system/" },
    { route: "(work)/work/[slug]", path: "/work/primeone/" },
    { route: "life", path: "/life/" },
    { route: "life/[...missing]", path: "/life/does-not-exist/" },
    { route: "life/books", path: "/life/books/" },
    { route: "life/films", path: "/life/films/" },
    // The same FilmsArchive body as /life/films/ (which shows the newest year).
    { route: "life/films/[year]", path: null },
    { route: "life/notes", path: "/life/notes/" },
    { route: "life/notes/[tid]", path: data.lifeNoteTid ? `/life/notes/${data.lifeNoteTid}/` : null },
    { route: "life/notes/page/[n]", path: data.lifeNotesPage2 ? "/life/notes/page/2/" : null },
    { route: "life/photos", path: "/life/photos/" },
    { route: "life/photos/[slug]", path: data.photoSlug ? `/life/photos/${data.photoSlug}/` : null },
    { route: "life/saved", path: "/life/saved/" },
    { route: "life/theatre", path: "/life/theatre/" },
  ];
}
