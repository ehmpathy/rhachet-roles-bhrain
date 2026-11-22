#!/usr/bin/env node
// .what = retire each test file this repo keeps but never runs: append `.retired` to its name
//         (`$name.test.ts` → `$name.test.ts.retired`), so no tool treats it as code.
//
// .why  = three kinds of test file are kept as records, never as suites:
//         - code a route archives (`archive/`) imports modules the repo has since retired
//         - a `.scratch/` draft imports modules that may never have shipped
//         - a suite that grades an api the repo no longer ships through (passed by --glob)
//         the practice-owned jest configs are exact-match files, so a repo cannot cut these
//         there. a `.retired` suffix takes the file off every `*.ts` glob at once: jest never
//         runs it, tsc never compiles it into dist, biome never lints it. the contents stay
//         byte-identical. its snapshot retires too: a `.snap` with no suite beside it reads as
//         obsolete, which reds the run while every test passes.
//
// scope: `*.test.ts` files (and their `__snapshots__/*.test.ts.snap`), tracked or new, under any
//        `archive/` or `.scratch/` dir, plus any file the `--glob` flags match. a retired file
//        no longer ends in `.test.ts`, so a rerun is a no-op.
//
// usage:
//   rhx retire.suites                                     # plan: archive/ + .scratch/
//   rhx retire.suites --mode apply                        # retire them
//   rhx retire.suites --glob 'src/x/**/step*.integration.test.ts' --mode apply
//
// exit: 0 = done · 2 = bad input, or a target name already exists (no file is touched)

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// read the flags
const argv = process.argv.slice(2);
const valuesOf = (name) =>
  argv.flatMap((arg, i) => (arg === `--${name}` ? [argv[i + 1]] : []));
const mode = valuesOf('mode')[0] ?? 'plan';
if (!['plan', 'apply'].includes(mode)) {
  console.error('✋ ConstraintError: --mode must be plan or apply');
  process.exit(2);
}
const globs = valuesOf('glob');
if (globs.some((glob) => !glob)) {
  console.error('✋ ConstraintError: --glob needs a value');
  process.exit(2);
}

// list the suites, tracked or new: the default dirs, plus each --glob
const asListed = (pathspecs) =>
  execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard', '--', ...pathspecs])
    .toString()
    .split('\0')
    .filter(Boolean);
const isInKeptDir = (rel) =>
  rel.split('/').some((segment) => segment === 'archive' || segment === '.scratch');
const suitesByDir = asListed(['*.test.ts']).filter(isInKeptDir);
const suitesByGlob = globs.length ? asListed(globs.map((glob) => `:(glob)${glob}`)) : [];
const suites = [...new Set([...suitesByDir, ...suitesByGlob])].filter(
  (rel) => rel.endsWith('.test.ts') && fs.existsSync(rel),
);

// pair each suite with its snapshot, if one exists
const asSnapshotOf = (rel) =>
  path.join(path.dirname(rel), '__snapshots__', `${path.basename(rel)}.snap`);
const renames = suites.flatMap((from) => {
  const snap = asSnapshotOf(from);
  return [from, ...(fs.existsSync(snap) ? [snap] : [])].map((rel) => ({
    from: rel,
    into: `${rel}.retired`,
  }));
});

// refuse before any write if a target already exists
const clashes = renames.filter((r) => fs.existsSync(r.into));
if (clashes.length) {
  console.error('✋ ConstraintError: a target name already exists, no file was touched');
  for (const c of clashes) console.error(`   ├─ ${c.into}`);
  process.exit(2);
}

// report, then rename on apply
console.log(`🦉 retire.suites (${mode})`);
console.log(`   ${renames.length ? '├─' : '└─'} files: ${renames.length}`);
renames.forEach((r, i) => {
  const glyph = i === renames.length - 1 ? '└─' : '├─';
  console.log(`   ${glyph} ${r.into}`);
  if (mode === 'apply') fs.renameSync(r.from, r.into);
});
if (mode === 'plan' && renames.length) console.log('\n🥥 run with --mode apply to retire');
