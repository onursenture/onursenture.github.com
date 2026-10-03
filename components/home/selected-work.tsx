import Link from "next/link";
import { SectionRow } from "@/components/ui/section-row";
import { TextLink } from "@/components/ui/text-link";
import { imageGridSizes } from "@/components/work/blocks";
import { MediaFigure } from "@/components/work/media-figure";
import { type PinView, pad2 } from "@/lib/work/derive";

// The pins' frames sit in the wide row's three-column grid.
export const SELECTED_WORK_SIZES = imageGridSizes(3);

export function pinHref(pin: PinView): string {
  return `/work/${pin.slug}/#${pin.blockId}`;
}

// One pinned image: a 16:10 frame (the image, or the dither placeholder with
// its title as the FIG label), the title, one muted line and the source link
// to the images block it comes from. The frame links there too, but it is
// hidden from assistive tech and the tab order, so each item has one link.
// `sizes` defaults to the home grid's; a specimen elsewhere passes its own.
export function SelectedWorkItem({ pin, sizes = SELECTED_WORK_SIZES }: { pin: PinView; sizes?: string }) {
  const href = pinHref(pin);
  return (
    <li data-pin={pin.slug} className="min-w-0">
      <Link href={href} aria-hidden="true" tabIndex={-1} className="block">
        <MediaFigure media={pin.image} sizes={sizes} label={`FIG. ${pad2(pin.pin.order)} · ${pin.pin.title}`} />
      </Link>
      <p className="mt-2 type-body">{pin.pin.title}</p>
      <p className="truncate type-meta text-fg-muted">{pin.pin.note}</p>
      <p className="mt-1 type-meta">
        <TextLink href={href} className="text-accent">
          {pin.pageTitle}
        </TextLink>
      </p>
    </li>
  );
}

// The home's Selected work: images pinned from the product pages, in pin
// order, three to a row from lg. Hidden while there are no pins.
export function SelectedWork({ pins }: { pins: PinView[] }) {
  if (pins.length === 0) return null;
  return (
    <SectionRow id="selected-work" label="Selected work" wide>
      <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {pins.map((pin) => (
          <SelectedWorkItem key={`${pin.slug}/${pin.image.id}`} pin={pin} />
        ))}
      </ul>
    </SectionRow>
  );
}
