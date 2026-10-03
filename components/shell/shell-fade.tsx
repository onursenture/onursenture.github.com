import { type ReactNode, ViewTransition } from "react";
import { VIEW_SWITCH } from "@/lib/view/transition";

// The outgoing and incoming shells share one view transition name, so a view
// switch cross-fades the whole page as a shared pair. `default="none"` keeps
// every other transition, such as a navigation, still. Only one shell is ever
// rendered (Next hides the previous view's tree with Activity), so the shared
// name never collides.
export function ShellFade({ children }: { children: ReactNode }) {
  return (
    <ViewTransition name="shell" share={{ [VIEW_SWITCH]: "shell-fade", default: "none" }} default="none">
      {children}
    </ViewTransition>
  );
}
