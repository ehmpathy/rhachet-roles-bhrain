#!/usr/bin/env node
/**
 * .what = finds a CLAIM stated in two or more loaded briefs — the same sentence,
 *         reduced to its comparable form, in more than one file.
 *
 * .why  = `declare-once` (#425) is the rule this route has hit twenty times, and
 *         every instance so far was caught by a reviewer or by hand. this runs it
 *         as a check.
 *
 *         it is aimed at the half the emphasis audits cannot see: the volume in
 *         the 25 files this route AUTHORED, where a claim restated in a peer is
 *         invisible to any single-file read.
 *
 * 🟡 a hit is a CANDIDATE, never a verdict, and the reason is a rule of this same
 *    canon. `rule.require.a-cue-is-not-a-claim` says outright that a CUE may
 *    repeat — *"a redundant cue carries no drift risk at all"* — and the wisher
 *    settled it: *"the more the better here. as many angles as it takes"*.
 *
 * ⇒ so the test on each hit is that rule's test, and it is mechanical:
 *     COULD THESE TWO PASSAGES DISAGREE WITH EACH OTHER?
 *       yes → claims. declare one, cite it from the other
 *       no  → cues. keep both, and look for a third
 *
 * 🟡 the detector cannot make that call, so it reports and never repairs — the
 *    same standing its six peers hold.
 *
 * usage  = node src/domain.roles/telepath/skills/review.for/review.for.declare-once.claims.js [--min=12] [--all]
 * writes = never
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const UTF8 = { encoding: 'utf8' }; // node's own api key; the -ing is theirs

const args = process.argv.slice(2);
const rootFlag = args.find((a) => a.startsWith('--root='));
const ROOT = rootFlag ? rootFlag.slice(7) : 'src/domain.roles';
const minFlag = args.find((a) => a.startsWith('--min='));
const MIN_WORDS = minFlag ? Number(minFlag.slice(6)) : 12;

const loaded = (f) =>
  f.endsWith('.md.min') || (f.endsWith('.md') && !fs.existsSync(`${f}.min`));

const walk = (dir, out = []) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (loaded(p)) out.push(p);
  }
  return out;
};

// the VERBATIM set — the peer guard every tool here carries. a seed's `.said` is
// the wisher's words, and a `.demo=` artifact's declared subject IS its prose.
// a quote repeated across two briefs is a CITATION of one source, never two
// copies of one claim.
const VERBATIM = /(^|\/)(\.seeds\/|\.demo=|0\.wish\.md$)/;

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

// 🔴 the SYMLINK case, and it is a false positive by construction.
//
// this repo DELIVERS a rule to a second role by symlink rather than by copy —
// `achiever/…/rule.always.fix-forward-under-scouts-honor.md.min` points at the
// driver's. one file, two paths, and every line in it then reports as a claim
// "stated in 2 files."
//
// 🟡 that is the exact shape a `declare-once` detector must NOT report, because
//    the delivery pattern is `declare-once` already SATISFIED: one declaration,
//    dereferenced twice. to flag it asks the reader to break the reference.
//
// ⇒ found 2026-09-07, the fourth instrument defect on this route and the same
//   class as the `dist/` double-count excluded from `F13`'s board the same day:
//   a path set is not a FILE set until it is resolved.
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

// reduce a line to its CLAIM: strip every mark, every backtick delimiter, every
// list prefix, and case. two lines that differ only in emphasis are one claim
// stated twice, so the comparable form must not carry emphasis.
const asComparable = (line) =>
  line
    .replace(/^\s*(?:[-*>]|\d+\.)\s*/, '')
    .replace(/^\s*\|/, '')
    .replace(/\|/g, ' ')
    .replace(/[*_`]/g, '')
    .replace(/[🟡🔴✅⇒👎👍·—–]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const seen = new Map(); // claim -> [{file, at}]

// 🟡 a WHEN-ROW is a CUE by construction, and `rule.require.a-cue-is-not-a-claim`
//    exempts it in as many words: *"two when-rows that detect one defect from two
//    angles"* is listed under NOT a violation.
//
// ⇒ measured 2026-09-05: a clamp pair — `forbid.surface-speak` and its act
//   `require.fundamentalism` — shares two when-rows. the wisher settled that
//   shape outright: *"the more the better here. as many angles as it takes"*.
//
// the guard is the TABLE, never the row: a row is exempt only inside a table
// whose header asks `when…`. a row in a contrast table still carries a claim.
const whenRows = (lines) => {
  const exempt = new Set();
  let inWhen = false;
  lines.forEach((line, i) => {
    if (/^\s*\|\s*when/i.test(line)) inWhen = true;
    else if (!/^\s*\|/.test(line)) inWhen = false;
    if (inWhen) exempt.add(i);
  });
  return exempt;
};

// 🟡 an ATTRIBUTED QUOTE is a CITATION, not a second declaration. a readme that
//    states its role's root purpose and names the file that declares it has done
//    exactly what `declare-once` asks — the amendment has a visible pointer.
//
// ⇒ the test is the NEXT line: a quote whose successor names its source is
//   attributed. a bare repetition has no such line, and still reports.
const ATTRIBUTED = /^\s*>?\s*—\s*(quoted from|per|see|source:)/i;

for (const file of targets) {
  const lines = fs.readFileSync(file, UTF8).split('\n');
  const cues = whenRows(lines);
  lines.forEach((line, i) => {
    const claim = asComparable(line);
    if (claim.split(' ').filter(Boolean).length < MIN_WORDS) return;
    // a table DIVIDER and a fence carry no claim
    if (/^[-:\s]+$/.test(claim)) return;
    if (cues.has(i)) return;
    if (ATTRIBUTED.test(lines[i + 1] ?? '')) return;
    if (!seen.has(claim)) seen.set(claim, []);
    seen.get(claim).push({ file: file.replace(`${ROOT}/`, ''), at: i + 1 });
  });
}

const dupes = [...seen.entries()]
  .map(([claim, hits]) => ({
    claim,
    hits,
    files: [...new Set(hits.map((h) => h.file))],
  }))
  // a claim repeated INSIDE one file is a different defect and a weaker one —
  // a reader holds one file in view. the cross-FILE case is the one that drifts
  // silently, because no reader ever sees both copies at once.
  .filter((d) => d.files.length >= 2)
  .sort((a, b) => b.files.length - a.files.length || b.claim.length - a.claim.length);

for (const d of dupes) {
  console.log(`${d.files.length} files · ${d.claim.split(' ').length} words`);
  console.log(`   "${d.claim.slice(0, 150)}${d.claim.length > 150 ? '…' : ''}"`);
  for (const h of d.hits) console.log(`     ${h.file}:${h.at}`);
  console.log('');
}

console.log(
  `${dupes.length} claim(s) stated in 2+ files, across ${targets.length} loaded file(s) (min ${MIN_WORDS} words)`,
);
