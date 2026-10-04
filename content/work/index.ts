import { primeblocks } from "./primeblocks";
import { primeicons } from "./primeicons";
import { primeone } from "./primeone";
import { primestore } from "./primestore";
import { templates } from "./templates";
import { themeDesigner } from "./theme-designer";
import type { ProductPage } from "./types";

// Product pages, in registry order: PrimeTek (PrimeOne, PrimeBlocks,
// PrimeIcons, Templates, PrimeStore, Theme Designer), then Orkestra in
// Experience order. The home's Selected work orders its pins by `pin.order`.
export const productPages: ProductPage[] = [primeone, primeblocks, primeicons, templates, primestore, themeDesigner];
