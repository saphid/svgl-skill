# svgl-skill

Search [svgl.app](https://svgl.app) for logos and brand assets, preview them in the terminal, save the original SVG, or convert them into PNG/JPG/GIF files.

<p align="center">
  <img src="docs/assets/apple.png" alt="Apple logo demo" width="140" />
  &nbsp;&nbsp;&nbsp;
  <img src="docs/assets/vercel.png" alt="Vercel logo demo" width="140" />
</p>

<p align="center">
  <img src="docs/assets/github-wordmark.png" alt="GitHub wordmark demo" width="420" />
</p>

## Why this skill exists

SVGL already has a great public API, but in agent workflows you usually want a little more than “here is the raw SVG URL”.

This skill gives you a practical workflow for:
- finding the right logo quickly
- showing it immediately in the CLI when the terminal supports inline images
- downloading the exact SVG asset you want
- converting that SVG into PNG, JPG/JPEG, or GIF when a raster file is needed
- using a sane local ranking layer so brand searches like `github` resolve to **GitHub**, not random fuzzy API noise

## What it can do

### 1) Search

```bash
./svgl.js search github
./svgl.js search "next.js" --exact
```

Find likely matches from the SVGL catalog.

### 2) Inspect

```bash
./svgl.js inspect github
./svgl.js inspect linear --exact
```

Print the raw SVGL record so you can confirm:
- category
- source website
- icon route
- optional wordmark route
- light/dark variants

### 3) Show logos inline in the terminal

```bash
./svgl.js show apple
./svgl.js show apple --theme dark
./svgl.js show github --wordmark --theme light --width 48
```

If the terminal supports inline image rendering, this is the fastest path for requests like:
- “show me the Apple logo”
- “display the GitHub wordmark”
- “preview the Vercel icon”

Currently supported:
- **iTerm2** via `imgcat`
- **Kitty** via `kitten icat`

### 4) Download SVG assets

```bash
./svgl.js download github --theme dark --out ./assets
./svgl.js download vercel --wordmark --theme light --out ./assets/brands
```

This saves the original SVG asset from SVGL.

### 5) Convert to PNG / JPG / GIF

```bash
./svgl.js convert apple --format png --size 1024 --out ./assets
./svgl.js convert github --wordmark --format jpg --size 1024 --out ./assets/brands
./svgl.js convert vercel --format gif --size 768 --out ./assets
```

You can also use `download` with a raster format:

```bash
./svgl.js download apple --format png --size 1024 --out ./assets
```

## Quick examples

### Show me the Apple logo

```bash
./svgl.js show apple
```

### Save the GitHub icon as SVG

```bash
./svgl.js download github --theme dark --exact --out ./assets
```

### Make a PNG version of the Apple logo

```bash
./svgl.js convert apple --exact --format png --size 1024 --out ./assets
```

### Make a GIF version of the GitHub wordmark

```bash
./svgl.js convert github --exact --wordmark --format gif --size 768 --out ./assets/brands
```

## Commands

### `search`

```bash
./svgl.js search <query> [--limit N] [--exact] [--json]
```

### `inspect`

```bash
./svgl.js inspect <query> [--exact] [--json]
```

### `show`

```bash
./svgl.js show <query> [--theme auto|light|dark] [--wordmark] [--exact] [--width N]
```

### `download`

```bash
./svgl.js download <query> \
  [--theme auto|light|dark] \
  [--wordmark] \
  [--exact] \
  [--format svg|png|jpg|jpeg|gif] \
  [--size N] \
  [--out PATH] \
  [--filename NAME.ext] \
  [--no-optimize]
```

### `convert`

```bash
./svgl.js convert <query> \
  [--theme auto|light|dark] \
  [--wordmark] \
  [--exact] \
  --format png|jpg|jpeg|gif \
  [--size N] \
  [--out PATH] \
  [--filename NAME.ext]
```

### `categories`

```bash
./svgl.js categories
./svgl.js categories --json
```

## Important flags

- `--exact` — require exact title match instead of taking the top ranked result
- `--theme auto|light|dark` — choose the themed asset when available
- `--wordmark` — use the wordmark instead of the icon
- `--format svg|png|jpg|jpeg|gif` — choose output format
- `--size N` — raster output size for conversion commands
- `--width N` — width hint for inline terminal display
- `--out PATH` — output directory or full output file path
- `--filename NAME.ext` — force the output filename
- `--json` — machine-readable output
- `--no-optimize` — request the unoptimized SVG payload when SVGL supports it

## How conversion works

SVGL itself provides **SVG assets**.

This repository adds local raster conversion:
1. fetch SVG from SVGL
2. rasterize SVG to PNG on macOS with `qlmanage`
3. if needed, convert that PNG to JPG/JPEG or GIF with `sips`

Current raster formats supported by this repo:
- PNG
- JPG / JPEG
- GIF

## Trigger phrases for agents

This skill is meant to fire for requests like:
- logo / logos
- logomark / logo mark
- brand mark / brand asset
- icon / app icon / product icon
- wordmark
- badge
- “show me the Apple logo”
- “display the GitHub icon”
- “preview the Vercel wordmark”
- “make me a PNG of the Apple logo”
- “export this logo as a GIF”

## Install

### pi

```bash
git clone https://github.com/saphid/svgl-skill ~/.pi/agent/skills/svgl
```

### Claude Code

```bash
git clone https://github.com/saphid/svgl-skill ~/svgl-skill
mkdir -p ~/.claude/skills
ln -s ~/svgl-skill ~/.claude/skills/svgl
```

### Codex CLI

```bash
git clone https://github.com/saphid/svgl-skill ~/.codex/skills/svgl
```

## Development

Run unit tests:

```bash
npm test
```

Run the live smoke test:

```bash
npm run smoke
```

The smoke test currently verifies:
- search
- SVG download
- PNG conversion
- GIF conversion

## API notes

Built against the public SVGL API documented at:
- https://svgl.app/docs/api
- https://svgl.app/api

The SVGL API is public, rate-limited, and intended for extensions/plugins/community tooling.

## License

MIT
