#!/usr/bin/env node
/**
 * .what = verifies every telepath brief on disk is wired into boot.yml, and
 *         that each wired path resolves in BOTH src/ and dist/.
 *
 * .why  = an authored-but-unwired brief boots for nobody. it is invisible to a
 *         grep for its own filename (the file IS there) and invisible to the
 *         build (the build copies it either way). only a set difference between
 *         `what is on disk` and `what boot.yml names` surfaces it.
 *
 *         a wired-but-absent path is the mirror defect, and it fails loud at
 *         enroll rather than silently — so it is cheaper. checked anyway.
 *
 * usage = node src/domain.roles/telepath/skills/review.for/review.for.canon.boot-wired.js
 * writes = never
 */
const fs = require('fs');
const path = require('path');

const ROLE = 'src/domain.roles/telepath';
const BOOT = path.join(ROLE, 'boot.yml');

const boot = fs.readFileSync(BOOT, 'utf8');

// the boot file lists one path per `- briefs/...` line; tier is the last
// `say:` / `ref:` key seen above it
const wired = [];
let tier = null;
for (const line of boot.split('\n')) {
  const key = line.match(/^\s*(say|ref):\s*$/);
  if (key) tier = key[1];
  const entry = line.match(/^\s*-\s+(briefs\/\S+)\s*$/);
  if (entry) wired.push({ tier, rel: entry[1] });
}

const onDisk = fs
  .readdirSync(path.join(ROLE, 'briefs'))
  .filter((f) => f.endsWith('.md'))
  .map((f) => `briefs/${f}`)
  .sort();

const wiredSet = new Set(wired.map((w) => w.rel));

const unwired = onDisk.filter((f) => !wiredSet.has(f));
const phantom = wired.filter((w) => !fs.existsSync(path.join(ROLE, w.rel)));

// a say-tier brief is loaded via its .md.min sidecar when one exists; a ref
// one is dereferenced whole. so a say entry with no .min is a real gap.
const minless = wired
  .filter((w) => w.tier === 'say')
  .filter((w) => !fs.existsSync(path.join(ROLE, `${w.rel}.min`)));

// dist is what a consumer resolves against
const distMissed = wired.filter(
  (w) => !fs.existsSync(path.join('dist/domain.roles/telepath', w.rel)),
);
const distMinMissed = wired
  .filter((w) => w.tier === 'say')
  .filter(
    (w) =>
      !fs.existsSync(path.join('dist/domain.roles/telepath', `${w.rel}.min`)),
  );

const say = wired.filter((w) => w.tier === 'say').length;
const ref = wired.filter((w) => w.tier === 'ref').length;

console.log(`on disk : ${onDisk.length} .md`);
console.log(`wired   : ${wired.length}  (say ${say} · ref ${ref})`);
console.log('');

const report = (label, list, fmt) => {
  if (!list.length) return console.log(`ok   ${label}: none`);
  console.log(`FAIL ${label}: ${list.length}`);
  for (const item of list) console.log(`       ${fmt(item)}`);
};

report('unwired on disk', unwired, (f) => f);
report('wired but absent in src', phantom, (w) => w.rel);
report('say-tier with no .md.min', minless, (w) => w.rel);
report('wired but absent in dist', distMissed, (w) => w.rel);
report('say-tier .min absent in dist', distMinMissed, (w) => w.rel);

const failed =
  unwired.length +
  phantom.length +
  minless.length +
  distMissed.length +
  distMinMissed.length;
process.exit(failed ? 1 : 0);
