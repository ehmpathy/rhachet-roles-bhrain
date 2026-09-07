#!/usr/bin/env node
/**
 * .what = counts EMPHASIZED LINES PER SECTION, and reports each section over the bar.
 *
 * .why  = this is `rule.forbid.emphasis-noise`'s PRIMARY bar — *"one emphasized
 *         line per section, at most"* — and it was the one bar no tool measured.
 *
 *         its two peers grade a narrower target and both read clean while this
 *         one is breached:
 *
 *           `review.for.emphasis-noise.spans.js`   → a STACK on one line, a COLUMN in a table
 *           `review.for.emphasis-noise.glyphs.js`  → one glyph's use, classified
 *
 *         ⇒ a section of twelve lines that each carry ONE mark passes both, and
 *           is the exact defect the rule names: the reader can no longer rank.
 *
 * 🟡 it reports and never repairs. the repair is a judgment — WHICH line is the
 *    needle — and a tool that guessed would land on `forbid.diffusion`, the
 *    opposite pole.
 *
 * usage  = node src/domain.roles/telepath/skills/review.for/review.for.emphasis-noise.density.js [pathFragment] [--root=DIR] [--bar=N] [--all]
 * writes = never
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const rootFlag = args.find((a) => a.startsWith('--root='));
const barFlag = args.find((a) => a.startsWith('--bar='));
const ROOT = rootFlag ? rootFlag.slice(7) : '.';

// 🔴 the BAR DRIFT, and this tool shipped with it until 2026-09-07.
//
// the default was `2`, and the report reads "over BAR" — so it flagged 3+ and
// passed every section with exactly two. `rule.forbid.emphasis-noise` bars two
// outright: *"one emphasized line per section, at most"*, and its enforcement
// line grades *"a section with more than one emphasized line"* a blocker.
//
// 🟡 so the default sat ONE NOTCH looser than the law the banner above cites,
//    and it said so nowhere. measured the day it was found: the diff read
//    `0 sections` at the old default and `181` at the rule's own bar.
//
// ⇒ third face of the instrument dream on this route. the first was a wrong
//   verdict, the second a silent scope, and this one a loose bar — and a loose
//   bar is the hardest of the three to see, because the tool runs, scans the
//   right files, and returns a number that is correct for the law it encodes.
const BAR = barFlag ? Number(barFlag.slice(6)) : 1;
const only = args.filter((a) => !a.startsWith('--'))[0] ?? '';

// the peer guards, stated once each — see `review.for.emphasis-noise.spans.js` for the runs
// that bought them.
//
// 🔴 the SPECIMEN exemption does NOT carry over to this tool, and the seam is
//    exact. `review.for.emphasis-noise.glyphs.js` exempts `rule.forbid.emphasis-noise`
//    because that rule cannot state its own exempt set without a MENTION of each
//    glyph — the glyph is its subject.
//
//    this tool counts emphasized LINES, and a rule against over-emphasis has no
//    licence to over-emphasize. its subject buys it mentions; it buys it no
//    density.
//
// ⇒ the first draft copied the peer's set verbatim and it read as thorough. **an
//   exemption is scoped to the DEFECT it excuses, never to the file that earned
//   it.**
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

// 🔴 the LOADED predicate — a peer of this tool's three siblings, and it was
//    absent from the first draft.
//
// a `.md` with a `.md.min` beside it is REF tier: the min is what boots, so the
// `.md` is on-demand depth and its density costs no consumer. a `.md` with no min
// IS the booted form.
//
// 🟡 without it this tool graded `rule.forbid.narration.md` — free depth — beside
//    `define.bulletize.md`, which every session loads. **a density audit that
//    cannot tell what boots grades the wrong artifact set.**
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

// 🟡 a LEAD mark is stripped before the test, and a TABLE ROW is skipped whole.
//
// both are `position settles which`: at a line's lead a glyph labels that line's
// KIND, and a table's own shape is what ranks its cells. to count either would
// report every well-formed brief as a violation, which is a tool that grades
// structure rather than emphasis.
const LEAD = /^\s*(?:[-*]|\d+\.|>)?\s*(?:🟡|🔴|✅|⇒)?\s*/;
const MARK = /\*\*[^*]+\*\*|🟡|🔴|✅/;

// ════════════════════════════════════════════════════════════════════════════
// THE EXTENT LAW — declared ONCE here. every exemption below cites it by name.
//
//   a mark that spans its WHOLE container LABELS that container.
//   a mark that spans PART of one RANKS the rest of it.
//
// it is not this tool's coinage. it is a declared property of the term, and it
// boots — `term=prose.emphasis._.choice._.md` carries it in the say tier, and
// `rule.forbid.emphasis-noise` states it as one of the two properties that
// settle whether a mark ranks or classifies (the other is POSITION, round 8).
//
// 🟡 it reached SIX containers, and the first five were each re-derived alone
//    from their own false positive rather than read off the rule that said it:
//      1. a table cell        — a column guard
//      2. a table row         — a stack guard
//      3. a bare bullet       — PURE_LABEL, below
//      4. a bullet's label slot — BULLET_LABEL, below
//      5. a blockquote's lead label slot — LEAD_LABEL, below
//      6. a BLOCK — BLOCK_LABEL, below. the sixth was reached by the widen this
//         banner prescribes, never by a sixth derivation
//
// 🟡 container 6 is the one that shows the law's own absent word. a container
//    need not be the LINE, nor aught inside it: `**owed, and named here:**`
//    followed by a list labels the LIST, and the line holds no other content.
//    so EXTENT is measured against the container a mark heads, never against the
//    line a regex sees first — the same clause POSITION needs, and for the same
//    reason: a mark at a LEAD is read against what follows it, never against
//    what a line-oriented scan happens to bound.
//
// ⇒ that is `declare-once` (#425) broken inside an instrument rather than in a
//   summary: the law was stated in PROSE and encoded in FIVE narrow regexes, and
//   no one re-reads a regex against a rule. so each exemption below states only
//   its OWN container and its OWN guard, and cites this block for the law.
//
// ⇒ the next false positive is answered by a WIDENING here, never by a sixth
//   derivation there.
// ════════════════════════════════════════════════════════════════════════════

// container 3 · a BARE BULLET — `- **2 · find the property that DIFFERS**`.
// the whole content is one bold span, so it labels. cites THE EXTENT LAW above.
const PURE_LABEL = /^\s*(?:[-*]|\d+\.)\s+\*\*[^*]+\*\*\s*$/;

// container 5 · a LEAD LABEL SLOT — `> **actor:** can you make this shorter?`
// cites THE EXTENT LAW above. a blockquote speaker label makes a bullet label's
// claim from a bullet label's position, and it fired on every demo in the canon.
//
// 🟡 the two guards are what keep it from a loophole, and both are borrowed from
//    proven siblings rather than invented:
//      - a MANDATORY separator — `:` `—` `–` `=`, the set `BULLET_LABEL` already
//        carries. a bold with no separator after it is a sentence, not a slot
//      - a FOUR-WORD cap — the moment a bold wraps a clause it argues, and an
//        argument competes. `review.for.emphasis-noise.spans.js` bought this at two words
//        for a bare token; a speaker label wants a little more room
//
// ⇒ so `**both are owed on every passage.** the content drill alone …` still
//   reports: no separator, and it spans a clause.
//
// 🟡 the separator sits on EITHER side of the bold's close, and both forms are
//    live in this canon — `**actor:** …` carries it inside, `**stack** — …`
//    outside. a pattern that admits one reads the other as a violation.
const AT_LEAD = '^\\s*(?:[-*]|\\d+\\.|>)?\\s*';
const LEAD_LABEL = new RegExp(
  `(?:${AT_LEAD}\\*\\*[^*]{1,40}\\*\\*\\s*[—–:=])|(?:${AT_LEAD}\\*\\*[^*]{1,39}[:—–=]\\*\\*\\s+\\S)`,
);

// container 4 · a BULLET's LABEL SLOT — the table COLUMN case, as an outline.
// cites THE EXTENT LAW above.
//
// `- **one sentence per bullet** — a bullet that needs two held two concepts`
// is a two-column row: a label slot, a separator, a gloss. where TWO OR MORE
// siblings at one depth take that form, the bold marks the LABEL SLOT — the
// bullet-list's own column 0 — and no sibling outranks another.
//
// 🟡 the sibling count is the whole guard, and it is what keeps this from a
//    loophole. ONE bolded label among plain siblings is not a column; it is the
//    real defect, and it still reports. that is the same test
//    `review.for.emphasis-noise.spans.js` runs on a table, where a slot bolded on 1 of 4
//    rows ranks and a slot bolded on 4 of 4 classifies.
//
// 🟡 the separator set is `—` `–` `:` `=`, and `=` arrived late, from
//    `- **blocker** = must-fix / would-block`. all four carry one claim — *what
//    precedes me NAMES; what follows me EXPLAINS* — so a set that admits three of
//    them grades the punctuation rather than the form.
//
// 🔴 the TERMINAL separator is the round-17 widen, and it is the same defect the
//    LEAD_LABEL banner already names one nest up: *"the separator sits on EITHER
//    side of the bold's close."* it sits in a THIRD position too — inside the
//    bold, at its end — and that form was unreadable to the pattern:
//
//      `1. **F11 — rename `lane` to `reviewer`, or declare `lane`?** the newest …`
//
//    the `?` closes the label exactly as an outside `—` would. measured
//    2026-09-05: 5 of the 6 numbered items in one section took that form and
//    every one reported, so a real COLUMN read as six ranked lines.
//
// 🟡 it cannot open a loophole, and the guard is not new — `columnBullets` below
//    requires a run of TWO OR MORE peers at one indent. one bolded sentence among
//    plain peers is the real defect and still reports; two or more are a column by
//    the same test `review.for.emphasis-noise.spans.js` runs on a table row.
//
// 🟡 the residual, stated rather than hidden: this row carries NO length cap where
//    LEAD_LABEL caps at 40 chars. so a run of long bolded sentences reads as a
//    column here. that is correct by the rule — no peer outranks another — and it
//    is the pole where `review.for.diffusion.needleless.js` takes over.
const BULLET_LABEL =
  /^(\s*)(?:[-*]|\d+\.)\s+(?:\*\*[^*]+\*\*\s*[—–:=]|\*\*[^*]+[?.!:—–=]\*\*\s+\S)/;

// container 6 · a BLOCK — `**owed, and named here so the arrears is visible:**`
// on its own line, with a list or a table beneath it. cites THE EXTENT LAW above.
//
// the bold spans the WHOLE line and the line holds no other content, so it cannot
// rank the line against itself. what it heads is the BLOCK below, and a label on
// a whole block labels it — container 5's claim, one nest out.
//
// 🟡 two guards, and the second is what keeps it from a loophole:
//    - the bold spans the ENTIRE line, `:` included. a bold plus a trailing clause
//      is a sentence with a stress, and it still reports
//    - the NEXT non-blank line opens a block — `-` `*` `1.` `|` or a fence. with
//      prose beneath it, the bold heads a paragraph it is part of, so it ranks
//
// 🔴 a LEAD GLYPH is stripped before the span test — the round-18 widen, and the
//    banner above prescribed it: *"the next false positive is answered by a
//    WIDENING here, never by a sixth derivation there."*
//
//    containers 3, 4 and 5 each admit a lead glyph via `AT_LEAD`; container 6 was
//    the one that did not, so `🟡 **what remains, declared rather than
//    repaired:**` reported while the identical line without the `🟡` passed.
//
// 🟡 per POSITION, a glyph at a line's LEAD labels that line's KIND — it is not
//    part of the span, so it cannot shorten it. the bold still must reach the
//    line's end, which is the guard that keeps this from a loophole.
const BLOCK_LABEL = /^\s*(?:🟡|🔴|✅|⇒)?\s*\*\*[^*]+:?\*\*:?\s*$/;
const opensBlock = (lines, i) => {
  for (let j = i + 1; j < lines.length; j += 1) {
    const t = lines[j].trim();
    if (!t) continue;
    return /^(?:[-*]\s|\d+\.\s|\||```)/.test(t);
  }
  return false;
};

const columnBullets = (lines) => {
  const exempt = new Set();
  let run = [];
  let indent = null;
  const flush = () => {
    if (run.length >= 2) for (const i of run) exempt.add(i);
    run = [];
    indent = null;
  };
  lines.forEach((line, i) => {
    const m = BULLET_LABEL.exec(line);
    if (m) {
      if (indent !== null && m[1].length !== indent.length) flush();
      indent = m[1];
      run.push(i + 1);
      return;
    }
    // 🔴 a BLANK LINE does not break a peer run, and that it did was the
    //    round-18 over-report.
    //
    //    a list item may hold its OWN blocks — a table, a second paragraph, a
    //    nested list — and markdown delimits those with blank lines. so the
    //    blanks between such items are the LIST's structure, never a break in it.
    //
    //    measured 2026-09-06 on the yield's `.what must be validated with the
    //    wisher`: six numbered items, four adjacent and two that hold tables. the
    //    four formed a run and were exempt; the two were each a run of ONE and
    //    reported. **identical form, opposite verdicts, settled by whether the
    //    item happened to hold a table.**
    //
    // 🟡 it cannot open a loophole: a run still needs TWO OR MORE peers, so a lone
    //    bolded bullet among plain ones is the real defect and still reports.
    if (!line.trim()) return;
    // an INDENTED line is a child of the current item — its table, its gloss, its
    // nested list. only a peer paragraph at column 0 ends the list.
    if (/^\s/.test(line)) return;
    flush();
  });
  flush();
  return exempt;
};

const targets = walk(ROOT, [])
  .filter((f) => f.includes(only))
  .filter((f) => !VERBATIM.test(f))
  .filter(inDiff)
  // 🟡 a BROKEN SYMLINK reaches here — `readdirSync` lists it and `readFileSync`
  //    throws ENOENT. the rmsafe trash holds them by construction, since it moves
  //    a link without its target.
  //
  //    a broken link is a fact about the tree, never a density defect. and to let
  //    it throw is worse than a false positive: the walk dies part-way, so every
  //    file after it in sort order goes UNSCANNED and the run reports whatever it
  //    had counted so far — a partial audit that looks like a complete one
  //    (`rule.forbid.failhide`).
  .filter((f) => fs.existsSync(f))
  .sort();

const rows = [];

for (const file of targets) {
  const lines = fs.readFileSync(file, UTF8).split('\n');
  const inColumn = columnBullets(lines);
  let sec = '(preamble)';
  let marked = [];
  let fenced = false;
  const hits = [];

  const flush = () => {
    if (marked.length > BAR) hits.push({ n: marked.length, sec, at: marked });
    marked = [];
  };

  lines.forEach((line, i) => {
    if (/^\s*```/.test(line)) fenced = !fenced;
    if (fenced) return;
    // 🔴 an H1 flushes too, and its ABSENCE was the round-17 over-group.
    //
    //    this read `^#{2,6}` — every header EXCEPT the strongest one. so a file
    //    that parts its major blocks with `#` had every one of those blocks
    //    folded into whichever `##` last preceded them.
    //
    //    measured 2026-09-05 on `1.vision.experience.case=_.md`: a section
    //    reported at 13 emphasized lines spanned THREE logical sections, two
    //    `#` boundaries away from the header it was filed under. the count was
    //    real and the attribution was not, so the repair it invited was a sweep
    //    of prose that had never been graded.
    //
    // 🟡 it over-reports and never under-reports, which is why it survived six
    //    rounds: a merged section is always at least as dense as its parts, so
    //    the board never went falsely green. that is the quiet kind — a tool
    //    that is wrong in the safe direction is a tool nobody re-reads.
    if (/^#{1,6}\s/.test(line)) {
      flush();
      sec = line.trim().slice(0, 56);
      return;
    }
    // 🟡 a BLOCKQUOTED table is still a table — `> | **fresh** | … |`. the
    //    quote prefix is a nest, never a change of kind, and a check anchored on
    //    `^\s*|` reads a quoted table's every row as prose.
    if (/^\s*>?\s*\|/.test(line)) return;
    if (PURE_LABEL.test(line)) return;
    if (LEAD_LABEL.test(line)) return;
    if (BLOCK_LABEL.test(line) && opensBlock(lines, i)) return;
    if (inColumn.has(i + 1)) return;

    // 🔴 a BLOCKQUOTE line is a QUOTED container, and its marks rank inside that
    //    quote rather than across the document a reader scans.
    //
    // this canon puts a `>` block to exactly two uses, and each is legitimate:
    //   - the EPIGRAPH — one line at a rule's head, which IS that rule's needle
    //   - a 👎 / 👍 DEMO — a passage whose declared subject is the marked prose.
    //     to strip its marks would teach the defect as correct, and to count them
    //     would grade the specimen rather than the author
    //
    // 🟡 the loophole is real and it is worth a name: an author could sink a
    //    padded passage into a `>` block to dodge this bar. that dodge is
    //    `forbid.narration`'s to catch, never this one's — **an exemption is
    //    scoped to the DEFECT it excuses**, and the defect here is density in the
    //    prose a reader scans.
    if (/^\s*>/.test(line)) return;

    // 🔴 a mark inside a BACKTICK span is not emphasis — markdown renders it
    //    literally, so `\`**x**\`` and `\`🔴\`` are quoted tokens a reader sees as
    //    code. ported from `review.for.emphasis-noise.spans.js`, which derived it first.
    //
    // 🟡 it was RE-DERIVED here rather than reused, which is `declare-once` in my
    //    own instruments: four tools, one law, and each learned it alone. ⇒ **a
    //    predicate proven in a sibling is pavement — check for it before you
    //    widen a regex.**
    const rendered = line.replace(/`[^`]*`/g, '``');

    if (MARK.test(rendered.replace(LEAD, ''))) marked.push(i + 1);
  });
  flush();

  for (const h of hits) rows.push({ file, ...h });
}

// 🔴 the SILENT TRUNCATION, and this tool shipped with it until 2026-09-07.
//
// the row set was capped at 25 and said so NOWHERE. the summary line beneath it
// stated the true total, so the report was internally inconsistent and honest only
// to a reader who compared the two — which nobody does, since a row set that ends
// is read as a row set that finished.
//
// 🟡 what it cost: a by-tree sweep tool re-parsed this stdout for PATHS and derived
//    its counts from the printed rows. it reported `.agent` at ZERO density hits
//    across eight rounds while a `--root=.agent/repo=.this` run reported 19 — every
//    one inside the diff, and every one owed.
//
// ⇒ the same class as the DENOMINATOR defect: an empty scope and an empty report
//   render identically, and a truncated row set and a complete one do too. so the
//   repair is the same shape — **say what you did not print.**
//
// 🟡 `--limit=0` prints every row, which is what a machine reader must pass. the
//    default stays finite so a human run is legible.
const limitFlag = args.find((a) => a.startsWith('--limit='));
const LIMIT = limitFlag ? Number(limitFlag.slice(8)) : 25;

rows.sort((a, b) => b.n - a.n);
const shown = LIMIT > 0 ? rows.slice(0, LIMIT) : rows;
for (const r of shown)
  console.log(
    `${String(r.n).padStart(3)}  ${r.file}\n     ${r.sec}\n     lines ${r.at.slice(0, 12).join(', ')}${r.at.length > 12 ? ' …' : ''}\n`,
  );

if (shown.length < rows.length)
  console.log(
    `🔴 TRUNCATED — ${shown.length} of ${rows.length} row(s) printed. pass --limit=0 for every row.\n`,
  );

console.log(
  `${rows.length} section(s) over ${BAR} emphasized line(s), across ${targets.length} files`,
);
