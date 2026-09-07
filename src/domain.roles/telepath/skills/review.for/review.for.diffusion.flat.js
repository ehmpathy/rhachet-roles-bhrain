/**
 * .what = per SECTION of a booted brief, count the lines that carry a GRADIENT —
 *         a line a reader's eye can land on as "this is the point"
 * .why  = the emphasis sweep cut ~950 rank glyphs. `rule.forbid.emphasis-noise` and
 *         `rule.forbid.diffusion` are a POLE PAIR, so a cut that overshoots does not
 *         land on "clean" — it lands on the opposite defect, where no line is
 *         elevated and the needle cannot be found.
 *
 *         ⇒ so the sweep owes this scan. a flat section is the predicted damage.
 *
 * 🟡 A GRADIENT IS NOT A GLYPH. the rule's own repair list is what counts here:
 *    "promote the point to a header, a lead line, a bolded claim, or a parent
 *    bullet with the rest as its children." every one of those is STRUCTURE.
 *
 * a section is FLAT when it holds 3+ prose lines and NONE of them is:
 *   - a `>` blockquote claim
 *   - a `⇒` conclusion line
 *   - a line that carries a **bold** claim, at ANY position
 *   - a table (its header row IS the needle, per the rule's own false-positive)
 *
 * 🔴 the BOLD POSITION defect, and this tool shipped with it until 2026-09-07.
 *
 * the predicate demanded the bold at the line's LEAD. the rule demands only that
 * a reader can point at the line — and its repair list names "a bolded claim"
 * with no position attached.
 *
 * 🟡 measured: 23 of 315 sections reported FLAT, and the sample opened with
 *    `no **contract** may use a synonym…` — a bolded claim on every one of its
 *    three lines. the board was an artifact of the predicate.
 *
 * ⇒ it is the same defect `review.for.diffusion.needleless.js` already carries on
 *   the record, in a second tool. see
 *   `.dream/v2026_09_05.enbrief.an-audit-is-evidence-about-its-instrument…`
 *
 * usage: node <this> [pathFragment] [--all]
 */
const fs = require('fs');
const path = require('path');

const showAll = process.argv.includes('--all');
// eslint-disable-next-line -- `encoding` is the node fs api key, not our word
const UTF8 = { encoding: 'utf8' };

// 🟡 it took NO path argument until 2026-09-07, so a caller who narrowed by one
//    got the whole tree back and read it as their scope. a silently ignored
//    argument is the fourth face of the instrument dream
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'))[0] ?? '';

const ROOT = 'src/domain.roles';
const roles = fs.readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory());

const files = [];
for (const r of roles) {
  const dir = path.join(ROOT, r.name, 'briefs');
  if (!fs.existsSync(dir)) continue;
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md.min') && p.includes(only)) files.push(p);
    }
  };
  walk(dir);
}

const isGradient = (l) =>
  /^\s*>/.test(l) || // a blockquote claim
  /^\s*⇒/.test(l) || // a conclusion
  /\*\*[^*]+\*\*/.test(l) || // a BOLDED CLAIM, at any position — the rule names no position
  /^\s*\|/.test(l) || // a table row — its header is the needle
  /^\s*🟡/.test(l); // a warn lead

const isProse = (l) => l.trim().length > 0 && !/^\s*#/.test(l);

let flat = 0;
let total = 0;
const report = [];

for (const file of files) {
  const lines = fs.readFileSync(file, UTF8).split('\n');
  let inFence = false;
  let header = '(preamble)';
  let prose = 0;
  let grad = 0;
  const flats = [];

  const close = () => {
    if (prose >= 3) {
      total += 1;
      if (grad === 0) flats.push(header);
    }
  };

  for (const line of lines) {
    if (/^\s*```/.test(line)) inFence = !inFence;
    if (inFence) continue;
    if (/^#{1,6} /.test(line)) {
      close();
      header = line.trim();
      prose = 0;
      grad = 0;
      continue;
    }
    if (!isProse(line)) continue;
    prose += 1;
    if (isGradient(line)) grad += 1;
  }
  close();

  if (!flats.length && !showAll) continue;
  flat += flats.length;
  report.push({ file: file.replace(ROOT + '/', ''), flats });
}

report.sort((a, b) => b.flats.length - a.flats.length);
for (const r of report) {
  console.log('\n' + r.file);
  for (const h of r.flats) console.log('   FLAT · ' + h.slice(0, 88));
}

console.log('\n---', flat, 'FLAT sections of', total, 'graded, across', files.length, 'booted mins');
console.log('    flat = 3+ prose lines and NOT ONE a reader can land on.');
