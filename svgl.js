#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import { spawn } from 'node:child_process';

const API_BASE = 'https://api.svgl.app';
const USER_AGENT = 'svgl-skill/0.1 (+https://github.com/alxDisplayr/svgl-skill)';

export function slugify(value) {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'icon';
}

export function parseArgs(argv) {
  const positional = [];
  const flags = {
    limit: 5,
    theme: 'auto',
    json: false,
    exact: false,
    wordmark: false,
    noOptimize: false,
    out: '.',
    filename: null,
    width: null,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    const next = argv[i + 1];

    if (arg === '--limit' || arg === '-n') {
      if (!next) throw new Error(`${arg} requires a value`);
      flags.limit = Number.parseInt(next, 10);
      if (!Number.isFinite(flags.limit) || flags.limit <= 0) throw new Error(`${arg} must be a positive integer`);
      i += 1;
      continue;
    }
    if (arg === '--theme') {
      if (!next) throw new Error('--theme requires a value');
      flags.theme = next;
      i += 1;
      continue;
    }
    if (arg === '--out' || arg === '-o') {
      if (!next) throw new Error(`${arg} requires a value`);
      flags.out = next;
      i += 1;
      continue;
    }
    if (arg === '--filename') {
      if (!next) throw new Error('--filename requires a value');
      flags.filename = next;
      i += 1;
      continue;
    }
    if (arg === '--width') {
      if (!next) throw new Error('--width requires a value');
      flags.width = next;
      i += 1;
      continue;
    }
    if (arg === '--json') {
      flags.json = true;
      continue;
    }
    if (arg === '--exact') {
      flags.exact = true;
      continue;
    }
    if (arg === '--wordmark') {
      flags.wordmark = true;
      continue;
    }
    if (arg === '--no-optimize') {
      flags.noOptimize = true;
      continue;
    }
    if (arg === '--help' || arg === '-h') {
      flags.help = true;
      continue;
    }
    positional.push(arg);
  }

  return { positional, flags };
}

async function fetchWithHeaders(url) {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json, text/plain, */*',
      'User-Agent': USER_AGENT,
    },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status} ${response.statusText}${body ? `\n${body.slice(0, 500)}` : ''}`);
  }

  return response;
}

async function fetchJson(url) {
  const response = await fetchWithHeaders(url);
  return response.json();
}

async function fetchText(url) {
  const response = await fetchWithHeaders(url);
  return response.text();
}

async function commandExists(command) {
  return new Promise((resolve) => {
    const child = spawn('sh', ['-lc', `command -v ${command} >/dev/null 2>&1`], { stdio: 'ignore' });
    child.on('exit', (code) => resolve(code === 0));
    child.on('error', () => resolve(false));
  });
}

function endpointForSearch(query, limit) {
  const params = new URLSearchParams();
  params.set('search', query);
  params.set('limit', String(limit));
  return `${API_BASE}?${params.toString()}`;
}

export function chooseAssetUrl(icon, { theme = 'auto', wordmark = false } = {}) {
  const asset = wordmark && icon.wordmark ? icon.wordmark : icon.route;
  if (!asset) {
    throw new Error(`No ${wordmark ? 'wordmark' : 'icon'} asset available for ${icon.title}`);
  }

  if (typeof asset === 'string') {
    return asset;
  }

  if (theme !== 'auto' && asset[theme]) {
    return asset[theme];
  }

  return asset.light || asset.dark || Object.values(asset)[0];
}

export function resolveOutputPath(icon, { out = '.', filename = null, theme = 'auto', wordmark = false } = {}) {
  const ext = '.svg';
  const explicitFile = filename || (out.toLowerCase().endsWith(ext) ? path.basename(out) : null);
  const baseDir = out.toLowerCase().endsWith(ext) ? path.dirname(out) : out;
  const suffix = [wordmark ? 'wordmark' : null, theme !== 'auto' ? theme : null].filter(Boolean).join('-');
  const generated = `${slugify(icon.title)}${suffix ? `-${suffix}` : ''}${ext}`;
  return path.join(baseDir, explicitFile || generated);
}

function normalizeTitle(value) {
  return String(value).trim().toLowerCase();
}

function normalizeLoose(value) {
  return normalizeTitle(value).replace(/[^a-z0-9]+/g, '');
}

function getSearchHaystacks(icon) {
  return [icon.title, icon.url, icon.brandUrl]
    .filter(Boolean)
    .map((value) => normalizeTitle(value));
}

export function rankIcon(icon, query) {
  const rawQuery = normalizeTitle(query);
  const compactQuery = normalizeLoose(query);
  const tokens = rawQuery.split(/\s+/).filter(Boolean);
  const title = normalizeTitle(icon.title);
  const compactTitle = normalizeLoose(icon.title);
  const haystacks = getSearchHaystacks(icon);

  let score = 0;
  if (title === rawQuery || compactTitle === compactQuery) score += 1000;
  if (title.includes(rawQuery) || compactTitle.includes(compactQuery)) score += 250;
  if (rawQuery.includes(title) || compactQuery.includes(compactTitle)) score += 50;

  for (const token of tokens) {
    if (title.includes(token)) score += 40;
    else if (haystacks.some((value) => value.includes(token))) score += 15;
  }

  if (haystacks.some((value) => value.includes(rawQuery) || value.replace(/[^a-z0-9]+/g, '').includes(compactQuery))) {
    score += 120;
  }

  return score;
}

export function rankAndFilterIcons(results, query, limit = 5) {
  return results
    .map((icon) => ({ icon, score: rankIcon(icon, query) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.icon.title.localeCompare(b.icon.title))
    .slice(0, limit)
    .map((entry) => entry.icon);
}

export function pickBestMatch(results, query, exact = false) {
  if (!results.length) return null;
  if (!exact) return results[0];

  const normalizedQuery = normalizeTitle(query);
  return results.find((item) => normalizeTitle(item.title) === normalizedQuery) || null;
}

async function fetchAllIcons() {
  return fetchJson(API_BASE);
}

async function searchIcons(query, limit) {
  const allIcons = await fetchAllIcons();
  const localMatches = rankAndFilterIcons(allIcons, query, limit);
  if (localMatches.length > 0) {
    return localMatches;
  }

  return fetchJson(endpointForSearch(query, limit));
}

async function listCategories() {
  return fetchJson(`${API_BASE}/categories`);
}

export function getDisplayStrategy(env = process.env) {
  if (env.ITERM_SESSION_ID || env.TERM_PROGRAM === 'iTerm.app') return { command: 'imgcat', args: [] };
  if (env.KITTY_WINDOW_ID || env.TERM === 'xterm-kitty') return { command: 'kitten', args: ['icat'] };
  return null;
}

async function runDisplayCommand(strategy, filePath, width = null) {
  const args = [...strategy.args];
  if (strategy.command === 'imgcat' && width) {
    args.push('-W', String(width));
  }
  if (strategy.command === 'kitten' && width) {
    args.push('--place', `${width}x0@0x0`);
  }
  args.push(filePath);

  await new Promise((resolve, reject) => {
    const child = spawn(strategy.command, args, { stdio: 'inherit' });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${strategy.command} exited with code ${code}`));
    });
    child.on('error', reject);
  });
}

async function showSvg(svg, flags) {
  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'svgl-show-'));
  const filePath = path.join(tmpDir, 'preview.svg');
  await fs.writeFile(filePath, svg, 'utf8');

  const strategy = getDisplayStrategy();
  if (!strategy) {
    throw new Error('No supported inline image viewer found. Supported terminals: iTerm2 (imgcat) and Kitty (kitten icat).');
  }
  if (!(await commandExists(strategy.command))) {
    throw new Error(`Display command not found in PATH: ${strategy.command}`);
  }

  await runDisplayCommand(strategy, filePath, flags.width);
  return filePath;
}

function formatKinds(icon) {
  return [
    icon.route ? 'icon' : null,
    icon.wordmark ? 'wordmark' : null,
    typeof icon.route === 'object' ? 'themed' : null,
  ].filter(Boolean).join(', ');
}

function printSearchResults(results) {
  for (const icon of results) {
    console.log(`${icon.title} [${Array.isArray(icon.category) ? icon.category.join(', ') : icon.category}]`);
    console.log(`  url: ${icon.url}`);
    console.log(`  assets: ${formatKinds(icon)}`);
    console.log(`  icon: ${typeof icon.route === 'string' ? icon.route : JSON.stringify(icon.route)}`);
    if (icon.wordmark) {
      console.log(`  wordmark: ${typeof icon.wordmark === 'string' ? icon.wordmark : JSON.stringify(icon.wordmark)}`);
    }
    if (icon.brandUrl) {
      console.log(`  brand: ${icon.brandUrl}`);
    }
    console.log('');
  }
}

function printCategories(categories) {
  for (const entry of categories) {
    console.log(`${entry.category}: ${entry.total}`);
  }
}

function usage() {
  console.log(`svgl.js - search, show, and download icons from svgl.app

Usage:
  svgl.js search <query> [--limit N] [--exact] [--json]
  svgl.js inspect <query> [--exact] [--json]
  svgl.js show <query> [--theme auto|light|dark] [--wordmark] [--exact] [--width N]
  svgl.js download <query> [--theme auto|light|dark] [--wordmark] [--exact] [--out PATH] [--filename NAME.svg] [--no-optimize]
  svgl.js categories [--json]

Examples:
  svgl.js search github
  svgl.js inspect next.js --exact --json
  svgl.js show apple --theme dark
  svgl.js download github --theme dark --out ./assets
  svgl.js download vercel --wordmark --theme light --filename vercel-wordmark.svg
  svgl.js categories
`);
}

async function handleSearch(query, flags) {
  const results = await searchIcons(query, flags.limit);
  if (flags.exact) {
    const match = pickBestMatch(results, query, true);
    const filtered = match ? [match] : [];
    if (flags.json) {
      console.log(JSON.stringify(filtered, null, 2));
      return;
    }
    if (!filtered.length) {
      console.error(`No exact match found for \"${query}\".`);
      process.exitCode = 1;
      return;
    }
    printSearchResults(filtered);
    return;
  }

  if (flags.json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }
  printSearchResults(results);
}

async function handleInspect(query, flags) {
  const results = await searchIcons(query, Math.max(flags.limit, 10));
  const match = pickBestMatch(results, query, flags.exact);
  if (!match) {
    console.error(`No ${flags.exact ? 'exact ' : ''}match found for \"${query}\".`);
    process.exitCode = 1;
    return;
  }
  console.log(JSON.stringify(match, null, 2));
}

async function resolveMatch(query, flags) {
  const results = await searchIcons(query, Math.max(flags.limit, 10));
  const match = pickBestMatch(results, query, flags.exact);
  if (!match) {
    console.error(`No ${flags.exact ? 'exact ' : ''}match found for \"${query}\".`);
    process.exitCode = 1;
    return null;
  }
  return match;
}

async function fetchSvgForMatch(match, flags) {
  const assetUrl = chooseAssetUrl(match, { theme: flags.theme, wordmark: flags.wordmark });
  let downloadUrl = assetUrl;
  if (flags.noOptimize) {
    const filename = assetUrl.split('/').pop();
    downloadUrl = `${API_BASE}/svg/${filename}?no-optimize`;
  }
  const svg = await fetchText(downloadUrl);
  return { svg, assetUrl, downloadUrl };
}

async function handleShow(query, flags) {
  const match = await resolveMatch(query, flags);
  if (!match) return;

  const { svg, assetUrl } = await fetchSvgForMatch(match, flags);
  const tempPath = await showSvg(svg, flags);
  console.log(`Displayed ${match.title}`);
  console.log(`Source: ${assetUrl}`);
  console.log(`Temp file: ${tempPath}`);
}

async function handleDownload(query, flags) {
  const match = await resolveMatch(query, flags);
  if (!match) return;

  const { svg, assetUrl, downloadUrl } = await fetchSvgForMatch(match, flags);
  const outputPath = resolveOutputPath(match, flags);
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, svg, 'utf8');

  const result = {
    title: match.title,
    savedTo: outputPath,
    assetUrl,
    downloadUrl,
    category: match.category,
    sourceUrl: match.url,
    usedWordmark: flags.wordmark,
    theme: flags.theme,
  };

  if (flags.json) {
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  console.log(`Saved ${match.title} to ${outputPath}`);
  console.log(`Source: ${assetUrl}`);
}

async function main() {
  const { positional, flags } = parseArgs(process.argv.slice(2));
  const [command, ...rest] = positional;

  if (flags.help || !command) {
    usage();
    return;
  }

  try {
    if (command === 'categories') {
      const categories = await listCategories();
      if (flags.json) {
        console.log(JSON.stringify(categories, null, 2));
        return;
      }
      printCategories(categories);
      return;
    }

    const query = rest.join(' ').trim();
    if (!query) {
      throw new Error(`${command} requires a query`);
    }

    if (!['search', 'inspect', 'show', 'download'].includes(command)) {
      throw new Error(`Unknown command: ${command}`);
    }

    if (!['auto', 'light', 'dark'].includes(flags.theme)) {
      throw new Error(`Unsupported theme: ${flags.theme}`);
    }

    if (command === 'search') {
      await handleSearch(query, flags);
      return;
    }
    if (command === 'inspect') {
      await handleInspect(query, flags);
      return;
    }
    if (command === 'show') {
      await handleShow(query, flags);
      return;
    }
    await handleDownload(query, flags);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exitCode = 1;
  }
}

const isDirectRun = process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href;
if (isDirectRun) {
  await main();
}
