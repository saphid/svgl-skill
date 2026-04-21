# svgl-skill

A tiny agent skill for searching [svgl.app](https://svgl.app), showing logos inline in the terminal, and downloading SVG icons or wordmarks on demand.

It is designed for pi, Claude Code, Codex CLI, Amp, and similar agent setups.

Use it when you ask for logos, logomarks, brand marks, app icons, product icons, badges, or wordmarks.

## Why this exists

SVGL already has a great public API, but agents often need a repeatable local helper that can:
- search quickly
- inspect the raw match payload
- show an icon inline in supported terminals
- pick light/dark variants
- download icon vs wordmark assets
- save them into the working tree with sane names
- avoid the 403s some default HTTP clients hit without a browser-like `User-Agent`

## Files

- `SKILL.md` — skill instructions
- `svgl.js` — zero-dependency helper CLI
- `test/svgl.test.js` — unit tests

## Requirements

- Node.js 18+

## Install

### pi

Clone into a skills directory:

```bash
git clone https://github.com/alxDisplayr/svgl-skill ~/.pi/agent/skills/svgl
```

### Claude Code

Claude looks for folders that directly contain `SKILL.md`:

```bash
git clone https://github.com/alxDisplayr/svgl-skill ~/svgl-skill
mkdir -p ~/.claude/skills
ln -s ~/svgl-skill ~/.claude/skills/svgl
```

### Codex CLI

```bash
git clone https://github.com/alxDisplayr/svgl-skill ~/.codex/skills/svgl
```

## Usage

```bash
./svgl.js search github
./svgl.js inspect github
./svgl.js show apple --theme dark
./svgl.js download github --theme dark --out ./assets
./svgl.js download github --wordmark --theme light --out ./assets/brands
./svgl.js categories
```

## Output examples

Search:

```text
GitHub [Software]
  url: https://github.com/
  assets: icon, wordmark, themed
  icon: {"light":"https://svgl.app/library/github_light.svg","dark":"https://svgl.app/library/github_dark.svg"}
  wordmark: {"light":"https://svgl.app/library/github_wordmark_light.svg","dark":"https://svgl.app/library/github_wordmark_dark.svg"}
```

Download:

```text
Saved GitHub to ./assets/github-dark.svg
Source: https://svgl.app/library/github_dark.svg
```

## Development

Run tests:

```bash
npm test
```

Run a live smoke check against the SVGL API:

```bash
npm run smoke
```

## API notes

Built against the public SVGL API documented at:
- https://svgl.app/docs/api
- https://svgl.app/api

The API is public but rate-limited and intended for extensions/plugins/community tooling.

## License

MIT
