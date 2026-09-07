#!/usr/bin/env node
/**
 * .what = finds each 🔴 / ✅ that RANKS a line, and stays silent on each one that
 *         CLASSIFIES it.
 *
 * .why  = the wisher named these two glyphs outright, so the target is zero RANK
 *         uses. it is NOT zero uses: `rule.forbid.emphasis-noise` exempts four
 *         classes by name, and a sweep that cut them would break the rule's own
 *         demos and every verdict column in the repo.
 *
 *         ⇒ so the tool asks the rule's own question rather than a character
 *           match: **does this mark RANK a line against its neighbours, or
 *           CLASSIFY it?**
 *
 * 🟡 it reports and never repairs, for the reason its four peers do: a sweep
 *    cannot part a CITATION of a token from an INSTANCE of one, and this file's
 *    whole subject is that distinction.
 *
 * usage  = node src/domain.roles/telepath/skills/review.for/review.for.emphasis-noise.glyphs.js [pathFragment] [--root=DIR] [--all]
 * writes = never
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const rootFlag = args.find((a) => a.startsWith('--root='));
const ROOT = rootFlag ? rootFlag.slice(7) : '.';
const only = args.filter((a) => !a.startsWith('--'))[0] ?? '';

const GLYPH = /🔴|✅/;

// the peer guards, stated once each — see `review.for.emphasis-noise.spans.js` for the runs
// that bought them.
//
// 🔴 this tool's VERBATIM set carries two members its peers do not, and both are
//    the same class: **an artifact whose declared SUBJECT is the glyph.**
//
//    `rule.forbid.emphasis-noise` and `term=prose.emphasis` cannot state their own
//    exempt set without a specimen of each glyph in it. so every hit in them is a
//    mention by construction, and the alternative — a determiner window widened
//    until it matches `a state in structured output — ✅ pass` — buys two true
//    negatives at the cost of a window loose enough to swallow real rank uses
//    elsewhere.
//
// ⇒ a specimen is settled by WHAT THE FILE IS, never by a regex over its prose.
//   that is the same reason `.demo=` sits in this set.
const VERBATIM =
  /(^|\/)(\.seeds\/|\.demo=|0\.wish\.md$|rule\.forbid\.emphasis-noise|term=prose\.emphasis)/;

// 🟡 `.agent/.notes/` is EXCLUDED, and the reason is scope rather than mercy: it
//    is a scratch dir. not one file under it boots, ships, or is cited by a brief
//    — it holds this tool and its own handoffs. to grade it is to grade the ruler.
const SKIP = /(^|\/)(node_modules|dist|\.git|\.log)(\/|$)|(^|\/)\.agent\/\.notes\//;

const inDiff = (() => {
  if (args.includes('--all')) return () => true;
  const lines = execFileSync('git', ['status', '--porcelain'], {
    encoding: 'utf8',
  })
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(3).trim());
  const files = new Set(lines.filter((l) => !l.endsWith('/')));
  const dirs = lines.filter((l) => l.endsWith('/'));
  return (f) => files.has(f) || dirs.some((d) => f.startsWith(d));
})();

const walk = (dir, out) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (SKIP.test(p)) continue;
    if (e.isDirectory()) walk(p, out);
    else if (p.endsWith('.md') || p.endsWith('.min')) out.push(p);
  }
  return out;
};

// 🔴 the EXEMPT classes, each declared by `rule.forbid.emphasis-noise`.
//
// 🟡 they are what makes this a classifier rather than a grep. a plain character
//    match reported 128 hits across 38 files; every one checked by hand was a
//    mention or a state value, and to cut them would have broken the rule's own
//    demo of itself.
//
// 🟡 the set grew from four to six across two runs, and each addition was bought
//    by a false positive rather than predicted. the two late ones generalize the
//    two that shipped: a MENTION is signalled by a determiner as often as by a
//    backtick, and a STATE VALUE sits wherever its cell puts it, never only at
//    the cell's lead.
const exempt = (line, glyph) => {
  // 1. a MENTION — the glyph named as the subject of a sentence. two signals:
  //
  //    a. a quote or a backtick immediately before it, and
  //    b. 🟡 a DETERMINER before it — `a ✅ written because every doc carries one`,
  //       `a state glyph ✅ 💥 🌙`, `why so many 🔴`. an article makes the glyph a
  //       noun, and a noun cannot rank the line it sits in.
  //
  //    `rule.forbid.emphasis-noise` cannot be written without either form.
  if (new RegExp('[`\u201c"\u2018\']\\s*' + glyph).test(line)) return 'mention';
  //
  //    🟡 the window spans FOUR words, not two, and the widen was bought by the
  //    rule's own enumeration of its exempt set — `a state in structured output
  //    — ✅ pass, 💥 fail` puts four words plus a dash between the determiner and
  //    the glyph. a narrow window reads the rule as a violation of itself, which
  //    is the one verdict a classifier must never render.
  if (
    new RegExp('\\b(?:a|an|the|each|every|many|no)\\s+(?:[\\w`*—-]+\\s+){0,4}' + glyph).test(line)
  )
    return 'mention';

  // 2. a STATE VALUE — the glyph names what the row IS rather than how it ranks.
  //
  //    🟡 it is NOT bound to the cell's lead. `| **blocks** ✅ |` and
  //    `| … drops the point ✅ |` are the same claim as `| ✅ |`, and a
  //    lead-anchored check reads both as rank.
  //
  //    ⇒ so the test is the SEPARATOR, never the position: a glyph whose
  //      neighbours are a cell wall, a `·`, or a peer grade is a value in a set.
  if (/^\s*\|/.test(line)) {
    const cells = line.split('|').slice(1, -1);
    if (cells.some((c) => new RegExp('^\\s*' + glyph + '|' + glyph + '\\s*$').test(c.trim())))
      return 'state value';
  }
  // the same set, rendered inline — `F01 ✅ · F06 🔴 reversed` and `fast ✅ loud ✅`.
  if (new RegExp('\\w\\s*' + glyph + '\\s*(?:·|\\w)').test(line)) return 'state value';

  // 3. a MEASUREMENT or a DEMO of the defect — a line ABOUT glyph density
  //    exhibits the disease rather than carries it.
  if (/carry 🔴|marks per line|rank glyph|emphasis noise/.test(line))
    return 'demo';

  // 4. a LEAD mark — at a line's LEAD a glyph labels that line's KIND, which is
  //    structure. the rule's `position settles which` section declares it.
  //
  //    🟡 a HEADER lead is the same claim and the `^\s*` anchor misses it, since
  //    `#### ` precedes the glyph. a header names its section's kind by
  //    definition, so it is the strongest instance of this class rather than an
  //    edge of it.
  if (new RegExp('^\\s*(?:(?:[-*]|\\d+\\.|#{1,6})\\s+)?' + glyph).test(line))
    return 'lead';

  // 5. a QUOTE — a blockquote line is someone else's prose, and a sweep cannot
  //    part their emphasis from mine. it covers the wisher's verbatim directive
  //    AND the 👎 specimen inside a demo block, whose whole job is to carry the
  //    defect (`rule.always.archive-the-wishers-words-verbatim`).
  if (/^\s*>/.test(line)) return 'quote';

  return null;
};

const targets = walk(ROOT, [])
  .filter((f) => f.includes(only))
  .filter((f) => !VERBATIM.test(f))
  .filter(inDiff)
  .sort();

let ranks = 0;
const tally = {};

for (const file of targets) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const hits = [];
  let fenced = false;

  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) fenced = !fenced;
    if (fenced || !GLYPH.test(line)) return;
    for (const g of ['🔴', '✅']) {
      if (!line.includes(g)) continue;
      const why = exempt(line, g);
      if (why) {
        tally[why] = (tally[why] || 0) + (line.split(g).length - 1);
        continue;
      }
      hits.push({ i: i + 1, g, line });
    }
  });

  if (!hits.length) continue;
  console.log(file);
  for (const h of hits) {
    console.log(`  ${String(h.i).padStart(4)} [${h.g}] ${h.line.trim().slice(0, 104)}`);
    ranks += 1;
  }
  console.log('');
}

console.log(
  `${ranks} RANK use(s) across ${targets.length} files · exempt: ${JSON.stringify(tally)}`,
);
