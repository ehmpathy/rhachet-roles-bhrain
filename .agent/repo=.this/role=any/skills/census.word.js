#!/usr/bin/env node
// .what = census a word across the tree, DOT-PREFIXED FILES INCLUDED.
//
// .why  = `grepsafe` omits every dot-prefixed file and reports exit 0, so its
//         silence has two causes and a reader cannot part them. measured on this
//         route: a `lane` sweep read ~312 occurrences where disk held 1211.
//         ⇒ an audit is evidence about its instrument until the instrument is
//         verified (`.dream/v2026_09_05.enbrief.an-audit-is-evidence-…`).
//
// usage:
//   node .agent/.notes/tool.census-word.js --word lane
//   node .agent/.notes/tool.census-word.js --word lane --path src
//   node .agent/.notes/tool.census-word.js --word lane --names-only
//
// exit: 0 always — this reports, it does not gate.

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const has = (name) => argv.includes(`--${name}`);

const word = flag('word', null);
if (!word) {
  console.error('usage: --word <term> [--path <dir>] [--names-only]');
  process.exit(1);
}
const root = path.resolve(flag('path', '.'));
const namesOnly = has('names-only');

const IGNORE = new Set(['node_modules', '.git', 'dist', 'bin', '.log', 'coverage']);
const TEXT = /\.(md|ts|js|yml|yaml|json|sh|txt)$/;

const pattern = new RegExp(`\\b${word}\\b`, 'gi');

const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isSymbolicLink()) continue; // a symlink is one file counted twice
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile() && TEXT.test(entry.name)) files.push(full);
  }
};
walk(root);

const inName = [];
const inBody = [];
let lines = 0;
let occurrences = 0;

for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  if (pattern.test(path.basename(file))) inName.push(rel);
  pattern.lastIndex = 0;

  if (namesOnly) continue;

  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    continue; // a broken symlink target, or a permission wall
  }
  const hits = text.split('\n').reduce((acc, line, i) => {
    const found = line.match(pattern) ?? [];
    pattern.lastIndex = 0;
    if (found.length) acc.push({ n: i + 1, count: found.length, line: line.trim() });
    return acc;
  }, []);
  if (!hits.length) continue;
  inBody.push({ rel, hits });
  lines += hits.length;
  occurrences += hits.reduce((a, h) => a + h.count, 0);
}

console.log(`word     : ${word}`);
console.log(`scanned  : ${files.length} files under ${path.relative(process.cwd(), root) || '.'}`);
console.log(`filenames: ${inName.length}`);
for (const rel of inName) console.log(`   ${rel}`);
if (namesOnly) process.exit(0);
console.log(`bodies   : ${inBody.length} files · ${lines} lines · ${occurrences} occurrences`);
for (const { rel, hits } of inBody) {
  console.log(`   ${rel}  (${hits.length})`);
  for (const h of hits.slice(0, 4)) console.log(`      ${h.n}: ${h.line.slice(0, 120)}`);
}
