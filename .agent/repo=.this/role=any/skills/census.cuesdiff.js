#!/usr/bin/env node
// .what = compare two `census.cues --emit` files. report the cue lines that left and the cue
//         lines that arrived, and for each that left, whether the `.md` beside its min still
//         carries it verbatim (moved to the ref tier) or not. a min is a compression of its
//         `.md`, so a line not verbatim there is most often a reword of a `.md` passage, and a
//         reader settles each one; the census proposes, a read disposes.
//
// .why  = a cue rewrite is honest only if each cue that left the say tier is still on record in
//         the ref tier. a bare `diff` names the lines and cannot say which were moved and which
//         were lost; that sort is a set membership per line, so it is computed, never guessed.
//
// usage:
//   rhx census.cuesdiff --before .census/cues.before.txt --after .census/cues.after.txt
//   rhx census.cuesdiff --before ... --after ... --lines     # list each line that left or arrived
//
// exit: 0 on a report (it never gates) · 2 on bad input (an absent --before or --after file).
const fs = require('fs');

const argv = process.argv.slice(2);
const asFlag = (name) => (argv.indexOf(name) >= 0 ? argv[argv.indexOf(name) + 1] : null);
const before = asFlag('--before');
const after = asFlag('--after');
const wantLines = argv.includes('--lines');

if (!before || !after || !fs.existsSync(before) || !fs.existsSync(after)) {
  console.error('✋ ConstraintError: needs a --before and an --after file that exist');
  console.error('   └─ usage: --before <emit file> --after <emit file> [--lines]');
  process.exit(2);
}

// the `<file>\t<line>` rows of one emit file; the skill header line has no tab, so it drops
const getAllRowsOfFile = (input) =>
  fs.readFileSync(input.file, 'utf8').split('\n').filter((row) => row.includes('\t'));

// rows as a multiset key → count, so a line repeated in one min is counted each time
const asCounts = (rows) => rows.reduce((acc, row) => acc.set(row, (acc.get(row) ?? 0) + 1), new Map());
const asRowsOnlyIn = (input) =>
  [...input.from.entries()].flatMap(([row, count]) =>
    Array(Math.max(0, count - (input.not.get(row) ?? 0))).fill(row),
  );

const countsBefore = asCounts(getAllRowsOfFile({ file: before }));
const countsAfter = asCounts(getAllRowsOfFile({ file: after }));
const rowsLeft = asRowsOnlyIn({ from: countsBefore, not: countsAfter });
const rowsArrived = asRowsOnlyIn({ from: countsAfter, not: countsBefore });

// a line that left is moved if the `.md` beside its min carries it, trimmed; else lost
const mdLinesByMin = new Map();
const isOnRecordInMd = (row) => {
  const [min, line] = row.split('\t');
  const md = min.replace(/\.min$/, '');
  if (!mdLinesByMin.has(md))
    mdLinesByMin.set(
      md,
      new Set(fs.existsSync(md) ? fs.readFileSync(md, 'utf8').split('\n').map((l) => l.trim()) : []),
    );
  return mdLinesByMin.get(md).has(line.trim());
};
const rowsMoved = rowsLeft.filter(isOnRecordInMd);
const rowsLost = rowsLeft.filter((row) => !isOnRecordInMd(row));

console.log('🦉 census.cuesdiff — the cue lines that left the say tier, and where they went');
console.log('');
console.log('📜 census.cuesdiff');
console.log(`   ├─ left:    ${rowsLeft.length}`);
console.log(`   │  ├─ moved, on record in the .md: ${rowsMoved.length}`);
console.log(`   │  └─ not verbatim in the .md:     ${rowsLost.length}  (read each: a reword, or a loss)`);
console.log(`   └─ arrived: ${rowsArrived.length}`);
if (wantLines) {
  [['moved', rowsMoved], ['unverbatim', rowsLost], ['arrived', rowsArrived]].forEach(([label, rows]) =>
    rows.forEach((row) => console.log(`${label}\t${row}`)),
  );
}
