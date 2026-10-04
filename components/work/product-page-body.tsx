import type { IconSet } from "@/lib/work/icons";
import type { ProductPageView } from "@/lib/work/derive";
import { ProductBlocks } from "./blocks";
import { ProductBrowser } from "./product-browser";
import { ProductHeader } from "./product-header";

// A product page's content, shared by /work/<slug>/ and the admin preview.
export function ProductPageBody({ page, icons }: { page: ProductPageView; icons?: IconSet }) {
  return (
    <main className="pb-16">
      <ProductHeader page={page} />
      <ProductBrowser title={page.title} images={page.images}>
        <ProductBlocks page={page} icons={icons} />
      </ProductBrowser>
    </main>
  );
}
