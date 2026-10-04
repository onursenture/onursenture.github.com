"use client";

import { useEffect, useRef } from "react";
import { type Booking, type BookingType, calLink } from "@/content/booking";
import { CAL_ORIGIN, loadCal } from "./cal";

// One init per page load; each mounted embed then renders inline into its own element.
let initialised = false;

// The cal.com month view for one call type, inside the 480px content column
// (never stretched across the row). Light theme, the site accent as the brand
// colour, cal.com's own event details hidden (the row above says them).
export function CalEmbed({ type, config }: { type: BookingType; config: Booking }) {
  const ref = useRef<HTMLDivElement>(null);
  const link = calLink(type, config);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.focus();
    const Cal = loadCal();
    if (!initialised) {
      Cal("init", { origin: CAL_ORIGIN });
      initialised = true;
    }
    const accent = getComputedStyle(element).getPropertyValue("--color-accent").trim() || "#2F55F5";
    Cal("inline", { elementOrSelector: element, calLink: link, config: { layout: "month_view", theme: "light" } });
    Cal("ui", { theme: "light", cssVarsPerTheme: { light: { "cal-brand": accent } }, hideEventTypeDetails: true, layout: "month_view" });
    return () => element.replaceChildren();
  }, [link]);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="region"
      aria-label={`Calendar for ${type.title}`}
      data-cal-link={link}
      className="min-h-[420px] w-full max-w-[480px] outline-none"
    />
  );
}
