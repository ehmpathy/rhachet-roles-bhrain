#!/usr/bin/env node
/**
 * .what = finds each glyph that CLAIMS emoji presentation and does not compute to
 *         the 2 cells a terminal reserves for one.
 *
 * .why  = `rule.forbid.width-ambiguous-glyphs` shipped 2026-09-07 with no checker,
 *         so it was unenforceable — and its defect is the one class its author is
 *         structurally unable to catch by eye. the desync is a property of the
 *         READER's terminal and font, so a glyph that renders clean in the editor
 *         that typed it kinks a column two machines away, with no error and no
 *         trace back.
 *
 *         ⇒ so this rule needs a tool more than any peer in the canon does. the
 *           others grade prose an author can re-read; this grades a render the
 *           author never sees.
 *
 * .the predicate = a VS16, over a character list.
 *
 *   `U+FE0F` VARIATION SELECTOR-16 is an explicit request for emoji presentation.
 *   a font honors it and paints 2 cells; a terminal computes width from the BASE
 *   codepoint's `East_Asian_Width` and reserves 1 where that base is Neutral.
 *
 *   ⇒ so `base is not Wide` + `VS16 present` IS the defect, exactly. no allowlist
 *     to maintain, no taste to apply, and it flags `⚠️` while it leaves every one
 *     of the palette's other 25 glyphs alone.
 *
 * 🟡 .the bound, stated because a silent bound is what makes an audit lie:
 *
 *    it catches the VS16 class and NOT a glyph that some font paints wide with no
 *    VS16 at all. that residual is real and it is narrow — a base with no VS16
 *    makes no emoji claim, so a terminal and a font agree on it far more often.
 *
 * 🟡 a TEXT SYMBOL is exempt by construction rather than by a carve-out. `⇒` `·`
 *    `→` compute to 1 cell and are painted as 1, so they are CONSISTENT — the
 *    defect is the MISMATCH, never the narrowness, and they carry no VS16.
 *
 * usage  = node src/domain.roles/telepath/skills/review.for/review.for.width-ambiguous-glyphs.js [pathFragment] [--root=DIR] [--all]
 * writes = never
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const args = process.argv.slice(2);
const rootFlag = args.find((a) => a.startsWith('--root='));
const ROOT = rootFlag ? rootFlag.slice(7) : '.';
const only = args.filter((a) => !a.startsWith('--'))[0] ?? '';

// ── UAX #11 East_Asian_Width = Wide (W), the ranges that hold pictographs.
//
// 🔴 the 2600–27BF block is NOT contiguous. UAX #11 marks scattered entries Wide
//    and leaves their neighbours Neutral, so a range approximation over that block
//    reports `✋` `✨` `✅` as narrow — and they are not.
//
//    measured: the first draft of this table did approximate it, and would have
//    forbidden four glyphs that are fine. the entries below are enumerated.
const WIDE = [
  [0x1100, 0x115f], [0x2e80, 0x303e], [0x3041, 0x33ff],
  [0x3400, 0x4dbf], [0x4e00, 0x9fff], [0xa000, 0xa4cf],
  [0xac00, 0xd7a3], [0xf900, 0xfaff], [0xfe30, 0xfe6f],
  [0xff00, 0xff60], [0xffe0, 0xffe6],
  // the scattered 2600-block Wide entries
  [0x2614, 0x2615], [0x2648, 0x2653], [0x267f, 0x267f], [0x2693, 0x2693],
  [0x26a1, 0x26a1], [0x26aa, 0x26ab], [0x26bd, 0x26be], [0x26c4, 0x26c5],
  [0x26ce, 0x26ce], [0x26d4, 0x26d4], [0x26ea, 0x26ea], [0x26f2, 0x26f3],
  [0x26f5, 0x26f5], [0x26fa, 0x26fa], [0x26fd, 0x26fd], [0x2705, 0x2705],
  [0x270a, 0x270b], [0x2728, 0x2728], [0x274c, 0x274c], [0x274e, 0x274e],
  [0x2753, 0x2755], [0x2757, 0x2757], [0x2795, 0x2797], [0x27b0, 0x27b0],
  [0x27bf, 0x27bf],
  [0x2b1b, 0x2b1c], [0x2b50, 0x2b50], [0x2b55, 0x2b55],
  [0x1f004, 0x1f004], [0x1f0cf, 0x1f0cf], [0x1f18e, 0x1f18e],
  [0x1f191, 0x1f19a], [0x1f200, 0x1f320], [0x1f32d, 0x1f335],
  [0x1f337, 0x1f37c], [0x1f37e, 0x1f393], [0x1f3a0, 0x1f3ca],
  [0x1f3cf, 0x1f3d3], [0x1f3e0, 0x1f3f0], [0x1f3f4, 0x1f3f4],
  [0x1f3f8, 0x1f43e], [0x1f440, 0x1f440], [0x1f442, 0x1f4fc],
  [0x1f4ff, 0x1f53d], [0x1f54b, 0x1f54e], [0x1f550, 0x1f567],
  [0x1f57a, 0x1f57a], [0x1f595, 0x1f596], [0x1f5a4, 0x1f5a4],
  [0x1f5fb, 0x1f64f], [0x1f680, 0x1f6c5], [0x1f6cc, 0x1f6cc],
  [0x1f6d0, 0x1f6d2], [0x1f6d5, 0x1f6d7], [0x1f6eb, 0x1f6ec],
  [0x1f6f4, 0x1f6fc], [0x1f7e0, 0x1f7eb], [0x1f90c, 0x1f93a],
  [0x1f93c, 0x1f945], [0x1f947, 0x1f978], [0x1f97a, 0x1f9cb],
  [0x1f9cd, 0x1f9ff], [0x1fa70, 0x1fa74], [0x1fa78, 0x1fa7a],
  [0x1fa80, 0x1fa86], [0x1fa90, 0x1faa8], [0x1fab0, 0x1faba],
  [0x1fac0, 0x1fac2], [0x1fad0, 0x1fad6],
];
const isWide = (cp) => WIDE.some(([lo, hi]) => cp >= lo && cp <= hi);

const VS16 = 0xfe0f;

// 🟡 `.agent/.notes/` is EXCLUDED for the reason its peers exclude it: it is a
//    scratch dir. not one file under it boots, ships, or is cited by a brief.
const SKIP = /(^|\/)(node_modules|dist|\.git|\.log)(\/|$)|(^|\/)\.agent\/\.notes\//;

// 🔴 a file whose DECLARED SUBJECT is the forbidden glyph must carry a specimen to
//    state that subject at all, so it is exempt by WHAT IT IS rather than by a
//    regex over its prose — the same ground `review.for.emphasis-noise.glyphs.js`
//    states for its verbatim set.
//
// 🟡 the two sets differ by their ANCHOR, and the split is not cosmetic.
//
//    a PATH exemption names a directory or a whole filename, so `(^|\/)` is right
//    and it keeps `.demo=` from a mid-name coincidence.
//
//    a SUBJECT exemption names a topic that sits anywhere in a path — a rule file
//    (`rule.forbid.width-ambiguous-glyphs.md`) and a dream about the same class
//    (`…a-telepath-hook-refuses-a-blocked-glyph.md`) both hold it, and only the
//    first happens to sit at a segment boundary.
//
//    measured 2026-09-07: these were ONE anchored alternation, and a widen from
//    `rule\.forbid\.width-ambiguous-glyphs` to the bare topic silently un-exempted
//    the rule's own file — the prefix was what had put the topic against a `/`.
//    ⇒ so the anchor was load-bearing and invisible, which is why it is split.
//
// 🔴 a SUBJECT exemption is keyed on a FILENAME, so a rename silently voids it.
//    measured the same day: the dream above was renamed when its scope grew from
//    one glyph to two, and its four specimens flagged at once — the file's subject
//    was unchanged and its exemption was gone.
//    ⇒ so `blocked-glyph` is listed BESIDE the old topic rather than in place of
//      it: a subject can be named more than one way over time, and a checker that
//      knows only the current name re-breaks on the next rename.
const VERBATIM_PATH = /(^|\/)(\.seeds\/|\.demo=|0\.wish\.md$)/;
const VERBATIM_SUBJECT = /(width-ambiguous-glyph|blocked-glyph|catalog\.of=glyph)/;
const isVerbatim = (f) => VERBATIM_PATH.test(f) || VERBATIM_SUBJECT.test(f);

const inDiff = (() => {
  if (args.includes('--all')) return () => true;
  const lines = execFileSync('git', ['status', '--porcelain'])
    .toString('utf8')
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

const targets = walk(ROOT, [])
  .filter((f) => f.includes(only))
  .filter((f) => !isVerbatim(f))
  .filter(inDiff)
  .sort();

const hex = (cp) => 'U+' + cp.toString(16).toUpperCase().padStart(4, '0');

let defects = 0;
const seen = {};

for (const file of targets) {
  const lines = fs.readFileSync(file).toString('utf8').split('\n');
  const hits = [];

  lines.forEach((line, i) => {
    const cps = [...line].map((c) => c.codePointAt(0));
    for (let k = 0; k < cps.length - 1; k++) {
      if (cps[k + 1] !== VS16) continue;
      if (isWide(cps[k])) continue;
      const g = String.fromCodePoint(cps[k]) + '\uFE0F';
      seen[g] = (seen[g] || 0) + 1;
      hits.push({ i: i + 1, g, cp: hex(cps[k]), line });
    }
  });

  if (!hits.length) continue;
  console.log(file);
  for (const h of hits) {
    console.log(
      `  ${String(h.i).padStart(4)} [${h.g} ${h.cp}+VS16 → 1 cell] ${h.line.trim().slice(0, 92)}`,
    );
    defects += 1;
  }
  console.log('');
}

// 🔴 the DENOMINATOR is printed always. an empty report and an empty scope render
//    identically otherwise, and that is how an audit reports a clean tree it never
//    walked (`.dream/…an-audit-is-evidence-about-its-instrument…`).
console.log(
  `${defects} width-ambiguous glyph(s) across ${targets.length} files · glyphs: ${JSON.stringify(seen)}`,
);
