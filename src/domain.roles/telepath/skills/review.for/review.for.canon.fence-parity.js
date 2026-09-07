/**
 * .what = report, per markdown file, whether its code fences BALANCE
 * .why  = every sweep tool on this route guards with an inFence toggle. an ODD
 *         fence count leaves the rest of the file permanently "inside a fence",
 *         so the sweep silently skips it — and reports zero cuts, which reads
 *         identical to a clean file.
 *
 *         ⇒ that is the same silent-absence class as a `--glob` that matches a
 *           basename: a wrong answer that renders as a correct one.
 *
 * usage: node <this>
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const UTF8 = { encoding: 'utf8' };

const walk = (dir, out) => {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.md(\.min)?$/.test(e.name)) out.push(p);
  }
  return out;
};

const files = [];
for (const line of execSync('git status --porcelain', UTF8).split('\n')) {
  const p = line.slice(3).trim();
  if (!p) continue;
  if (p.endsWith('/') && fs.existsSync(p)) walk(p, files);
  else if (/\.md(\.min)?$/.test(p) && fs.existsSync(p)) files.push(p);
}

const FENCE = /^\s*```/;
let odd = 0;

for (const file of files) {
  const n = fs.readFileSync(file, UTF8).split('\n').filter((l) => FENCE.test(l)).length;
  if (n % 2 === 0) continue;
  odd += 1;
  console.log(
    String(n).padStart(3),
    'fences |',
    file.replace('.behavior/v2026_09_04.feat-telepath-role/', 'behavior/'),
  );
}

console.log('---', odd, 'files with UNBALANCED fences, of', files.length);
console.log('    every sweep that guards on a fence toggle skipped their tails.');
