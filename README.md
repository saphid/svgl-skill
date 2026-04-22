# svgl-skill

A tiny skill for downloading brand SVGs from [svgl.app](https://svgl.app) by name.

<p align="center">
  <img src="docs/assets/apple.png" alt="Apple logo" width="120" />
  &nbsp;&nbsp;&nbsp;
  <img src="docs/assets/vercel.png" alt="Vercel logo" width="120" />
  &nbsp;&nbsp;&nbsp;
  <img src="docs/assets/github-wordmark.png" alt="GitHub wordmark" width="300" />
</p>

## Invariant

Given a brand name:
1. find the exact SVGL item
2. choose one route
3. write one file

Everything in this repo follows that shape.

## Files

- `svgl-simple.ts` — clean TypeScript version with `--light`, `--dark`, `--wordmark`, and `--out`
- `svgl-simple.sh` — minimal bash version for exact-match SVG download
- `SKILL.md` — skill instructions for agents

## TypeScript usage

```bash
node svgl-simple.ts apple
node svgl-simple.ts apple --dark
node svgl-simple.ts github --wordmark
node svgl-simple.ts github --wordmark --light --out ./github-wordmark.svg
```

### Flags

- `--light` — prefer light themed route
- `--dark` — prefer dark themed route
- `--wordmark` — use the wordmark instead of the icon
- `--out <path>` — output file path

## Bash usage

```bash
./svgl-simple.sh apple
./svgl-simple.sh apple ./apple.svg
```

This bash version does the minimum:
- fetch catalog
- exact-match title
- choose one route
- save one SVG

## Skill usage

The skill is for requests like:
- show me the Apple logo
- download the GitHub wordmark
- get me the Linear icon as SVG
- grab the Stripe logo

## Requirements

### TypeScript version
- Node with `fetch` support and direct `.ts` execution

### Bash version
- `curl`
- `jq`

## Notes

- SVGL provides SVG assets.
- This repo intentionally stays small and dependency-light.
- If you need PNG/JPG/GIF conversion, do that after download with the platform tool of your choice.

## License

MIT
