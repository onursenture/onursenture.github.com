"use client";

import { useState } from "react";
import { Area } from "@/components/dither-kit/area";
import { AreaChart } from "@/components/dither-kit/area-chart";
import type { WeekTotal } from "@/lib/sources/weekly";
import { useTokenColor } from "./use-token-color";

// Weekly contributions as a dithered area: no axes, no legend, no
// interaction. The sentence next to it carries the number and period.
export function ContributionChart({ weeks }: { weeks: WeekTotal[] }) {
  const [el, setEl] = useState<HTMLDivElement | null>(null);
  const accent = useTokenColor(el, "--color-accent");
  return (
    <div ref={setEl} aria-hidden="true" className="h-24 w-full">
      {accent ? (
        <AreaChart
          data={weeks}
          config={{ count: { label: "Contributions", color: accent } }}
          interactive={false}
          margins={{ top: 4, right: 0, bottom: 0, left: 0 }}
          className="h-full w-full"
        >
          <Area dataKey="count" variant="gradient" />
        </AreaChart>
      ) : null}
    </div>
  );
}
