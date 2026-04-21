---
name: svgl
description: Use for logos, logo marks, brand marks, app icons, product icons, wordmarks, badges, and other brand assets from svgl.app, including SVG and converted PNG/JPG/GIF outputs.
---

# SVGL

Use this skill whenever you need a high-quality brand SVG, logo, logomark, brand mark, app icon, product icon, badge, or wordmark and want to pull it from [svgl.app](https://svgl.app) instead of hunting around random sites.

The helper CLI in this skill wraps the public SVGL API and handles the practical bits:
- searching by brand or product name
- inspecting theme-aware icon variants
- showing an icon inline in supported terminals
- downloading icon or wordmark SVGs
- converting SVGs to PNG, JPG/JPEG, or GIF when a raster image is needed
- saving files with predictable names
- sending a browser-like `User-Agent` so API requests do not get blocked like some default runtimes do

## Trigger phrases

Reach for this skill when the user asks for any of these or close synonyms:
- logo / logos
- logomark / logo mark
- brand mark / brand asset / branding asset
- icon / app icon / product icon
- wordmark
- badge
- SVG for a company, product, framework, service, or tool
- PNG / JPG / JPEG / GIF version of a logo or icon
- “show me” / display / preview requests for a logo or icon

## First move

When the user asks for a logo/icon/wordmark/brand asset:
1. Search first.
2. If they say “show me”, “display”, or “preview”, use `show` first when possible.
3. Inspect if there are multiple plausible matches or theme variants.
4. Download or convert the exact asset you need.
5. Mention the saved file path in your response.

## Setup

Requires Node.js 18+.

No npm install is required.

## Commands

### Search

```bash
{baseDir}/svgl.js search github
{baseDir}/svgl.js search "next js" --limit 10
{baseDir}/svgl.js search github --exact
{baseDir}/svgl.js search github --json
```

### Inspect the best match

```bash
{baseDir}/svgl.js inspect github
{baseDir}/svgl.js inspect "next.js" --exact
```

This prints the raw SVGL item so you can see:
- category
- source site URL
- icon route
- optional wordmark route
- light/dark variants

### Show an icon inline in the terminal

```bash
{baseDir}/svgl.js show apple
{baseDir}/svgl.js show apple --theme dark
{baseDir}/svgl.js show github --wordmark --theme light --width 48
```

Supported inline viewers:
- iTerm2 via `imgcat`
- Kitty via `kitten icat`

If inline display is unavailable, use `download` instead.

### Download an icon

```bash
{baseDir}/svgl.js download github --theme dark --out ./assets
{baseDir}/svgl.js download vercel --theme light --filename vercel-logo.svg
{baseDir}/svgl.js download github --exact --json
{baseDir}/svgl.js download apple --format png --size 1024 --out ./assets
```

### Download a wordmark

```bash
{baseDir}/svgl.js download github --wordmark --theme light --out ./assets/brands
```

### Convert to PNG / JPG / GIF

```bash
{baseDir}/svgl.js convert apple --format png --size 1024 --out ./assets
{baseDir}/svgl.js convert github --format jpg --size 512 --out ./assets
{baseDir}/svgl.js convert github --wordmark --format gif --size 768 --out ./assets/brands
```

Notes:
- SVGL itself gives you SVG assets.
- This skill converts SVGs locally to `png`, `jpg`/`jpeg`, or `gif`.
- On macOS this uses `qlmanage` + `sips`.

### Categories

```bash
{baseDir}/svgl.js categories
{baseDir}/svgl.js categories --json
```

## Important flags

- `--exact`: require exact title match instead of taking the first search result
- `--theme auto|light|dark`: choose a themed asset when available
- `--wordmark`: use the wordmark instead of the icon
- `--format svg|png|jpg|jpeg|gif`: output format
- `--size N`: raster output size for png/jpg/jpeg/gif conversion
- `--out PATH`: output directory or full asset file path
- `--filename NAME.ext`: force the output filename
- `--no-optimize`: ask the API for the non-optimized SVG payload when supported
- `--json`: machine-readable output

## Agent workflow

Use this default flow:

1. Search with the user’s term.
2. If there are multiple matches, show the best candidates briefly.
3. If the user says “show me”, “display”, or “preview”, run `show`.
4. If exact branding matters, run `inspect` or `search --exact`.
5. Use `download` for SVG output.
6. Use `convert` or `download --format ...` for PNG/JPG/GIF output.
7. Report the final saved path when you save one.

## Examples

- “Show me the Apple logo”
  ```bash
  {baseDir}/svgl.js show apple
  ```

- “Grab the GitHub icon as a dark SVG”
  ```bash
  {baseDir}/svgl.js download github --theme dark --out ./assets
  ```

- “Make me a PNG of the Apple logo”
  ```bash
  {baseDir}/svgl.js convert apple --format png --size 1024 --out ./assets
  ```

- “Find whether Linear has a wordmark”
  ```bash
  {baseDir}/svgl.js inspect linear
  ```

- “Save the Vercel wordmark into the current directory”
  ```bash
  {baseDir}/svgl.js download vercel --wordmark --theme light --out .
  ```

## Notes

- SVGL’s API is public and intended for extensions/plugins/community tooling.
- Do not use it to recreate SVGL itself.
- Some HTTP clients get blocked by the API unless they send a sensible `User-Agent`; this skill already handles that.
- If SVGL does not have the requested brand, say so clearly and then fall back to another source only if needed.
