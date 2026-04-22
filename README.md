<div align="center">
  <a href="https://github.com/saphid/svgl-skill">
    <img src="docs/assets/banner.svg" width="720" alt="svgl-skill" />
  </a>
</div>

<hr />

[![version](https://img.shields.io/badge/version-0.1.0-db2777?style=flat)](https://github.com/saphid/svgl-skill/releases)
[![node](https://img.shields.io/badge/node-%E2%89%A5%2018-db2777?style=flat)](https://nodejs.org)
[![runtime](https://img.shields.io/badge/runtime-pure%20node-db2777?style=flat)](https://github.com/saphid/svgl-skill)
[![deps](https://img.shields.io/badge/dependencies-0-db2777?style=flat)](package.json)
[![agent skill](https://img.shields.io/badge/agent%20skill-ready-db2777?style=flat)](SKILL.md)
[![api](https://img.shields.io/badge/svgl.app-powered-db2777?style=flat)](https://svgl.app)
[![license](https://img.shields.io/badge/license-MIT-db2777?style=flat)](LICENSE)

**`svgl-skill`** is a small, opinionated CLI for pulling brand marks out of [svgl.app](https://svgl.app). Works as a human terminal tool and as an agent skill.

Small, but not only small.

```ts
// in your terminal
svgl show stripe

// in your agent harness
const skill = require('svgl-skill')
await skill.download('linear', { theme: 'dark', out: './brand' })
```

## Quick Start

```bash
git clone https://github.com/saphid/svgl-skill ~/svgl-skill
~/svgl-skill/svgl.js show linear
```

## Features

- **Instant** — ranked matches from svgl.app in under 200 ms
- **Inline preview** — `svgl show <brand>` renders directly into iTerm2 or Kitty
- **Format-agnostic** — SVG, PNG, JPG, JPEG, GIF, all behind one flag
- **Zero dependencies** — pure Node, no `sharp`, no `canvas`, no postinstall
- **Harness-ready** — drop straight into pi, Claude Code, or Codex CLI
- **Theme aware** — `--theme dark`, `--theme light`, `--theme auto`

## Documentation

The manual lives at [`docs/`](docs/). Upstream API at [svgl.app/docs/api](https://svgl.app/docs/api).

## Communication

- [GitHub issues](https://github.com/saphid/svgl-skill/issues) — bugs, feature requests
- [svgl.app](https://svgl.app) — the catalog itself

## Contributing

PRs welcome. Open an issue first for anything larger than a typo.

## Contributors

Thanks to [everyone who has contributed](https://github.com/saphid/svgl-skill/graphs/contributors).

## License

MIT. Brand marks belong to their respective owners; SVGL is the catalog, not the licensor.
