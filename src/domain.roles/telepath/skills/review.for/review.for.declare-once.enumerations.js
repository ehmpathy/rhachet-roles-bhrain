#!/usr/bin/env node
/**
 * .what = finds a declared ENUMERATION restated across files — the same closed
 *         list of members, copied rather than cited.
 *
 * .why  = `review.for.declare-once.claims.js` compares whole LINES, so it misses the
 *         costlier shape: a list embedded mid-sentence, where each copy wraps it
 *         in different prose. every copy differs as a line and they carry one
 *         identical enumeration.
 *
 *         🟡 that is the shape `1.vision.yield.md` §4 names as the harder half —
 *            *"a closed range is a count in disguise, and the harder of the two
 *            to see: it names ids, so it reads as an enumeration while its upper
 *            bound is arithmetic."* a copied member list is the same defect at a
 *            different grain: it reads as a citation and it is a copy.
 *
 * ⇒ the cost is not the words. it is that the list's OWNER can grow a member and
 *   every copy then states a shorter list, silently, with no reader in a position
 *   to notice — because no reader ever holds two of the copies at once.
 *
 * how = a SEQUENCE of 3+ comma-joined bare nouns, normalized, matched across
 *       files. it reports the sequence, its files, and the line of each.
 *
 * 🟡 a hit is a CANDIDATE, never a verdict, and the test is the same one its peer
 *    carries — `rule.require.a-cue-is-not-a-claim`:
 *      COULD THESE TWO PASSAGES DISAGREE WITH EACH OTHER?
 *        yes → the list has an owner. cite it, do not copy it
 *        no  → each is an independent derivation. keep both
 *
 * usage  = node src/domain.roles/telepath/skills/review.for/review.for.declare-once.enumerations.js [--min=3] [--all]
 * writes = never
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

// eslint-disable-next-line -- `encoding` is the node fs api key, not our word
const UTF8 = { encoding: 'utf8' };

const args = process.argv.slice(2);
const rootFlag = args.find((a) => a.startsWith('--root='));
const ROOT = rootFlag ? rootFlag.slice(7) : 'src/domain.roles';
const minFlag = args.find((a) => a.startsWith('--min='));
const MIN_MEMBERS = minFlag ? Number(minFlag.slice(6)) : 3;

const loaded = (f) =>
  f.endsWith('.md.min') || (f.endsWith('.md') && !fs.existsSync(`${f}.min`));

// the VERBATIM set, and the SYMLINK dedup — both stated at length in
// `review.for.declare-once.claims.js`. a symlinked brief is one file at two paths, so
// a path set is not a file set until it is resolved
const VERBATIM = /(^|\/)(\.seeds\/|\.demo=|0\.wish\.md$)/;

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (loaded(p)) out.push(p);
  }
  return out;
};

const inDiff = (() => {
  if (args.includes('--all')) return () => true;
  const lines = execFileSync('git', ['status', '--porcelain'], UTF8)
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(3).trim());
  const files = new Set(lines.filter((l) => !l.endsWith('/')));
  const dirs = lines.filter((l) => l.endsWith('/'));
  return (f) => files.has(f) || dirs.some((d) => f.startsWith(d));
})();

const seenReal = new Set();
const targets = walk(ROOT)
  .filter((f) => !VERBATIM.test(f))
  .filter(inDiff)
  .filter((f) => {
    const real = fs.realpathSync(f);
    if (seenReal.has(real)) return false;
    seenReal.add(real);
    return true;
  })
  .sort();

// a MEMBER LIST — 3+ items joined by commas, optionally closed by `or`/`and`.
// each member is 1–3 plain words, so a clause never enters: the moment an item
// carries a verb or a mark it stops to be a member and becomes an argument.
const LIST =
  /\b([a-z][a-z-]*(?: [a-z][a-z-]*){0,2}(?:, [a-z][a-z-]*(?: [a-z][a-z-]*){0,2}){1,}),? (?:or|and) ([a-z][a-z-]*(?: [a-z][a-z-]*){0,2})\b/g;

const seen = new Map(); // normalized list -> [{file, at}]

for (const file of targets) {
  const lines = fs.readFileSync(file, UTF8).split('\n');
  let fenced = false;
  lines.forEach((rawLine, i) => {
    if (/^\s*```/.test(rawLine)) fenced = !fenced;
    if (fenced) return;

    // strip marks and backtick spans — a list is the same list in bold or not,
    // and a backticked member is a cited token rather than a different word
    const line = rawLine.replace(/[*_]/g, '').replace(/`([^`]*)`/g, '$1');

    LIST.lastIndex = 0;
    let m;
    while ((m = LIST.exec(line))) {
      const members = [...m[1].split(', '), m[2]].map((s) => s.trim());
      if (members.length < MIN_MEMBERS) continue;
      // sort, so a copy that reorders is still one list
      const key = [...members].sort().join(' · ');
      if (!seen.has(key)) seen.set(key, []);
      seen.get(key).push({ file: file.replace(`${ROOT}/`, ''), at: i + 1 });
    }
  });
}

const dupes = [...seen.entries()]
  .map(([list, hits]) => ({
    list,
    hits,
    files: [...new Set(hits.map((h) => h.file))],
  }))
  .filter((d) => d.files.length >= 2)
  .sort((a, b) => b.files.length - a.files.length);

for (const d of dupes) {
  console.log(`${d.files.length} files · ${d.list.split(' · ').length} members`);
  console.log(`   ${d.list}`);
  for (const h of d.hits) console.log(`     ${h.file}:${h.at}`);
  console.log('');
}

// 🟡 a silent instrument is indistinguishable from a scan of ZERO files. every
//    run states its denominator
console.log(
  `${dupes.length} enumeration(s) restated in 2+ files, across ${targets.length} loaded file(s) (min ${MIN_MEMBERS} members)`,
);
