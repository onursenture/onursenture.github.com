import { beatografi } from "./beatografi";
import { countdo } from "./countdo";
import { gonna } from "./gonna";
import { harfMarf } from "./harf-marf";
import { hiJump } from "./hi-jump";
import { imparator } from "./imparator";
import { macKacta } from "./mac-kacta";
import { nebuu } from "./nebuu";
import { primeblocks } from "./primeblocks";
import { primeicons } from "./primeicons";
import { primeone } from "./primeone";
import { primestore } from "./primestore";
import { reboundLine } from "./rebound-line";
import { templates } from "./templates";
import { themeDesigner } from "./theme-designer";
import type { ProductPage } from "./types";

// Product pages, in registry order: PrimeTek (PrimeOne, PrimeBlocks,
// PrimeIcons, Templates, PrimeStore, Theme Designer), then Orkestra in
// Experience order. The home's Selected work orders its pins by content/pins.ts.
export const productPages: ProductPage[] = [
  primeone,
  primeblocks,
  primeicons,
  templates,
  primestore,
  themeDesigner,
  nebuu,
  reboundLine,
  hiJump,
  imparator,
  harfMarf,
  beatografi,
  countdo,
  macKacta,
  gonna,
];
