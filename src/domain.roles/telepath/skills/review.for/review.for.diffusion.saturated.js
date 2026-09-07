/**
 * .what = the OTHER pole of the same scan — a section where nearly EVERY line is a
 *         gradient, so the gradient carries no rank
 * .why  = `review.for.diffusion.flat.js` finds a section with ZERO elevated lines. that is
 *         one pole. the peer failure is a section where 90%+ of lines are elevated —
 *         a reader has as little to land on as in a flat one, for the mirror reason.
 *
 *         ⇒ `rule.forbid.diffusion` and `rule.forbid.emphasis-noise` are a POLE PAIR,
 *           so one scan cannot find both. this is the second scan the pair demands.
 *
 * a section is SATURATED when it holds 4+ prose lines and 90%+ of them lead with a
 * gradient — a `>`, a `⇒`, a `**bold**`, or a `🟡`.
 *
 * 🟡 A TABLE IS EXEMPT, by the rule's own false-positive clause: its rows are a flat
 *    set on one axis, and its header row is the needle.
 *
 * usage: node <this>
 */
const fs = require('fs');
const path = require('path');

const UTF8 = { encoding: 'utf8' };
const ROOT = 'src/domain.roles';

const files = [];
for (const r of fs.readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory())) {
  const dir = path.join(ROOT, r.name, 'briefs');
  if (!fs.existsSync(dir)) continue;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md.min')) files.push(p);
    }
  };
  walk(dir);
}

const isTable = (l) => /^\s*\|/.test(l);

// 🟡 THE EXTENT LAW, borrowed from `review.for.emphasis-noise.density.js` rather than
//    re-derived. a mark that spans its WHOLE container LABELS it; one that spans
//    PART of a container RANKS the rest. so a lead bold in a LABEL SLOT —
//    `**reuse when** — you would write a step-by-step …` — is a column header, not
//    a gradient, and to count it reports every well-formed outline as saturated.
//
//    ⇒ measured 2026-09-06 on `learner/briefs/im_an.obsessive_learner.md.min`: a
//      section of 7 label slots + 7 `⇒` conclusions scored 16/16 and reads as
//      diffuse. it is a column, and its `⇒` lines are its needles.
//
//    the two guards are the peer tool's, unchanged: a MANDATORY separator
//    (`—` `–` `:` `=`) and a length cap. a bold with no separator is a sentence,
//    and a bold that wraps a clause argues — both still report.
const LABEL_SLOT = /^\s*(?:[-*]\s+)?\*\*[^*]{1,60}\*\*\s*[—–:=]/;

const isGradient = (l) =>
  !LABEL_SLOT.test(l) &&
  (/^\s*>/.test(l) || /^\s*⇒/.test(l) || /^\s*(?:[-*]\s+)?\*\*/.test(l) || /^\s*🟡/.test(l));
const isProse = (l) => l.trim().length > 0 && !/^\s*#/.test(l) && !isTable(l);

const report = [];
let saturated = 0;
let graded = 0;

for (const file of files) {
  const lines = fs.readFileSync(file, UTF8).split('\n');
  let inFence = false;
  let header = '(preamble)';
  let prose = 0;
  let grad = 0;
  const hits = [];

  const close = () => {
    if (prose < 4) return;
    graded += 1;
    if (grad / prose >= 0.9) hits.push({ header, grad, prose });
  };

  // 🟡 a run of `>` lines is ONE quote, never N gradients. the extent law: a mark that
  //    spans its whole container LABELS it. a blockquote spans its whole container, so
  //    it is one unit whose lead is its needle — the same shape the table clause exempts.
  //    ⇒ without this collapse, a 👎/👍 demo whose bad form is quoted verbatim scores
  //      one gradient per quoted line and reads as saturated. measured on
  //      `telepath/briefs/define.bulletize.md.min` — a false positive about the
  //      instrument, never about the file.
  let inQuote = false;

  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    if (/^#{1,6} /.test(line)) {
      close();
      header = line.trim();
      prose = 0;
      grad = 0;
      inQuote = false;
      continue;
    }
    if (!isProse(line)) {
      inQuote = false;
      continue;
    }
    if (/^\s*>/.test(line)) {
      if (inQuote) continue; // a continuation line of the same quote
      inQuote = true;
    } else inQuote = false;
    prose += 1;
    if (isGradient(line)) grad += 1;
  }
  close();

  if (!hits.length) continue;
  saturated += hits.length;
  report.push({ file: file.replace(ROOT + '/', ''), hits });
}

report.sort((a, b) => b.hits.length - a.hits.length);
for (const r of report) {
  console.log('\n' + r.file);
  for (const h of r.hits)
    console.log('   SATURATED ' + h.grad + '/' + h.prose + ' · ' + h.header.slice(0, 76));
}

console.log('\n---', saturated, 'SATURATED sections of', graded, 'graded');
console.log('    saturated = 4+ prose lines, 90%+ of them elevated. no line leads.');
