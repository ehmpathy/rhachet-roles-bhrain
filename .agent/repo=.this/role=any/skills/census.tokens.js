#!/usr/bin/env node
// .what = census the token weight of a glob set, one row per glob plus a total.
//
// .why  = when a review lane returns `constraint ✋` the engine prints a breakdown
//         for its TARGETS and none at all for its `--refs`. so a driver who must
//         narrow the lane is left to guess which ref glob carries the weight —
//         and `rule.forbid.hand-run-reviews` forbids the one experiment that
//         would settle it. measured 2026-09: `behavior-intent-coverage` overflowed
//         at 75.2% of 1M with targets at 307.9k, so ~444k sat in refs and the
//         conversation with no instrument that could part them.
//         ⇒ this is that instrument. it reads the same files the review reads and
//           reports what each glob costs, so a guard edit is a measurement rather
//           than a guess (`rule.require.trust-but-verify`).
//
// .note = the estimate is chars/4, which is the same approximation the role-boot
//         stats print. it is an ESTIMATE and says so on every row — it ranks globs
//         against each other, which is the decision it exists to serve. it does
//         not predict the engine's own count to the token.
//
// usage:
//   rhx census.tokens --glob 'a/**/*.md' --glob 'b/*.md'
//   rhx census.tokens --glob 'src/**' --files
//
// exit: 0 always — this reports, it does not gate.

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const globs = argv.reduce((acc, arg, index) => {
  if (arg === '--glob' && argv[index + 1]) acc.push(argv[index + 1]);
  return acc;
}, []);
const wantFiles = argv.includes('--files');

if (globs.length === 0) {
  console.error('usage: --glob <pattern> [--glob <pattern> ...] [--files]');
  process.exit(1);
}

const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'coverage']);

/**
 * .what = expand a brace group like `{a,b}` into its alternatives
 * .why = the review engine's globs use brace groups (`{src,blackbox}/**`), so a
 *        matcher that cannot read one would report a false zero — the silent
 *        failure `grepsafe`'s own basename defect already taught this repo
 */
const asBraceAlternatives = (pattern) => {
  const open = pattern.indexOf('{');
  if (open === -1) return [pattern];
  const close = pattern.indexOf('}', open);
  if (close === -1) return [pattern];
  const head = pattern.slice(0, open);
  const tail = pattern.slice(close + 1);
  return pattern
    .slice(open + 1, close)
    .split(',')
    .flatMap((part) => asBraceAlternatives(`${head}${part}${tail}`));
};

/**
 * .what = compile one brace-free glob into an anchored regex
 * .why = `**` must cross a separator and `*` must not, which is the one
 *        distinction a naive `.*` translation destroys
 */
const asGlobRegex = (pattern) => {
  const source = pattern
    .split('')
    .reduce((acc, char, index, all) => {
      if (char === '*' && all[index - 1] === '*') return acc;
      if (char === '*' && all[index + 1] === '*') return `${acc}\u0000`;
      if (char === '*') return `${acc}[^/]*`;
      if (char === '?') return `${acc}[^/]`;
      if ('\\^$+.()|[]{}'.includes(char)) return `${acc}\\${char}`;
      return acc + char;
    }, '')
    .split('\u0000')
    .join('.*');
  return new RegExp(`^${source}$`);
};

const asMatchers = (pattern) =>
  asBraceAlternatives(pattern).map((one) => asGlobRegex(one));

/**
 * .what = enumerate every file under a dir, SYMLINKS FOLLOWED
 * .why = a `Dirent` reports a symlink as neither a file nor a directory, and
 *        `.agent/` is largely symlinks into `dist/`
 *        (`hazard.agent-brief-may-be-a-dist-symlink`). ⇒ a walk that tests
 *        `isFile()` alone reports `0 files` for a brief dir that holds forty of
 *        them — a FALSE ZERO, which is the one answer a census must never give
 *        (measured: this tool's own first run scored three brief globs at zero)
 */
const enumAllFiles = (dir, acc) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  entries.forEach((entry) => {
    if (SKIP_DIRS.has(entry.name)) return;
    const full = path.join(dir, entry.name);
    const stat = (() => {
      try {
        return fs.statSync(full);
      } catch {
        return null; // a broken symlink has no target to weigh
      }
    })();
    if (stat === null) return;
    if (stat.isDirectory()) return enumAllFiles(full, acc);
    acc.push(path.relative(process.cwd(), full));
  });
  return acc;
};

const allFiles = enumAllFiles(process.cwd(), []);

const asTokens = (chars) => Math.round(chars / 4);
const asHuman = (tokens) =>
  tokens >= 1000 ? `${(tokens / 1000).toFixed(1)}k` : `${tokens}`;

console.log('');
console.log('📜 census.tokens — an ESTIMATE at chars/4, to rank globs');
console.log('');

const rows = globs.map((glob) => {
  const matchers = asMatchers(glob);
  const matched = allFiles.filter((file) =>
    matchers.some((matcher) => matcher.test(file)),
  );
  const chars = matched.reduce((sum, file) => {
    const stat = fs.statSync(file);
    return sum + stat.size;
  }, 0);
  return { glob, matched, tokens: asTokens(chars) };
});

const total = rows.reduce((sum, row) => sum + row.tokens, 0);

rows
  .slice()
  .sort((a, b) => b.tokens - a.tokens)
  .forEach((row) => {
    const share = total === 0 ? 0 : Math.round((row.tokens / total) * 100);
    console.log(
      `   ├─ ${asHuman(row.tokens).padStart(7)}  ${String(share).padStart(3)}%  ${row.matched.length} files  ${row.glob}`,
    );
    if (wantFiles)
      row.matched
        .slice()
        .sort()
        .forEach((file) => console.log(`   │     · ${file}`));
  });

console.log(`   └─ ${asHuman(total).padStart(7)}  total across ${globs.length} globs`);
console.log('');
