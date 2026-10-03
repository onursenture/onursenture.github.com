import { archiveEntries } from "./archive";
import { primeblocks } from "./primeblocks";
import { primeicons } from "./primeicons";
import { primeone } from "./primeone";
import { templates } from "./templates";
import type { ArchiveEntry, CaseStudy } from "./types";

// Case studies in /work/ display order, and the Archive entries.
export const caseStudies: CaseStudy[] = [primeone, primeblocks, primeicons, templates];

export const archive: ArchiveEntry[] = archiveEntries;
