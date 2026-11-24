#!/usr/bin/env node
// .what = audit whether a branch kept the intent of every test it touched, from the merge-base
//         with --base (default origin/main) to HEAD, over `*.test.ts`
//
// .why  = a repair that edits tests can quietly weaken them. a line count over the diff
//         misreads a moved or retired suite as a loss, and an eyeball read misses a changed
//         expected value behind a rewrap. so this pairs each suite as git does, then judges
//         each pair whole:
//         - modified  · same path on both sides
//         - moved     · renamed to another `*.test.ts` path
//         - retired   · renamed to `$path.retired` (`rhx retire.suites`)
//         - deleted   · gone, no twin
//         - added     · new on the branch
//         per pair it counts block openers (`given(`, `when(`, `then(`, `it(`, `test(`),
//         assertion openers (`expect(`), and skip or focus marks, and compares tokens. tokens
//         ignore whitespace, commas, semicolons, comments, and quote style, so a rewrap reads as
//         identical, and a suite whose tokens only moved (an import hoist) reads as reordered
//
// exit: 0 = intent held · 2 = a skip added, a live pair lost blocks or assertions, or a suite
//       deleted with no twin · 1 = git fault

const { execFileSync } = require('child_process');

// read the flags
const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  console.log(
    [
      '🦉 audit.test.intentions — did this branch keep the intent of every test it touched?',
      '   ├─ usage: rhx audit.test.intentions [--base <ref>]',
      '   ├─ --base: the ref to compare from, via its merge-base with HEAD (default: origin/main)',
      '   └─ example: rhx audit.test.intentions --base origin/main',
    ].join('\n'),
  );
  process.exit(0);
}
const baseIndex = argv.indexOf('--base');
const baseRef = baseIndex === -1 ? 'origin/main' : argv[baseIndex + 1];
if (!baseRef) {
  console.error('✋ ConstraintError: --base needs a ref, e.g. --base origin/main');
  process.exit(2);
}

// read git, fail loud on a git fault
const git = (args) => {
  try {
    return execFileSync('git', args, { maxBuffer: 1 << 28 }).toString();
  } catch (error) {
    console.error(`💥 MalfunctionError: git ${args.join(' ')} failed`);
    console.error(`   └─ ${String(error.stderr ?? error.message).trim()}`);
    process.exit(1);
  }
};
const base = git(['merge-base', baseRef, 'HEAD']).trim();

// pair each touched suite, with git's own rename detection over the whole tree
const isSuite = (rel) => rel.endsWith('.test.ts');
const asPair = (line) => {
  const [status, from, into] = line.split('\t');
  if (status.startsWith('R') && isSuite(from) && into === `${from}.retired`) return { kind: 'retired', from, into };
  if (status.startsWith('R') && isSuite(from) && isSuite(into)) return { kind: 'moved', from, into };
  if (status.startsWith('R') && isSuite(from)) return { kind: 'deleted', from, into: null };
  if (status.startsWith('R') && isSuite(into)) return { kind: 'added', from: null, into };
  if (status === 'M' && isSuite(from)) return { kind: 'modified', from, into: from };
  if (status === 'D' && isSuite(from)) return { kind: 'deleted', from, into: null };
  if (status === 'A' && isSuite(from)) return { kind: 'added', from: null, into: from };
  return null;
};
const pairs = git(['diff', '--name-status', '-M', base, 'HEAD'])
  .split('\n')
  .filter(Boolean)
  .map(asPair)
  .filter(Boolean);

// measure one side of a pair
const PATTERN_SKIP = /\.(skip|only)\(|\bxit\(|\bxdescribe\(|\brunIf\(|\bskipIf\(/;
const PATTERN_BLOCK = /^\s*(given|when|then|it|test)(\.\w+)?\(/;
const PATTERN_EXPECT = /^\s*(await\s+)?expect\(/;
const PATTERN_TOKEN =
  /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\]|\\.)*`|\/\/[^\n]*|\/\*[\s\S]*?\*\/|[A-Za-z_$][\w$]*|\d[\w.]*|\S/g;
const asTokens = (source) =>
  (source.match(PATTERN_TOKEN) ?? [])
    .filter((token) => token !== ',' && token !== ';' && !token.startsWith('//') && !token.startsWith('/*'))
    .map((token) =>
      token[0] === "'" || token[0] === '"' ? `"${token.slice(1, -1).replace(/\\(['"])/g, '$1')}"` : token,
    );
// blank each string literal, so a fixture whose text names `.skip(` reads as no skip
const PATTERN_STRING = /'(?:[^'\\\n]|\\.)*'|"(?:[^"\\\n]|\\.)*"|`(?:[^`\\\n]|\\.)*`/g;
const asCodeOnly = (line) => line.replace(PATTERN_STRING, '""');
const asMeasure = (ref, rel) => {
  const source = rel === null ? '' : git(['show', `${ref}:${rel}`]);
  const lines = source.split('\n');
  return {
    blocks: lines.filter((line) => PATTERN_BLOCK.test(line)).length,
    expects: lines.filter((line) => PATTERN_EXPECT.test(line)).length,
    skips: lines.filter((line) => PATTERN_SKIP.test(asCodeOnly(line))),
    tokens: asTokens(source),
  };
};

// diff two token lists as bags: what one holds more of than the other
const asBagDiff = (from, into) => {
  const counts = new Map();
  from.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
  into.forEach((token) => counts.set(token, (counts.get(token) ?? 0) - 1));
  const removed = [...counts].filter(([, n]) => n > 0).flatMap(([token, n]) => Array(n).fill(token));
  const added = [...counts].filter(([, n]) => n < 0).flatMap(([token, n]) => Array(-n).fill(token));
  return { removed, added };
};

// judge each pair
const judged = pairs.map((pair) => {
  const before = asMeasure(base, pair.from);
  const after = asMeasure('HEAD', pair.into);
  const same = before.tokens.length === after.tokens.length && before.tokens.every((t, i) => t === after.tokens[i]);
  const bag = same ? { removed: [], added: [] } : asBagDiff(before.tokens, after.tokens);
  const shape = same ? 'identical' : bag.removed.length + bag.added.length === 0 ? 'reordered' : 'changed';
  const skipsAdded = after.skips.length > before.skips.length ? after.skips.slice(before.skips.length) : [];
  return { ...pair, before, after, shape, ...bag, skipsAdded };
});
const ofKind = (kind) => judged.filter((pair) => pair.kind === kind);
const isLive = (pair) => pair.kind === 'modified' || pair.kind === 'moved' || pair.kind === 'retired';
const sumOf = (pick) => judged.reduce((sum, pair) => sum + pick(pair), 0);

// gather defects
const defects = [
  ...judged.flatMap((pair) => pair.skipsAdded.map((line) => `skip added in ${pair.into}: ${line.trim()}`)),
  ...judged
    .filter((pair) => isLive(pair) && pair.after.blocks < pair.before.blocks)
    .map((pair) => `blocks lost in ${pair.into}: ${pair.before.blocks - pair.after.blocks}`),
  ...judged
    .filter((pair) => isLive(pair) && pair.after.expects < pair.before.expects)
    .map((pair) => `assertions lost in ${pair.into}: ${pair.before.expects - pair.after.expects}`),
  ...ofKind('deleted').map(
    (pair) => `suite deleted, no twin: ${pair.from} (${pair.before.blocks} blocks, ${pair.before.expects} assertions)`,
  ),
];

// render
const asShort = (tokens) => {
  const text = tokens.join(' ');
  return text.length > 160 ? `${text.slice(0, 157)}...` : text || '(none)';
};
const changed = judged.filter((pair) => pair.kind !== 'deleted' && pair.kind !== 'added' && pair.shape === 'changed');
const asShapeCount = (shape) => judged.filter((pair) => isLive(pair) && pair.shape === shape).length;
const lines = [
  defects.length ? '🦉 patience. the intent slipped somewhere' : '🦉 so it is. the intent held',
  '',
  '🔍 audit.test.intentions',
  `   ├─ base: ${baseRef} @ ${base.slice(0, 8)}`,
  '   ├─ suites',
  `   │  ├─ modified: ${ofKind('modified').length}`,
  `   │  ├─ moved: ${ofKind('moved').length}`,
  `   │  ├─ retired: ${ofKind('retired').length}`,
  `   │  ├─ deleted: ${ofKind('deleted').length}`,
  `   │  └─ added: ${ofKind('added').length}`,
  '   ├─ tokens, over modified + moved + retired',
  `   │  ├─ identical: ${asShapeCount('identical')}`,
  `   │  ├─ reordered, none added or removed: ${asShapeCount('reordered')}`,
  `   │  └─ changed: ${changed.length}`,
  ...changed.flatMap((pair, i) => {
    const last = i === changed.length - 1;
    const stem = last ? '   │     └─' : '   │     ├─';
    const pipe = last ? '   │        ' : '   │     │  ';
    return [`${stem} ${pair.into}`, `${pipe}├─ removed: ${asShort(pair.removed)}`, `${pipe}└─ added: ${asShort(pair.added)}`];
  }),
  '   ├─ totals, base → head',
  `   │  ├─ blocks: ${sumOf((p) => p.before.blocks)} → ${sumOf((p) => p.after.blocks)}`,
  `   │  ├─ assertions: ${sumOf((p) => p.before.expects)} → ${sumOf((p) => p.after.expects)}`,
  `   │  └─ skips added: ${sumOf((p) => p.skipsAdded.length)}`,
  '   │',
  defects.length ? `   └─ ✋ ${defects.length} defect(s)` : '   └─ ✨ no skip added, no block or assertion lost',
  ...defects.map((defect, i) => `      ${i === defects.length - 1 ? '└─' : '├─'} ${defect}`),
];
// set the exit code rather than exit at once: a hard exit drops stdout a pipe has not drained
console.log(lines.join('\n'));
process.exitCode = defects.length ? 2 : 0;
