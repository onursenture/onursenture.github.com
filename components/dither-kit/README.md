# Dither Kit (vendored)

Source: https://www.tripwire.sh/dither-kit (registry `https://www.tripwire.sh/r/<item>.json`,
repo `Boring-Software-Inc/dither-kit`). Licence: MIT, as declared in the
repository's package.json (the repository has no LICENSE file).

Vendored with `npx tsx scripts/vendor-dither-kit.ts`. Items: core, gradient,
button, avatar, area-chart. Not installed: bar, pie and radar charts.

Lint is skipped for this folder (eslint.config.mjs); typecheck still runs.

## Local changes (reapply after re-vendoring)

1. `palette.ts`: `DitherColorInput = DitherColor | Rgb`, and `seedOfColor`
   accepts an Rgb tuple (derives line and star by mixing toward white).
2. `pixel.ts`: `PixelColor` also accepts an Rgb tuple; `fillOf` passes it through.
3. `avatar.tsx`: a `color?: PixelColor` prop overrides the hue.
4. `chart-context.tsx`: `ChartConfig` colours are `DitherColorInput`.

Our wrappers live in `components/ui/` and resolve CSS tokens to Rgb.
