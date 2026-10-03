import { type ReactNode, ViewTransition } from "react";
import { VIEW_SWITCH } from "@/lib/view/transition";

// The site top-bar nav and the dashboard sidebar nav share one view
// transition name, so a view switch morphs one into the other (the rest of
// the page cross-fades as the root snapshot). `default="none"` keeps every
// other transition, such as a navigation, from animating. Wrap only the
// desktop navs: two mounted elements with the same name break the
// transition.
export function ShellMorph({ children }: { children: ReactNode }) {
  return (
    <ViewTransition name="shell-nav" share={{ [VIEW_SWITCH]: "shell-morph", default: "none" }} default="none">
      {children}
    </ViewTransition>
  );
}
