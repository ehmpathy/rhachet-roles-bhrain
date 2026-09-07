#!/usr/bin/env node
/**
 * .what = counts CLAIMS PER PROSE PARAGRAPH, and reports each paragraph over the bar.
 *
 * .why  = this is `rule.require.bulletize`'s own blocker line — *"a paragraph of
 *         three or more claims where an outline would carry them"* — and it was
 *         the one bar in the canon that no tool measured.
 *
 *         its peers grade a different grain and every one reads clean while this
 *         bar is breached:
 *
 *           `review.for.emphasis-noise.density.js` → emphasized LINES per section
 *           `review.for.emphasis-noise.spans.js`       → a STACK on one line
 *           `review.for.diffusion.flat.js`        → a section with no needle
 *
 *         ⇒ a section of one 60-word paragraph carrying four chained claims passes
 *           all three, and is the exact defect this rule names: the tree was
 *           serialized, and the reader must rebuild every edge from a connective.
 *
 * 🟡 it reports and never repairs. WHICH claims nest under which is the argument
 *    itself, and a tool that guessed would author a tree rather than render one.
 *
 * usage  = node src/domain.roles/telepath/skills/review.for/review.for.narration.paragraphs.js [pathFragment] [--root=DIR] [--bar=N] [--all]
 * writes = never
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const rootFlag = args.find((a) => a.startsWith('--root='));
const barFlag = args.find((a) => a.startsWith('--bar='));
const ROOT = rootFlag ? rootFlag.slice(7) : '.';
// the BAR is the rule's own number: *"a paragraph of three or more claims"*. it
// is not a tunable default dressed as one — a `--bar` override exists to widen a
// sweep, never to lower the grade.
const BAR = barFlag ? Number(barFlag.slice(6)) : 3;
const only = args.filter((a) => !a.startsWith('--'))[0] ?? '';

// 🔴 a WORD FLOOR, because the rule's bar is conditional and this tool read only
//    half of it: *"a paragraph of three or more claims **where an outline would
//    carry them**."*
//
//    a four-word line clears the claim half and fails the condition. this canon's
//    dream template closes every deferral with one:
//
//      safe? yes. clean? no.
//
//    three terminators, four words — and its bulletized form is LONGER than the
//    line, so the repair the tool would demand makes the artifact worse.
//
// 🟡 measured 2026-09-07: 6 of one run's 30 hits were that one template line,
//    reported once per dream. a sweep driven off that number would have expanded
//    a deliberate two-beat verdict into a six-line outline, six times.
//
// ⇒ 12 is the floor because a 3-claim tree needs a parent and two children, and
//   three bullets under four words each is the shortest tree that can exist.
const WORD_FLOOR = 12;

// 🟡 the VERBATIM set is the rule's own boundary table, encoded — a `.seeds/`
//    entry holds a `.said` that must never be reformatted, a `.demo=` artifact's
//    declared subject IS the sequence, and the wish is the wisher's own prose.
const VERBATIM = /(^|\/)(\.seeds\/|\.demo=|0\.wish\.md$)/;
const SKIP = /(^|\/)(node_modules|dist|\.git|\.log)(\/|$)|(^|\/)\.agent\/\.notes\//;
const UTF8 = { encoding: 'utf8' };

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

// the LOADED predicate, ported from `review.for.emphasis-noise.density.js` rather than
// re-derived — a `.md` with a `.md.min` beside it is ref tier, so the min is the
// artifact a session pays for.
const loaded = (file) =>
  file.endsWith('.md.min') || (file.endsWith('.md') && !fs.existsSync(`${file}.min`));

const walk = (dir, out) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (SKIP.test(p)) continue;
    if (e.isDirectory()) walk(p, out);
    else if ((p.endsWith('.md') || p.endsWith('.min')) && loaded(p)) out.push(p);
  }
  return out;
};

// ════════════════════════════════════════════════════════════════════════════
// WHAT IS NOT A PROSE PARAGRAPH — every line below is already structured, so the
// rule has no claim to make against it.
//
//   a header · a table row · a fenced block · a list item · a blockquote
//
// 🟡 the BLOCKQUOTE row is the one that could hide a violation, and it is exempt
//    on the rule's own boundary: a `>` block in this canon is an epigraph or a
//    👎/👍 demo, and a demo's marked prose is its declared subject. to grade one
//    would grade the specimen rather than the author.
// ════════════════════════════════════════════════════════════════════════════
const STRUCTURED = /^\s*(?:#{1,6}\s|>|\||[-*+]\s|\d+\.\s|```|:?-{3,}:?\s*\|)/;

// 🔴 an ENFORCEMENT ROW is a labelled row, never a prose paragraph — and it was
//    the whole of this tool's first false-positive run.
//
//    every rule in this canon closes with the same three-row block:
//
//      blocker: … · … · …
//      nitpick: …
//      false positive: … · …
//
//    three consecutive lines, each opened by a label and each `·`-joined. that is
//    an outline in inline form — the label is the column-0 slot and the `·` is the
//    item separator — so the structure is already on the page.
//
// 🟡 measured 2026-09-07: 12 of the first run's 31 hits were this one block,
//    reported once per rule under the header `## .the axis`. a repair driven off
//    that number would have bulletized a convention that is already itemized.
//
// ⇒ `⇒ see also:` takes the same form and is exempt on the same ground.
const LABELLED_ROW = /^\s*(?:⇒\s*)?(?:blocker|nitpick|false positive|see also)\s*:/i;

// 🔴 a NARRATIVE SECTION is exempt by the rule's own boundary — *"a narrative in a
//    `.demo=` artifact: its declared subject IS the sequence"*.
//
//    the VERBATIM regex above catches the `.demo=` filename form and misses the
//    one this repo actually writes: a `## .the narrative` block inside a
//    `1.vision.experience.case=N.*` file, which `rule.require.experience-coverage`
//    REQUIRES ("narrative + bdd `[tn]`").
//
// 🟡 the guard reads the HEADER, never the filename, and that is the sharper cut:
//    a `case=N` file's other sections carry ordinary claims and stay graded. only
//    the block whose declared subject is a sequence is exempt.
//
// 🟡 a VERBATIM section is exempt on the same ground and by a second boundary row —
//    *"a verbatim quote: never reformat one"*. the path regex catches `.seeds/` and
//    misses a `## .the wisher's words, verbatim` block quoted inside a `case=N`.
//
// ⇒ measured 2026-09-07: the un-guarded run reported 101 hits under `.behavior/`,
//   and the blocks it counted are prose the template asked for or a quote nobody
//   may touch. a repair driven off that number would have rewritten both.
const EXEMPT_SECTION = /\b(?:narrative|verbatim|said)\b/i;

// 🔴 a PRESERVED-ORIGINAL BLOCK is the third form of the same exemption, and it is
//    the one neither the path regex nor the header regex reaches.
//
//    a fulcrum entry that was REVERSED keeps its original body below a marker line —
//    *"the original entry follows, unedited, so the reversal is auditable"* — and the
//    headers inside that block are ordinary `## .confidence` headers, so a
//    header-keyed guard resets on the first one and grades the preserved text.
//
// 🟡 the block's whole contract is the word UNEDITED. to bulletize it is to void the
//    claim it exists to make, which is `rule.require.bulletize`'s verbatim row read at
//    the block grain rather than the quote grain.
//
// ⇒ the marker opens the block and no marker closes it: everything to EOF is
//   preserved, because a reversal record is always the tail of its file.
const PRESERVED_FROM = /^\s*_?the original entry follows, unedited/i;

// 🟡 a CODE SPAN is stripped before the count, and it is the single largest
//    source of a false claim. this canon's every filename is dotted —
//    `rule.require.bulletize.md` reads as four sentence terminators to a naive
//    split, so one cited path inflates a two-claim paragraph to six.
//
// ⇒ a LINK's target is stripped for the same reason, and an ELLIPSIS is collapsed
//   because it terminates no claim.
const rendered = (text) =>
  text
    .replace(/`[^`]*`/g, '⟦code⟧')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\.{2,}|…/g, '⟦ellipsis⟧');

// 🟡 an ABBREVIATION terminates no claim, and the set is narrow on purpose — a
//    wide one would swallow a real terminator. these are the four this canon
//    actually uses.
const ABBREV = /\b(?:e\.g|i\.e|vs|etc|no)\.$/i;

// a CLAIM ends at `.` `?` or `!` followed by a space or the paragraph's end.
//
// 🟡 a DECIMAL is not a terminator — the digit after it fails the whitespace
//    lookahead already. what that lookahead does NOT exclude is an ordinal or a
//    version at a line's end, which is why ABBREV runs beside it.
const countClaims = (text) => {
  const parts = rendered(text).split(/([.?!])(?=\s|$)/);
  let n = 0;
  for (let i = 1; i < parts.length; i += 2) {
    const before = (parts[i - 1] ?? '').trimEnd() + parts[i];
    if (ABBREV.test(before)) continue;
    // a terminator with no word before it is a split artifact, never a claim.
    if (!/\w/.test(parts[i - 1] ?? '')) continue;
    n += 1;
  }
  // a paragraph that ends with no terminator still made its claim — the canon's
  // house style drops a trailing period on a short line.
  const tail = parts[parts.length - 1] ?? '';
  if (/\w/.test(tail) && n === 0) n = 1;
  return n;
};

const targets = walk(ROOT, [])
  .filter((f) => f.includes(only))
  .filter((f) => !VERBATIM.test(f))
  .filter(inDiff)
  // a BROKEN SYMLINK reaches here and `readFileSync` throws — ported from
  // `review.for.emphasis-noise.density.js`, where the crash left a partial audit that
  // read as a complete one (`rule.forbid.failhide`).
  .filter((f) => fs.existsSync(f))
  .sort();

const rows = [];

for (const file of targets) {
  const lines = fs.readFileSync(file, UTF8).split('\n');
  let sec = '(preamble)';
  let fenced = false;
  let preserved = false;
  let para = [];
  let at = 0;

  const flush = () => {
    if (para.length && !preserved && !EXEMPT_SECTION.test(sec)) {
      const text = para.join(' ');
      const n = countClaims(text);
      const words = text.split(/\s+/).length;
      if (n >= BAR && words >= WORD_FLOOR) rows.push({ file, sec, at, n, words });
    }
    para = [];
  };

  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) {
      flush();
      fenced = !fenced;
      return;
    }
    if (fenced) return;
    if (PRESERVED_FROM.test(line)) {
      flush();
      preserved = true;
      return;
    }
    if (/^#{1,6}\s/.test(line)) {
      flush();
      sec = line.trim().slice(0, 56);
      return;
    }
    if (!line.trim()) return flush();
    if (STRUCTURED.test(line)) return flush();
    if (LABELLED_ROW.test(line)) return flush();
    if (!para.length) at = i + 1;
    para.push(line.trim());
  });
  flush();
}

// 🔴 the SILENT TRUNCATION — the same defect `review.for.emphasis-noise.density.js`
//    carried, and the banner there argues it in full. one line: a row set that ends
//    is read as a row set that finished, so a cap must say it capped.
//
// 🟡 `--limit=0` prints every row; the default stays finite so a human run is
//    legible.
const limitFlag = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitFlag ? Number(limitFlag.slice(8)) : 30;

rows.sort((a, b) => b.n - a.n);
const shown = LIMIT > 0 ? rows.slice(0, LIMIT) : rows;
for (const r of shown)
  console.log(
    `${String(r.n).padStart(3)} claims / ${String(r.words).padStart(3)}w  ${r.file}:${r.at}\n     ${r.sec}\n`,
  );

if (shown.length < rows.length)
  console.log(
    `🔴 TRUNCATED — ${shown.length} of ${rows.length} row(s) printed. pass --limit=0 for every row.\n`,
  );

// 🟡 a ROLLUP is printed beside the total, and the total alone was the reason.
//
//    a bare `141 paragraphs` invites a sweep of every file it counted — and the
//    141 span four areas whose obligations DIFFER: a say-tier brief is graded, a
//    `.reason.md` dispute record is a dated argument `rule.require.timeless-lessons`
//    protects, and a `case=N` file is a narrative the wisher's own template asked
//    for.
//
// ⇒ so the number is only actionable once it is sorted by area. one figure over
//   four contracts is a census claim about a set that was never one set.
const area = (f) =>
  f.startsWith('src/domain.roles/')
    ? `src/domain.roles/${f.split('/')[2]}`
    : f.startsWith('.agent/')
      ? '.agent/'
      : f.startsWith('.behavior/')
        ? '.behavior/'
        : f.startsWith('.dream/')
          ? '.dream/'
          : '(other)';

const byArea = new Map();
for (const r of rows) byArea.set(area(r.file), (byArea.get(area(r.file)) ?? 0) + 1);

console.log(
  `${rows.length} paragraph(s) at or over ${BAR} claims, across ${targets.length} files`,
);
for (const [a, n] of [...byArea.entries()].sort((x, y) => y[1] - x[1]))
  console.log(`   ${String(n).padStart(4)}  ${a}`);
