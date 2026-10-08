// The first stop for keyboard users on both sides (WCAG 2.4.1): hidden until
// focused, it jumps past the header to the page.
export function SkipLink() {
  return (
    <a
      href="#content"
      className="sr-only type-meta focus:not-sr-only focus:absolute focus:top-2 focus:left-4 focus:z-50 focus:bg-bg focus:px-2 focus:py-1 focus:text-fg"
    >
      Skip to content
    </a>
  );
}
