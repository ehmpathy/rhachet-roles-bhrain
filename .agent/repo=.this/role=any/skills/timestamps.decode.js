#!/usr/bin/env node
/**
 * .what = decode each time-of-day a text holds into its utc instant: unix epoch seconds or
 *         milliseconds, a compact stamp, an iso stamp
 * .why  = an epoch number or a compact stamp hides its time of day in plain digits; a decode
 *         turns "is this a timestamp?" from a guess into a read
 * .note = read-only. an epoch counts only inside 2001..2039 with no digit beside it, so a short
 *         id or a long hash does not read as one; a hit is still a candidate, never proof
 */
const fs = require('fs');

// the usage lines, as the shell entry header states them
const HELP = [
  'usage:',
  "  rhx timestamps.decode --value 'ca-<epoch seconds>'",
  "  rhx timestamps.decode --value '<a>' --value '<b>'",
  '  printf %s "$text" | rhx timestamps.decode --value @stdin',
].join('\n');

// parse args: each --value is one input; @stdin reads the pipe
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(HELP);
  process.exit(0);
}
const values = [];
for (let i = 0; i < args.length; i++) {
  if (['--skill', '--repo', '--role'].includes(args[i])) {
    i++;
    continue;
  }
  if (args[i] !== '--value') {
    console.error(`✋ ConstraintError: unknown arg '${args[i]}'`);
    console.error(HELP);
    process.exit(2);
  }
  const v = args[i + 1];
  if (v === undefined) {
    console.error('✋ ConstraintError: --value needs a value');
    process.exit(2);
  }
  values.push(v === '@stdin' ? fs.readFileSync(0, 'utf8') : v);
  i++;
}
if (!values.length) {
  console.error('✋ ConstraintError: pass at least one --value <text> (or --value @stdin)');
  console.error(HELP);
  process.exit(2);
}

// the plausible epoch window: 2001-09-09 .. 2039-12-31, utc
const EPOCH_S_MIN = 1e9;
const EPOCH_S_MAX = 2208988800;

// the shapes, each a candidate instant
const SHAPES = [
  {
    kind: 'epoch ms',
    re: /(?<![0-9])([0-9]{13})(?![0-9])/g,
    asDate: (m) => {
      const n = Number(m[1]);
      return n >= EPOCH_S_MIN * 1000 && n < EPOCH_S_MAX * 1000 ? new Date(n) : null;
    },
  },
  {
    kind: 'epoch s',
    re: /(?<![0-9])([0-9]{10})(?![0-9])/g,
    asDate: (m) => {
      const n = Number(m[1]);
      return n >= EPOCH_S_MIN && n < EPOCH_S_MAX ? new Date(n * 1000) : null;
    },
  },
  {
    kind: 'compact stamp',
    re: /(?<![0-9])([0-9]{4})([01][0-9])([0-3][0-9])T([0-2][0-9])([0-5][0-9])([0-5][0-9])?(Z?)(?![0-9])/g,
    asDate: (m) => new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0))),
  },
  {
    kind: 'iso stamp',
    re: /(?<![0-9])([0-9]{4})-([01][0-9])-([0-3][0-9])T([0-2][0-9])[:-]([0-5][0-9])(?:[:-]([0-5][0-9]))?/g,
    asDate: (m) => new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], +(m[6] ?? 0))),
  },
];

// decode: every hit of every shape, in text order
const asHits = (text) =>
  SHAPES.flatMap((shape) =>
    [...text.matchAll(shape.re)].flatMap((m) => {
      const date = shape.asDate(m);
      if (!date || Number.isNaN(date.getTime())) return [];
      return [{ at: m.index, raw: m[0], kind: shape.kind, utc: date.toISOString() }];
    }),
  ).sort((a, b) => a.at - b.at);

// report, one tree per value
console.log('🦉 the digits speak');
console.log('');
console.log('🔍 timestamps.decode');
values.forEach((value, vi) => {
  const lastValue = vi === values.length - 1;
  const trunk = lastValue ? '└─' : '├─';
  const bar = lastValue ? '   ' : '│  ';
  const shown = value.length > 60 ? `${value.slice(0, 57)}...` : value.trim();
  const hits = asHits(value);
  console.log(`   ${trunk} value: ${shown}`);
  if (!hits.length) {
    console.log(`   ${bar}└─ no stamp found`);
    return;
  }
  hits.forEach((hit, hi) => {
    const lastHit = hi === hits.length - 1;
    console.log(`   ${bar}${lastHit ? '└─' : '├─'} ${hit.raw}`);
    const sub = lastHit ? '   ' : '│  ';
    console.log(`   ${bar}${sub}├─ kind: ${hit.kind}`);
    console.log(`   ${bar}${sub}└─ utc: ${hit.utc}`);
  });
});
