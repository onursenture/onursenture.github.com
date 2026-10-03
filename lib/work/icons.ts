export interface IconView {
  // "chart-bar", used as `pi pi-chart-bar`.
  name: string;
  // Inline, recoloured SVG markup (recolorIcon).
  svg: string;
}

export interface IconSet {
  version: string;
  icons: IconView[];
}

// PrimeIcons' raw SVGs are drawn in black (mostly by omission) at a fixed
// size. Inline on the page they must follow the text colour and theme, and
// carry no ids (313 inline icons would collide with page ids).
export function recolorIcon(svg: string): string {
  return svg
    .replace(/<\?xml[^>]*>\s*/, "")
    .replace(/<svg\b([^>]*)>/, (_, attrs: string) => {
      let root = attrs.replace(/\s(?:width|height)="[^"]*"/g, "");
      if (!/\sfill="/.test(root)) root += ' fill="currentColor"';
      return `<svg${root} aria-hidden="true" focusable="false">`;
    })
    .replace(/\sid="[^"]*"/g, "")
    .replace(/(fill|stroke)="(?:black|#000|#000000)"/gi, '$1="currentColor"')
    .replace(/(fill|stroke)="(?:white|#fff|#ffffff)"/gi, 'style="$1:var(--color-bg)"');
}

// Every whitespace-separated term must appear in the name.
export function filterIcons(icons: IconView[], query: string): IconView[] {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return icons;
  return icons.filter((icon) => terms.every((term) => icon.name.includes(term)));
}
