#!/usr/bin/env node
/**
 * .what = strip every time-of-day from the text files this branch changed: a stamp keeps
 *         its date, a time-only id goes, a bare clock is cut
 * .why  = a timestamp in a tracked file is a privacy leak and churns every diff. a digit
 *         masked as `x` (`T<hh>-<m>x-<ss>-<ms>Z`) still states the hour, and it slips past the
 *         husky check; so a mask counts as a stamp here
 * .note = plan by default; `--mode apply` writes. code files (.ts, .js, .sh) are listed, never written
 */
const fs = require('fs');
const { execFileSync } = require('child_process');

// parse args
const args = process.argv.slice(2);
const mode = args.includes('--mode') ? args[args.indexOf('--mode') + 1] : 'plan';
const base = args.includes('--base') ? args[args.indexOf('--base') + 1] : 'origin/main';
if (!['plan', 'apply'].includes(mode)) {
  console.error('✋ ConstraintError: --mode must be plan or apply');
  process.exit(2);
}

// gather the files this branch touched: committed vs base, staged, unstaged, untracked
const git = (argv) =>
  execFileSync('git', ['-c', 'core.quotepath=off', ...argv])
    .toString()
    .split('\n')
    .filter(Boolean);
const files = [
  ...new Set([
    ...git(['diff', '--name-only', '--diff-filter=ACMR', `${base}...HEAD`]),
    ...git(['diff', '--name-only', '--diff-filter=ACMR', '--cached']),
    ...git(['diff', '--name-only', '--diff-filter=ACMR']),
    ...git(['ls-files', '--others', '--exclude-standard']),
  ]),
].filter((f) => fs.existsSync(f) && fs.statSync(f).isFile());

// the shapes: a digit may be masked as x (21-5x-50)
const D = '[0-9x]';
const STAMP = new RegExp(
  `(\\d{4}-\\d{2}-\\d{2})T${D}{2}[-:]?${D}{2}(?:[-:]?${D}{2})?(?:[.-]\\d{3})?Z?`,
  'g',
);
// the compact form, no dash and no colon (<yyyymmdd>T<hhmmss>Z); the date stays
const STAMP_COMPACT = new RegExp(`(?<![0-9])(\\d{8})T${D}{4}(?:${D}{2})?Z?(?![0-9x])`, 'g');
const TIME_ID =new RegExp(`(?<![0-9])${D}{2}-${D}{2}-${D}{2}-\\d{3}Z`, 'g');
const MS_TAIL = /(?<=\s|^)-\d{3}Z\b/g;
const CLOCK = /(?<![0-9:.])([01][0-9x]|2[0-3x]):[0-5x][0-9x](?::[0-5x][0-9x])?(?:Z|[+-]\d{2}:?\d{2})?(?![0-9x])/g;
const CODE = /\.(ts|tsx|js|mjs|cjs|sh)$/;

// sweep
const changed = [];
const flagged = [];
for (const file of files) {
  const text = fs.readFileSync(file).toString();
  if (text.includes('\u0000')) continue;
  const next = text
    .replace(STAMP, '$1')
    .replace(STAMP_COMPACT, '$1')
    .replace(TIME_ID, '')
    .replace(MS_TAIL, '')
    .replace(CLOCK, '');
  if (next === text) continue;
  if (CODE.test(file)) {
    flagged.push(`${file}: holds a stamp; code, left for a hand fix`);
    continue;
  }
  changed.push(file);
  if (mode === 'apply') fs.writeFileSync(file, next);
}

// report
console.log(`🦉 ${mode === 'apply' ? 'so it is' : 'heres the plan'}`);
console.log('');
console.log(`🔍 timestamps.strip --mode ${mode} --base ${base}`);
console.log(`   ├─ files scanned: ${files.length}`);
console.log(`   ├─ files ${mode === 'apply' ? 'stripped' : 'to strip'}: ${changed.length}`);
changed.forEach((f, i) => console.log(`   │  ${i === changed.length - 1 ? '└─' : '├─'} ${f}`));
console.log(`   └─ flagged for a hand look: ${flagged.length}`);
flagged.forEach((f, i) => console.log(`      ${i === flagged.length - 1 ? '└─' : '├─'} ${f}`));
