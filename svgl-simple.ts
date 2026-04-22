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

const API_URL = 'https://api.svgl.app'
const USAGE = 'Usage: node svgl-simple.ts <name> [--light|--dark] [--wordmark] [--out path]'

function fail(message: string): never {
  console.error(message)
  process.exit(1)
}

function normalize(value: string): string {
  return value.trim().toLowerCase()
}

function defaultFilename(name: string, theme: Theme, wordmark: boolean): string {
  const suffix = [wordmark ? 'wordmark' : null, theme === 'auto' ? null : theme]
    .filter(Boolean)
    .join('-')

  return `${name}${suffix ? `-${suffix}` : ''}.svg`
}

function parseArgs(argv: string[]): Options {
  const positional: string[] = []
  let out: string | undefined
  let theme: Theme = 'auto'
  let wordmark = false

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '--out') {
      const value = argv[i + 1]
      if (!value) fail(`${USAGE}\nMissing value for --out`)
      out = value
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

    if (arg.startsWith('--')) {
      fail(`${USAGE}\nUnknown flag: ${arg}`)
    }

    positional.push(arg)
  }

  const name = positional[0]?.trim()
  if (!name) fail(USAGE)

  return { name, out, theme, wordmark }
}

function chooseRoute(route: Route, theme: Theme): string | undefined {
  if (typeof route === 'string') return route
  if (theme === 'light') return route.light ?? route.dark
  if (theme === 'dark') return route.dark ?? route.light
  return route.light ?? route.dark
}

function chooseAsset(item: SvglItem, theme: Theme, wordmark: boolean): string | undefined {
  const route = wordmark && item.wordmark ? item.wordmark : item.route
  return chooseRoute(route, theme)
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url)
  if (!response.ok) fail(`Request failed: ${response.status} ${response.statusText}`)
  return response.json() as Promise<T>
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url)
  if (!response.ok) fail(`Asset download failed: ${response.status} ${response.statusText}`)
  return response.text()
}

const { name, out, theme, wordmark } = parseArgs(process.argv.slice(2))
const items = await fetchJson<SvglItem[]>(API_URL)
const item = items.find((entry) => normalize(entry.title) === normalize(name))

if (!item) fail(`No SVGL icon found for "${name}"`)

const assetUrl = chooseAsset(item, theme, wordmark)
if (!assetUrl) fail(`No asset route found for "${name}"`)

const svg = await fetchText(assetUrl)
const filename = out ?? defaultFilename(name, theme, wordmark)

writeFileSync(filename, svg)
console.log(`Saved ${filename}`)
