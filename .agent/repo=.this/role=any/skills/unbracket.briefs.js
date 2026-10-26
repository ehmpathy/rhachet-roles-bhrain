#!/usr/bin/env node
// .what = rename every bracketed brief file to coordinate form, and rewrite each citation of it.
//
// .why  = a `[` or `]` in a filename breaks a glob, a boot.yml entry, and the shell
//         (`rule.forbid.brackets-in-filenames`, librarian). one rename by hand per file, plus a
//         hunt for each citation, costs ~200 tool calls and misses some; this pass does both
//         from one map, so no citation is left on a name that no longer exists.
//
// the map, per bracket marker in a basename:
//   - `howto.$topic.[guide|lesson].md`   → drop the marker; the lead segment already says it
//   - `philosophy.$topic.[philosophy].md` → drop the marker, for the same reason
//   - any other `[x]`                     → `kind=x` (so `[a][b]` → `kind=a.kind=b`)
//
// scope: git-tracked regular files under `briefs/` dirs, in `src/` and `.agent/repo=.this/`.
//        a symlink is never renamed (its target is). a citation is rewritten in every tracked
//        text file save the sealed and the historical (`.route/`, `.behavior/`, `.dream/`), the
//        reflect test fixtures (their `[feedback]` names are a parsed contract, not a brief), and
//        the brackets rule itself, whose 👎 examples cite bracketed names on purpose.
//
// usage:
//   rhx unbracket.briefs                  # plan: print the map and each file a citation touches
//   rhx unbracket.briefs --mode apply     # rewrite the citations, then rename
//
// exit: 0 = done · 2 = a target name already exists (no file is touched)

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const argv = process.argv.slice(2);
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const mode = flag('mode', 'plan');
if (!['plan', 'apply'].includes(mode)) {
  console.error('✋ ConstraintError: --mode must be plan or apply');
  process.exit(2);
}

// list the tracked files once
const tracked = execFileSync('git', ['ls-files', '-z'])
  .toString()
  .split('\0')
  .filter(Boolean);

// a tracked path is a brief when it sits under a briefs/ dir, in src/ or .agent/repo=.this/, and
// under no dot dir there: a `.scratch/` draft or a `.route/` template uses brackets for its own
// marks (`[compare][factors]`, `[.brief.article]<blend>`), never an archetype, so `kind=` misreads it
const isBriefPath = (rel) =>
  (rel.startsWith('src/') || rel.startsWith('.agent/repo=.this/')) &&
  rel.includes('/briefs/') &&
  !rel
    .slice(rel.indexOf('/briefs/') + '/briefs/'.length)
    .split('/')
    .slice(0, -1)
    .some((segment) => segment.startsWith('.'));

// the files that cite a bracketed name as a 👎 example on purpose; a sweep would void their point
const CITES_ON_PURPOSE = new Set([
  'src/domain.roles/librarian/briefs/rule.forbid.brackets-in-filenames.md',
  'src/domain.roles/librarian/briefs/rule.forbid.brackets-in-filenames.md.min',
]);

// the citation sweep skips sealed and historical trees, and the on-purpose citers
const isRewritable = (rel) =>
  !CITES_ON_PURPOSE.has(rel) &&
  !rel.includes('/.route/') &&
  !rel.startsWith('.route/') &&
  !rel.includes('.behavior/') &&
  !rel.startsWith('.dream/') &&
  !rel.startsWith('src/domain.operations/reflect/.test/') &&
  /\.(md|min|ts|js|yml|yaml|json|sh|snap|txt)$/.test(rel);

// turn one bracketed basename into its coordinate form
const asCoordinateName = (base) => {
  const lead = base.split('.')[0];
  const dropped = base
    .replace(/\.\[(guide|lesson)\]/g, (m) => (lead === 'howto' ? '' : m))
    .replace(/\.\[philosophy\]/g, (m) => (lead === 'philosophy' ? '' : m));
  return dropped.replace(/\]\[/g, '].[').replace(/\[([^\]]+)\]/g, 'kind=$1');
};

// find staged renames this map made that now sit out of scope, so a narrowed scope converges
const stagedByThisMap = execFileSync('git', ['diff', '--cached', '--name-status', '-M', '-z'])
  .toString()
  .split('\0')
  .reduce((acc, token, i, all) => (token.startsWith('R') ? [...acc, { prior: all[i + 1], after: all[i + 2] }] : acc), [])
  .filter((r) => r.prior && r.after)
  .filter((r) => asCoordinateName(path.basename(r.prior)) === path.basename(r.after));
const stagedRenames = stagedByThisMap
  .filter((r) => !isBriefPath(r.prior))
  .map((r) => ({ from: r.after, into: r.prior }));

// the renames already staged in scope: their citations converge on every run, so a missed one heals
const renamesDone = stagedByThisMap.filter((r) => isBriefPath(r.prior)).map((r) => ({ from: r.prior, into: r.after }));

// build the map of renames
const renames = tracked
  .filter(isBriefPath)
  .filter((rel) => /[[\]]/.test(path.basename(rel)))
  .filter((rel) => fs.existsSync(rel) && !fs.lstatSync(rel).isSymbolicLink())
  .map((rel) => ({ from: rel, into: path.join(path.dirname(rel), asCoordinateName(path.basename(rel))) }));

// refuse a collision before any file moves
const collisions = renames.filter((r) => fs.existsSync(r.into));
if (collisions.length) {
  console.error('✋ ConstraintError: a target name already exists');
  for (const c of collisions) console.error(`   ├─ ${c.from} → ${c.into}`);
  process.exit(2);
}

// every move: the forward renames, plus each out-of-scope one undone
const moves = [...renames, ...stagedRenames];

// a revert must not rewrite a name an in-scope brief still holds under the same basename
const namesInScope = new Set(tracked.filter(isBriefPath).map((rel) => path.basename(rel)));
const movesCited = [
  ...renamesDone,
  ...renames,
  ...stagedRenames.filter((r) => !namesInScope.has(path.basename(r.from))),
];

// cite by stem: a citation may drop the `.md` or `.md.min` tail, and the stem still carries the bracket
const asStem = (base) => base.replace(/\.md(\.min)?$/, '');

// the stem pairs, longest first, so a name never rewrites inside a longer one
const pairs = [...new Map(movesCited.map((r) => [asStem(path.basename(r.from)), asStem(path.basename(r.into))])).entries()]
  .filter(([from, into]) => from !== into)
  .sort((a, b) => b[0].length - a[0].length);

// find each file whose text cites an old name
const citers = tracked
  .filter(isRewritable)
  .filter((rel) => fs.existsSync(rel) && !fs.lstatSync(rel).isSymbolicLink())
  .map((rel) => {
    const text = fs.readFileSync(rel, 'utf8');
    const hits = pairs.filter(([from]) => text.includes(from)).length;
    return { rel, text, hits };
  })
  .filter((c) => c.hits > 0);

// report the plan
console.log(`🦉 unbracket.briefs --mode ${mode}`);
console.log(`   ├─ renames: ${renames.length}`);
for (const r of renames) console.log(`   │  ├─ ${r.from}\n   │  │  └─ ${path.basename(r.into)}`);
console.log(`   ├─ out-of-scope renames undone: ${stagedRenames.length}`);
for (const r of stagedRenames) console.log(`   │  ├─ ${r.from}\n   │  │  └─ ${path.basename(r.into)}`);
console.log(`   └─ files that cite an old name: ${citers.length}`);
for (const c of citers) console.log(`      ├─ ${c.rel} (${c.hits})`);
if (mode === 'plan') process.exit(0);

// apply: rewrite the citations, then move the files
for (const c of citers) {
  const next = pairs.reduce((text, [from, into]) => text.split(from).join(into), c.text);
  fs.writeFileSync(c.rel, next);
}
for (const r of moves) execFileSync('git', ['mv', r.from, r.into]);
console.log('✨ applied');
