---
name: svgl
description: Search svgl.app for brand icons/wordmarks and download the best SVG on demand.
---

# SVGL

Use this skill whenever you need a high-quality brand SVG, logo, or wordmark and want to pull it from [svgl.app](https://svgl.app) instead of hunting around random sites.

The helper CLI in this skill wraps the public SVGL API and handles the practical bits:
- searching by brand or product name
- inspecting theme-aware icon variants
- downloading icon or wordmark SVGs
- saving files with predictable names
- sending a browser-like `User-Agent` so API requests do not get blocked like some default runtimes do

## First move

When the user asks for a logo/icon/wordmark:
1. Search first.
2. Inspect if there are multiple plausible matches or theme variants.
3. Download the exact asset you need.
4. Mention the saved file path in your response.

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

### Download an icon

```bash
{baseDir}/svgl.js download github --theme dark --out ./assets
{baseDir}/svgl.js download vercel --theme light --filename vercel-logo.svg
{baseDir}/svgl.js download github --exact --json
```

### Download a wordmark

```bash
{baseDir}/svgl.js download github --wordmark --theme light --out ./assets/brands
```

### Categories

```bash
{baseDir}/svgl.js categories
{baseDir}/svgl.js categories --json
```

## Important flags

- `--exact`: require exact title match instead of taking the first search result
- `--theme auto|light|dark`: choose a themed asset when available
- `--wordmark`: download the wordmark instead of the icon
- `--out PATH`: output directory or full `.svg` file path
- `--filename NAME.svg`: force the output filename
- `--no-optimize`: ask the API for the non-optimized SVG payload when supported
- `--json`: machine-readable output

## Agent workflow

Use this default flow:

1. Search with the user’s term.
2. If there are multiple matches, show the best candidates briefly.
3. If exact branding matters, run `inspect` or `search --exact`.
4. Download to the project’s asset folder.
5. Report the final saved path.

## Examples

- “Grab the GitHub icon as a dark SVG”
  ```bash
  {baseDir}/svgl.js download github --theme dark --out ./assets
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
