import { Fragment, type ReactNode } from "react";
import { DitherRule } from "@/components/ui/dither";

// Rows of an archive page with the dither rule between them, like /life/.
export function ArchiveMain({ rows }: { rows: ReactNode[] }) {
  return (
    <main className="pb-8">
      {rows.map((row, index) => (
        <Fragment key={index}>
          {index > 0 ? <DitherRule className="mx-4 md:mx-10" /> : null}
          {row}
        </Fragment>
      ))}
    </main>
  );
}
