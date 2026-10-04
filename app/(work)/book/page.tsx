import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BookingPicker } from "@/components/book/booking-picker";
import { ItemLink } from "@/components/sections/item-link";
import { DitherRule } from "@/components/ui/dither";
import { SectionRow } from "@/components/ui/section-row";
import { booking, bookingEnabled } from "@/content/booking";
import { pageMetadata } from "@/lib/metadata";

const description = "Book a call with Onur Senture: hiring, a project, or mentoring.";

export const metadata: Metadata = pageMetadata("Book a call", { description, openGraph: { description } });

// /book/ (Sprint 8 spec §3.3): the call types on the site grid, the calendar
// opening under the chosen one. 404s while booking isn't set up.
export default function BookPage() {
  if (!bookingEnabled()) notFound();
  return (
    <main className="pb-8">
      <SectionRow
        id="book"
        labelAs="div"
        label={
          <ItemLink href="/" className="text-fg-muted">
            ← Home
          </ItemLink>
        }
      >
        <h1 className="type-lead">
          Book a call. <span className="text-fg-muted">Pick what it&apos;s about; times show in your time zone.</span>
        </h1>
      </SectionRow>
      <DitherRule className="mx-4 md:mx-10" />
      <SectionRow id="call-type" label="Call type">
        <BookingPicker config={booking} />
      </SectionRow>
    </main>
  );
}
