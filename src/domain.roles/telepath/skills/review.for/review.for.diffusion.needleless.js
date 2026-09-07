#!/usr/bin/env node
/**
 * .what = finds each `##` section that carries NO elevated line, so a reader has
 *         no candidate to point at as its purpose.
 *
 * .why  = `rule.forbid.diffusion` and `rule.forbid.emphasis-noise` are a POLE
 *         PAIR over one act. the emphasis sweep just cut ~950 rank glyphs from
 *         this diff, and every one of those cuts moves a passage toward the
 *         other pole:
 *
 *           BEFORE — every line elevated, so no line ranks (emphasis-noise)
 *           AFTER  — no line elevated, so the needle is buried (diffusion)
 *
 *         so this is the sweep's own audit, aimed at the defect the sweep can
 *         cause. it is the reason the two rules do not merge.
 *
 * 🟡 a needle is not always a mark. a section can carry its purpose in a lead
 *    sentence with no glyph at all, and that is correct prose. so a hit here is
 *    a CANDIDATE for a read, never a verdict — the tool reports and never
 *    repairs, for the same reason its four peers do.
 *
 * usage  = node src/domain.roles/telepath/skills/review.for/review.for.diffusion.needleless.js [pathFragment] [--root=DIR] [--all]
 * writes = never
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const rootFlag = args.find((a) => a.startsWith('--root='));
const ROOT = rootFlag ? rootFlag.slice(7) : 'src/domain.roles';
const only = args.filter((a) => !a.startsWith('--'))[0] ?? '';

// the same LOADED rule the peer tools carry, and for the same measured reason:
// a `.md.min` replaces its `.md` only where a min EXISTS. a brief with none —
// every `define.*`, `howto.*`, `howdoes.*`, each readme, and every route
// artifact — is loaded as its `.md`. see `review.for.emphasis-noise.spans.js` for the run
// that found 30 files skipped by the narrower rule.
const loaded = (file) =>
  file.endsWith('.md.min') ||
  (file.endsWith('.md') && !fs.existsSync(`${file}.min`));

const MIN_LINES = 3; // a one- or two-line section has no room to diffuse

const walk = (dir, out) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (loaded(p)) out.push(p);
  }
  return out;
};

// the scope guard every tool here carries, ON BY DEFAULT. a report that ranges
// past the diff sends a reader to repair files that are not theirs.
//
// 🟡 an entry that ends in a slash is a PREFIX, never a path — `git status`
//    collapses an untracked tree to one such entry. see the peer note in
//    `review.for.emphasis-noise.spans.js` for the run that measured the fail-open.
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

// what counts as an ELEVATED line — a mark that ranks one line, or a shape that
// structures it above its neighbours. a table and a subheader each carry a
// gradient, so a section that holds either has a shape a reader can navigate.
//
// 🟡 the BULLETED forms are not cosmetic, and each was bought by a false
//    positive. across three runs the tool flagged nine sections that each had a
//    needle all along — a list whose item leads with a mark, a bold, or the term
//    under discussion. that lead IS the gradient.
//
// ⇒ the class generalizes past the three: **a list prefix does not demote what
//    follows it.** an elevated line is elevated bulleted or bare, so every form
//    below admits the optional prefix rather than a fourth patch per shape.
//
// 🟡 and the prefix set is `-` · `*` · `1.` — an ORDINAL is a bullet too. that
//    one arrived last, from a numbered fix list whose every step led with a
//    bold. the generalization above had already predicted it; only the
//    character class was too narrow.
// 🔴 the BOLD row takes NO position guard, and that is the round-16 repair.
//
//    it read `${BULLET}\*\*` — a bold at the LEAD — and that is a fourth
//    smuggled position law, beside POSITION and EXTENT. the rule it encodes
//    asks one question and asks it of the whole line:
//
//      *"can a reader point at the line that carries its purpose?"*
//
//    a bold mid-line is pointable, so the lead guard graded a real needle a
//    defect. measured 2026-09-05: it flagged four `.what` sections whose
//    definition was bolded one clause in — `\`diffusion\` is **a passage …**`,
//    the house form this canon settled the same round.
//
// 🟡 the widen cannot open a loophole, because the OTHER pole owns the excess:
//    a section where every line carries a mid-line bold passes here and fails
//    `review.for.emphasis-noise.density.js`. that is what a pole pair is for.
const BULLET = String.raw`^\s*(?:(?:[-*]|\d+\.)\s+)?`;
const elevated = (line) =>
  new RegExp(`${BULLET}(🟡|🔴|⇒|>)`).test(line) || //   a lead mark
  /\*\*[^*]+\*\*/.test(line) || //          a bold ANYWHERE — see the block above
  new RegExp(`${BULLET}\`[^\`]+\`\\s*[—-]`).test(line) || // a lead term, then a dash
  /^\s*#{3,}\s/.test(line) || //            a subheader
  /^\s*\|/.test(line) || //                 a table
  /^\s*```/.test(line); //                  a fence

// 🟡 an INDEX section is flat BY CONTRACT, never by defect. a `.refs` list is
//    one row per member with no narrative about any one of them, which is what
//    `rule.require.catalog-is-an-index` demands of it — and `forbid.diffusion`
//    exempts outright as "a genuinely flat set on one axis". so a needle is not
//    owed here, and to report one buries the sections where it IS owed.
//
// 🟡 `.landed` and `.settled` join it for the SAME reason at a different scope.
//    a seed's `.landed` is one path per row — `rule.always.archive-the-wishers-
//    words-verbatim` grades a row that carries a REASON a blocker, so the
//    section is an index by construction and a needle in it would be the defect.
//
// 🟡 `.where` is the one that reads like prose and is not. in a fulcrum entry it
//    is one PATH per row — where the call appears — so it is a citation list
//    under a locative name, and a needle in it would be the defect.
//
// 🟡 `.enforcement` joins them, and it is the one this canon writes most. its
//    booted form is `blocker: $shape · $shape · $shape.` — one graded shape per
//    row, no narrative about any one, which is `rule.require.catalog-is-an-index`
//    at the grain of a rule. the `blocker:` lead IS the label the whole clause
//    hangs from, so an emphasis inside it would rank one graded shape over its
//    peers — and they are peers by construction.
const INDEX =
  /^##\s+\.(refs?|reasons?|landed|settled|where|see also|evidence|invariants|disputes|enforcement|sources?|citations?)\b/;

// 🔴 the VERBATIM set — the peer guard the strip tool carries, and it binds a
// REPORT as hard as it binds a sweep.
//
// a seed's `.said` is the wisher's words, and `0.wish.md` is the wisher's whole
// artifact. neither is mine to elevate a line in, so to flag one sends a reader
// to repair prose they must not touch.
const VERBATIM = /(^|\/)(\.seeds\/|\.demo=|0\.wish\.md$)/;

const targets = walk(ROOT, [])
  .filter((f) => f.includes(only))
  .filter((f) => !VERBATIM.test(f))
  .filter(inDiff)
  .sort();

let hits = 0;

for (const file of targets) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');

  // cut the file into `##` sections, each with the line it starts on
  const sections = [];
  let current = null;
  lines.forEach((line, i) => {
    if (/^##\s/.test(line)) {
      if (current) sections.push(current);
      current = { head: line.trim(), at: i + 1, body: [] };
      return;
    }
    if (current) current.body.push(line);
  });
  if (current) sections.push(current);

  const bare = sections.filter((s) => {
    if (INDEX.test(s.head)) return false;
    const prose = s.body.filter((l) => l.trim().length);
    return prose.length >= MIN_LINES && !prose.some(elevated);
  });

  if (!bare.length) continue;
  console.log(file.replace(`${ROOT}/`, ''));
  for (const s of bare) {
    const prose = s.body.filter((l) => l.trim().length);
    console.log(`  ${String(s.at).padStart(4)} ${s.head}  — ${prose.length} prose lines, none elevated`);
    hits += 1;
  }
  console.log('');
}

console.log(`${hits} candidate section(s) across ${targets.length} file(s)`);
