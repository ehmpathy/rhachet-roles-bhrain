#!/usr/bin/env node
/**
 * .what = finds the two MECHANICAL classes of surplus bold, per file, with line
 *         numbers — so a cut is surgical rather than a full re-read.
 *
 * .why  = `rule.forbid.emphasis-noise` bounds emphasis per section, and its two
 *         cheapest violations are decidable without a read of the argument:
 *
 *           COLUMN — 2+ rows of one table carry bold in the same cell slot.
 *                    that marks the COLUMN, never any row, so every one of them
 *                    is dead weight. the header already carries the contrast.
 *
 *           STACK  — 2+ bold spans on one line. the rule grades this its
 *                    sharpest form: it announces the author did not trust the
 *                    words.
 *
 * 🟡 it reports and never repairs. the prior loop measured why: a sweep cannot
 *    part a CITATION of a token from an INSTANCE of one, and a mid-line strip
 *    already ate a mention once on this route. the cut stays in human hands.
 *
 * usage  = node src/domain.roles/telepath/skills/review.for/review.for.emphasis-noise.spans.js [pathFragment]
 * writes = never
 */
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const rootFlag = args.find((a) => a.startsWith('--root='));
// 🟡 default to the whole tree, as the three peer checkers do. it defaulted to
//    `src/domain.roles` until 2026-09-07, so a run scoped at `.agent` walked ZERO
//    files and printed no findings — which read as a clean sweep of a scope it
//    never entered. narrow with a path fragment, never by an unstated root
const ROOT = rootFlag ? rootFlag.slice(7) : '.';
const only = args.filter((a) => !a.startsWith('--'))[0] ?? '';

// 🔴 the LOADED set, and the first cut of this rule got it wrong.
//
// the premise was "under src/, the `.md.min` is what boots, so the `.md` behind
// it is free depth." that holds only where a min EXISTS. a brief with no min —
// every `define.*`, `howto.*`, `howdoes.*`, and each role readme — is loaded as
// its `.md`, so a scan that skips every `.md` skips them entirely.
//
// measured 2026-09-05: 30 `.md` files sat in one diff unscanned, the worst at
// 0.75 marks per line — near double the say tier's median.
//
// 🟡 `--sources` widens it to the `.md` behind a min as well — the authority the
//    next min is cut from, so a dense source re-seeds the density.
const loaded = (file) =>
  file.endsWith('.md.min') ||
  (file.endsWith('.md') &&
    (args.includes('--sources') || !fs.existsSync(`${file}.min`)));

const walk = (dir, out) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (loaded(p)) out.push(p);
  }
  return out;
};

const BOLD = /\*\*[^*]+\*\*/g;

// the same scope guard the strip tool carries, and for the same reason: a report
// that ranges past the diff sends a reader to repair files that are not theirs.
// `--all` opts out, in as many words.
//
// 🔴 the DIRECTORY case, and a path-exact set gets it backwards.
//
// `git status --porcelain` collapses an untracked tree to ONE entry that ends
// in a slash — `?? .behavior/v2026_09_04.feat-telepath-role/`. so a set built
// of literal paths holds the directory and none of the 61 files beneath it,
// and `changed.has(file)` is false for every one.
//
// 🟡 that is a fail-open in the WRONG direction: the filter excludes files that
//    ARE the diff. measured 2026-09-05 — a whole route's artifacts scanned as
//    out-of-scope, which sent the next run to `--all`, which then reached four
//    PRIOR behaviors that were clean at HEAD.
//
// ⇒ so an entry that ends in a slash is a PREFIX, never a path.
const inDiff = (() => {
  if (args.includes('--all')) return () => true;
  const lines = require('child_process')
    .execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean)
    .map((l) => l.slice(3).trim());
  const files = new Set(lines.filter((l) => !l.endsWith('/')));
  const dirs = lines.filter((l) => l.endsWith('/'));
  return (f) => files.has(f) || dirs.some((d) => f.startsWith(d));
})();

const targets = walk(ROOT, [])
  .filter((f) => f.includes(only))
  .filter(inDiff)
  .sort();

// 🟡 a silent instrument is indistinguishable from a scan of ZERO files, which is
//    how an audit becomes evidence about itself. every run states its denominator
const tally = { stack: 0, column: 0 };

for (const file of targets) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  const hits = [];

  // 🔴 the VERBATIM section, and it is a contract rather than a courtesy.
  //
  // `rule.always.archive-the-wishers-words-verbatim` states it outright: *".said
  // is verbatim — do not clean it up. typos, lowercase, mid-thought corrections
  // and all. a tidied quote is already a paraphrase."*
  //
  // so every mark under a `## .said` header belongs to the SPEAKER, and a report
  // that flags one asks the reader to commit a blocker to clear a nitpick.
  //
  // 🟡 it is bounded to the `.said` header and not to blockquotes at large — a
  //    `>` is this canon's own pull-claim shape, so a blanket quote exemption
  //    would blind the detector to the emphasis it exists to find.
  const said = new Set();
  {
    let inSaid = false;
    lines.forEach((l, i) => {
      if (/^##\s/.test(l)) inSaid = /^##\s+\.said\b/.test(l);
      if (inSaid) said.add(i);
    });
  }

  // STACK — 2+ bold spans on one line, outside a fence
  let fenced = false;
  lines.forEach((rawLine, i) => {
    if (/^\s*```/.test(rawLine)) fenced = !fenced;
    if (fenced) return;
    if (said.has(i)) return;

    // 🔴 a bold INSIDE a backtick span is not emphasis — markdown renders it as
    //    literal asterisks. so `\`**x**\`` is a QUOTED TOKEN, and a line that
    //    cites two of them cites two specimens rather than ranks two claims.
    //
    // 🟡 this is the cheapest exemption in any of these four tools and it was the
    //    last one found, because it is invisible in the source and obvious in the
    //    render. ⇒ **when a detector reads source, ask what the RENDER shows.**
    //
    // 🔴 and the same holds for an INLINE QUOTE — `*"…**census**…"*` cites a
    //    rule's own enforcement line, so the mark is the SOURCE's. the COLUMN
    //    path below has carried this since 2026-09-07; the STACK path did not,
    //    which is the half-applied exemption `F13`'s step 1 went looking for.
    const line = rawLine
      .replace(/`[^`]*`/g, '``')
      .replace(/\*"[^"]*"\*/g, '""');

    const n = (line.match(BOLD) || []).length;
    if (n < 2) return;

    // container 2 · a TABLE ROW — not a stack when each bold sits in its OWN cell.
    // cites THE EXTENT LAW, declared once in `review.for.emphasis-noise.density.js`
    // and booted in `term=prose.emphasis` + `rule.forbid.emphasis-noise`.
    //
    // the row is not the container here; the CELL is. so one bold per cell is one
    // mark per container, and not one of them competes with another.
    //
    // 🟡 measured 2026-09-05: this one predicate accounted for most reported
    //    stacks in `define.*` briefs, every one of the shape
    //    `| **term** | the **one** property it turns on |` — a row label plus a
    //    single emphasis in its own cell. `rule.forbid.emphasis-noise` declares
    //    that exact case legal: *"one mark of each kind and passes."*
    if (/^\s*\|/.test(line)) {
      const perCell = line
        .split('|')
        .slice(1, -1)
        .map((c) => (c.match(BOLD) || []).length);
      if (perCell.every((c) => c <= 1)) return;
    }

    // 🔴 a TERM SET is not a stack. where every bold on the line is a bare token
    //    — one or two words, no clause — the bolds name TERMS rather than rank
    //    prose, and each one classifies the word it wraps.
    //
    //    `latin **dis-** (*apart*) + **fundere** (*to pour*)` is two cited
    //    morphemes. `**decomposition** and **condensation**` is a coordinate pair
    //    of defined words. neither line asks the reader to rank one half over
    //    the other, which is the sole defect this detector exists to catch.
    //
    // 🟡 the two-word cap is what keeps it from a loophole: the moment a bold
    //    wraps a CLAUSE it makes an argument, and an argument competes.
    //    `**before** a word exists … **as it is formed**` still reports, and
    //    should.
    const spans = line.match(BOLD) || [];
    const isToken = (s) => s.replace(/\*\*/g, '').trim().split(/\s+/).length <= 2;
    if (spans.every(isToken)) return;

    hits.push({ kind: 'STACK', n, i: i + 1, line });
  });

  // COLUMN — group contiguous table rows, then count bold per cell slot
  let block = [];
  const flush = () => {
    if (block.length >= 2) {
      const slots = new Map();
      for (const row of block) {
        const cells = row.line.split('|').slice(1, -1);
        cells.forEach((cell, c) => {
          // 🔴 a bold inside an INLINE QUOTE belongs to the source, never to this
          //    table. `*"the omission voids the **census** claim"*` cites a rule's
          //    own enforcement line, and to strip that bold falsifies the quote —
          //    which `rule.forbid.emphasis-noise` exempts outright, and
          //    `rule.always.archive-the-wishers-words-verbatim` forbids editing.
          //
          // 🟡 the same class as the backtick exemption above: the mark is a
          //    SPECIMEN the cell reports, never a rank the cell asserts. found
          //    2026-09-07, on three glossary-census rows that quote three rules.
          const text = cell.replace(/\*"[^"]*"\*/g, '""').trim();

          // container 1 · a TABLE CELL — `| **diffusion** |`, a pure row label.
          // cites THE EXTENT LAW, declared once in `review.for.emphasis-noise.density.js`
          // and booted in `term=prose.emphasis` + `rule.forbid.emphasis-noise`.
          //
          // the bold spans the whole cell, so it names what the ROW IS — the same
          // act a `###` header performs for its section.
          //
          // 🟡 the test is EXACTNESS, and that is what keeps it honest: a cell
          //    that opens with a bold and then argues (`| **yes** — because … |`)
          //    still ranks its own prose, so it is still counted.
          if (/^\*\*[^*]+\*\*$/.test(text)) {
            BOLD.lastIndex = 0;
            return;
          }

          if (BOLD.test(text)) {
            BOLD.lastIndex = 0;
            slots.set(c, [...(slots.get(c) ?? []), row.i]);
          }
          BOLD.lastIndex = 0;
        });
      }
      for (const [col, rows] of slots)
        if (rows.length >= 2)
          hits.push({
            kind: 'COLUMN',
            n: rows.length,
            i: rows[0],
            line: `col ${col} bolded on ${rows.length} rows — lines ${rows.join(', ')}`,
          });
    }
    block = [];
  };
  lines.forEach((line, i) => {
    if (said.has(i)) return flush(); // the verbatim contract, per the note above
    if (/^\s*\|.*\|\s*$/.test(line) && !/^\s*\|[\s|:-]+\|\s*$/.test(line))
      block.push({ i: i + 1, line });
    else flush();
  });
  flush();

  if (!hits.length) continue;
  console.log(file.replace(`${ROOT}/`, ''));
  for (const h of hits.sort((a, b) => a.i - b.i)) {
    tally[h.kind === 'STACK' ? 'stack' : 'column'] += 1;
    console.log(
      `  ${String(h.i).padStart(4)} [${h.kind}] ${h.line.trim().slice(0, 108)}`,
    );
  }
  console.log('');
}

console.log(
  `${tally.stack} stack(s) · ${tally.column} column(s), across ${targets.length} files`,
);
