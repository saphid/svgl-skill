import test from 'node:test';
import assert from 'node:assert/strict';

import {
  chooseAssetUrl,
  parseArgs,
  pickBestMatch,
  rankAndFilterIcons,
  resolveOutputPath,
  slugify,
} from '../svgl.js';

const github = {
  title: 'GitHub',
  category: 'Software',
  route: {
    light: 'https://svgl.app/library/github_light.svg',
    dark: 'https://svgl.app/library/github_dark.svg',
  },
  wordmark: {
    light: 'https://svgl.app/library/github_wordmark_light.svg',
    dark: 'https://svgl.app/library/github_wordmark_dark.svg',
  },
  url: 'https://github.com/',
};

test('slugify normalizes names', () => {
  assert.equal(slugify('Next.js'), 'next-js');
  assert.equal(slugify('  Framer Motion  '), 'framer-motion');
});

test('parseArgs collects flags and positional args', () => {
  const { positional, flags } = parseArgs(['download', 'GitHub', '--theme', 'dark', '--wordmark', '--out', './assets', '--json']);
  assert.deepEqual(positional, ['download', 'GitHub']);
  assert.equal(flags.theme, 'dark');
  assert.equal(flags.wordmark, true);
  assert.equal(flags.out, './assets');
  assert.equal(flags.json, true);
});

test('chooseAssetUrl prefers exact theme when available', () => {
  assert.equal(chooseAssetUrl(github, { theme: 'dark' }), github.route.dark);
  assert.equal(chooseAssetUrl(github, { theme: 'light', wordmark: true }), github.wordmark.light);
});

test('chooseAssetUrl falls back when theme is auto', () => {
  assert.equal(chooseAssetUrl(github, { theme: 'auto' }), github.route.light);
});

test('pickBestMatch supports exact title matching', () => {
  const results = [
    { title: 'GitHub Copilot' },
    { title: 'GitHub' },
  ];
  assert.equal(pickBestMatch(results, 'GitHub', false).title, 'GitHub Copilot');
  assert.equal(pickBestMatch(results, 'GitHub', true).title, 'GitHub');
  assert.equal(pickBestMatch(results, 'gitHub', true).title, 'GitHub');
});

test('rankAndFilterIcons promotes the expected brand', () => {
  const results = rankAndFilterIcons([
    { title: 'Granola', url: 'https://www.granola.ai/' },
    { title: 'GitHub Copilot', url: 'https://github.com/features/copilot' },
    { title: 'GitHub', url: 'https://github.com/' },
  ], 'github', 3);
  assert.deepEqual(results.map((item) => item.title), ['GitHub', 'GitHub Copilot']);
});

test('resolveOutputPath derives filename from icon metadata', () => {
  assert.equal(resolveOutputPath(github, { out: './assets', theme: 'dark' }), 'assets/github-dark.svg');
  assert.equal(resolveOutputPath(github, { out: './assets/custom.svg', theme: 'dark' }), 'assets/custom.svg');
  assert.equal(resolveOutputPath(github, { out: './assets', wordmark: true, theme: 'light' }), 'assets/github-wordmark-light.svg');
});
