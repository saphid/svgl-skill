---
name: svgl
description: Trigger this for requests to show, preview, display, find, or download logos, logomarks, brand marks, wordmarks, badges, app icons, product icons, and company SVGs from svgl.app.
---

# SVGL

Use this skill when the user wants a logo or brand SVG from svgl.app.

## Invariant

Given a brand name:
1. find the exact SVGL item
2. choose one route
3. write one file

If the task needs more than that, ask whether a more complex tool is actually necessary.

## Primary helper

Use the TypeScript helper first:

```bash
node {baseDir}/svgl-simple.ts apple
node {baseDir}/svgl-simple.ts apple --dark
node {baseDir}/svgl-simple.ts github --wordmark
node {baseDir}/svgl-simple.ts github --wordmark --light --out ./github-wordmark.svg
```

Flags:
- `--light`
- `--dark`
- `--wordmark`
- `--out <path>`

## Bash fallback

Use this when you want the smallest possible exact-match SVG download flow:

```bash
{baseDir}/svgl-simple.sh apple
{baseDir}/svgl-simple.sh apple ./apple.svg
```

## Workflow

1. Run the helper with the brand name.
2. If the user asked for a wordmark, add `--wordmark`.
3. If they care about theme, add `--light` or `--dark`.
4. If they want a specific file path, add `--out`.
5. Return the saved path.

## Notes

- This repo stays intentionally small.
- SVGL provides SVG assets; this skill is for getting the right SVG quickly.
- If there is no exact match, say so clearly instead of guessing.
