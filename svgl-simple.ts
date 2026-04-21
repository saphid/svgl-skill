#!/usr/bin/env node

// Invariant: resolve one SVGL item, choose one asset URL, then either print it,
// show it, or save it using existing OS primitives.

import { mkdtemp, mkdir, writeFile, copyFile } from 'node:fs/promises'
import { basename, dirname, extname, join } from 'node:path'
import { tmpdir } from 'node:os'
import { spawn } from 'node:child_process'

const API = 'https://api.svgl.app'
const UA = 'svgl-skill-simple-ts/0.1 (+https://github.com/saphid/svgl-skill)'
type Theme = 'auto' | 'light' | 'dark'
type Format = 'svg' | 'png' | 'jpg' | 'jpeg' | 'gif'
type Item = {
  title: string
  category: string | string[]
  route: string | Record<string, string>
  wordmark?: string | Record<string, string>
  url: string
  brandUrl?: string
}

const [cmd = 'help', ...args] = process.argv.slice(2)

const sh = (command: string, argv: string[], quiet = false) => new Promise<void>((resolve, reject) => {
  const child = spawn(command, argv, { stdio: quiet ? 'ignore' : 'inherit' })
  child.on('exit', code => code === 0 ? resolve() : reject(new Error(`${command} exited ${code}`)))
  child.on('error', reject)
})

const exists = (command: string) => new Promise<boolean>(resolve => {
  const child = spawn('sh', ['-lc', `command -v ${command} >/dev/null 2>&1`], { stdio: 'ignore' })
  child.on('exit', code => resolve(code === 0))
  child.on('error', () => resolve(false))
})

const fetchJson = async <T>(url: string): Promise<T> => {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json, text/plain, */*' } })
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`)
  return r.json() as Promise<T>
}

const fetchText = async (url: string) => {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: '*/*' } })
  if (!r.ok) throw new Error(`HTTP ${r.status} ${r.statusText}`)
  return r.text()
}

const lc = (s: string) => s.toLowerCase()
const slug = (s: string) => lc(s).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'icon'
const rank = (item: Item, query: string) => {
  const q = lc(query)
  const t = lc(item.title)
  return (t === q ? 1000 : 0) + (t.includes(q) ? 200 : 0) + (lc(item.url).includes(q) ? 20 : 0) + (lc(item.brandUrl ?? '').includes(q) ? 10 : 0)
}

const pick = async (query: string) => {
  const all = await fetchJson<Item[]>(API)
  return all.map(item => ({ item, score: rank(item, query) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))[0]?.item ?? null
}

const choose = (item: Item, theme: Theme = 'auto', wordmark = false) => {
  const asset = (wordmark && item.wordmark ? item.wordmark : item.route)
  if (typeof asset === 'string') return asset
  if (theme !== 'auto' && asset[theme]) return asset[theme]
  return asset.light ?? asset.dark ?? Object.values(asset)[0]
}

const render = async (svgPath: string, out: string, size = 512) => {
  if (!(await exists('qlmanage')) || !(await exists('sips'))) throw new Error('qlmanage + sips required on macOS')
  const dir = await mkdtemp(join(tmpdir(), 'svgl-render-'))
  const png = join(dir, `${basename(svgPath)}.png`)
  await sh('qlmanage', ['-t', '-s', String(size), '-o', dir, svgPath], true)
  await mkdir(dirname(out), { recursive: true })
  if (extname(out) === '.png') await copyFile(png, out)
  else await sh('sips', ['-s', 'format', extname(out).slice(1), png, '--out', out], true)
}

const save = async (item: Item, format: Format, out: string, theme: Theme = 'auto', wordmark = false, size = 512) => {
  const svg = await fetchText(choose(item, theme, wordmark))
  await mkdir(dirname(out), { recursive: true })
  if (format === 'svg') return writeFile(out, svg, 'utf8')
  const dir = await mkdtemp(join(tmpdir(), 'svgl-src-'))
  const svgPath = join(dir, `${slug(item.title)}.svg`)
  await writeFile(svgPath, svg, 'utf8')
  await render(svgPath, out, size)
}

const show = async (item: Item, theme: Theme = 'auto', wordmark = false) => {
  const dir = await mkdtemp(join(tmpdir(), 'svgl-show-'))
  const file = join(dir, 'preview.svg')
  await writeFile(file, await fetchText(choose(item, theme, wordmark)), 'utf8')
  if ((process.env.ITERM_SESSION_ID || process.env.TERM_PROGRAM === 'iTerm.app') && await exists('imgcat')) await sh('imgcat', [file])
  else if ((process.env.KITTY_WINDOW_ID || process.env.TERM === 'xterm-kitty') && await exists('kitten')) await sh('kitten', ['icat', file])
  else console.log(file)
}

const usage = () => console.log(`svgl-simple.ts

search <query>
inspect <query>
show <query>
download <query> [svg|png|jpg|gif] [out]
convert <query> [png|jpg|gif] [out]
categories`)

try {
  if (cmd === 'help' || cmd === '--help' || cmd === '-h') usage()
  else if (cmd === 'categories') (await fetchJson<{category: string, total: number}[]>(`${API}/categories`)).forEach(x => console.log(`${x.category}: ${x.total}`))
  else {
    const query = args[0]
    if (!query) throw new Error('query required')
    const item = await pick(query)
    if (!item) throw new Error(`no match for ${query}`)

    if (cmd === 'search') console.log(JSON.stringify((await fetchJson<Item[]>(API)).map(item => ({ item, score: rank(item, query) })).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5).map(x => x.item), null, 2))
    else if (cmd === 'inspect') console.log(JSON.stringify(item, null, 2))
    else if (cmd === 'show') await show(item)
    else if (cmd === 'download' || cmd === 'convert') {
      const format = (args[1] ?? (cmd === 'convert' ? 'png' : 'svg')) as Format
      const out = args[2] ?? `./${slug(item.title)}.${format}`
      await save(item, format, out)
      console.log(`${cmd === 'convert' || format !== 'svg' ? 'Converted' : 'Saved'} ${item.title} -> ${out}`)
    } else throw new Error(`unknown command: ${cmd}`)
  }
} catch (error) {
  console.error(`Error: ${(error as Error).message}`)
  process.exitCode = 1
}
