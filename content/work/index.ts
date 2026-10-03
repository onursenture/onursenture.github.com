import { primeblocks } from "./primeblocks";
import { primeicons } from "./primeicons";
import { primeone } from "./primeone";
import { templates } from "./templates";
import type { ProductPage } from "./types";

// Product pages, in registry order (PrimeOne, PrimeBlocks, PrimeIcons,
// Templates). The home's Selected work orders its pins by `pin.order`.
export const productPages: ProductPage[] = [primeone, primeblocks, primeicons, templates];
