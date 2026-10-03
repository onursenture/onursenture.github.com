import { type ReactNode, ViewTransition } from "react";
import { LIFE_ENTER, LIFE_EXIT } from "@/lib/side";

// Both shells' outer elements share the name "side", so the Life switch
// animates them as a pair: dim to black into Life, a short cross-fade back.
// default="none" keeps every other navigation still.
export function SideFade({ children }: { children: ReactNode }) {
  return (
    <ViewTransition
      name="side"
      share={{ [LIFE_ENTER]: "life-enter", [LIFE_EXIT]: "life-exit", default: "none" }}
      default="none"
    >
      {children}
    </ViewTransition>
  );
}
