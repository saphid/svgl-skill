#!/usr/bin/env node

import { writeFileSync } from 'node:fs'

type ThemedRoute = { light?: string; dark?: string }
type Route = string | ThemedRoute

type SvglItem = {
  title: string
  route: Route
  wordmark?: Route
}

type Theme = 'auto' | 'light' | 'dark'

type Options = {
  name: string
  out?: string
  theme: Theme
  wordmark: boolean
}

function parseArgs(argv: string[]): Options {
  const positional: string[] = []
  let out: string | undefined
  let theme: Theme = 'auto'
  let wordmark = false

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '--out') {
      out = argv[i + 1]
      i += 1
      continue
    }
    if (arg === '--light') {
      theme = 'light'
      continue
    }
    if (arg === '--dark') {
      theme = 'dark'
      continue
    }
    if (arg === '--wordmark') {
      wordmark = true
      continue
    }

    positional.push(arg)
  }

  const name = positional[0]
  if (!name) {
    console.error('Usage: node svgl-simple.ts <name> [--light|--dark] [--wordmark] [--out path]')
    process.exit(1)
  }

  return { name, out, theme, wordmark }
}

function pickRoute(route: Route, theme: Theme): string | undefined {
  if (typeof route === 'string') return route
  if (theme === 'light') return route.light ?? route.dark
  if (theme === 'dark') return route.dark ?? route.light
  return route.light ?? route.dark
}

const { name, out, theme, wordmark } = parseArgs(process.argv.slice(2))

const items = await fetch('https://api.svgl.app').then(
  (response) => response.json() as Promise<SvglItem[]>
)

const item = items.find(
  (entry) => entry.title.toLowerCase() === name.toLowerCase()
)

if (!item) {
  console.error(`No SVGL icon found for "${name}"`)
  process.exit(1)
}

const asset = wordmark && item.wordmark ? item.wordmark : item.route
const url = pickRoute(asset, theme)

if (!url) {
  console.error(`No asset route found for "${name}"`)
  process.exit(1)
}

const svg = await fetch(url).then((response) => response.text())
const suffix = [wordmark ? 'wordmark' : null, theme === 'auto' ? null : theme]
  .filter(Boolean)
  .join('-')
const filename = out ?? `${name}${suffix ? `-${suffix}` : ''}.svg`

writeFileSync(filename, svg)
console.log(`Saved ${filename}`)
