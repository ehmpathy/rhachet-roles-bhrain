#!/usr/bin/env node
// .what = for each `X.md.min` in a glob set, list the lines of the min that do NOT appear
//         verbatim (trimmed) in the `X.md` beside it.
//
// .why  = a min is the say tier and its `.md` is the ref tier. a line may leave a min only if
//         its `.md` still carries it, and a cue kept in a min drifts silently if its `.md`
//         changes and the min does not. both checks reduce to one question per line: is this
//         line in the `.md`? the answer is a set membership, so it is computed, never guessed.
//
// usage:
//   rhx census.minpeer --glob 'src/domain.roles/learner/briefs/*.md.min'
//   rhx census.minpeer --glob '...' --files      # one row per min: absent / total
//   rhx census.minpeer --glob '...' --emit       # one row per absent line, for a diff
//
// flags:
//   --glob <pattern>  a set of `.md.min` files to check; repeat it to union several sets
//   --files           add one row per min (absent lines / total, or `no .md peer`)
//   --emit            print every absent line as `<min>\t<line>`, no report — for a diff
//
// exit: 0 on a report (it never gates) · 2 on bad input (no --glob).

const fs = require('fs');
const path = require('path');

const argv = process.argv.slice(2);
const globs = argv.reduce((acc, arg, index) => {
  if (arg === '--glob' && argv[index + 1]) acc.push(argv[index + 1]);
  return acc;
}, []);
const wantFiles = argv.includes('--files');
const wantEmit = argv.includes('--emit');

if (globs.length === 0) {
  console.error('✋ ConstraintError: no --glob given');
  console.error('   └─ usage: --glob <pattern> [--glob <pattern> ...] [--files] [--emit]');
  process.exit(2);
}

// the one glob expansion the census and moveout skills share; a glob set that names no file halts
const { getAllFilesFromGlobs } = require('./glob.files.lib.js');

// the trimmed, nonblank lines of a file, as a set and a list
const getAllLinesOfFile = (input) =>
  fs
    .readFileSync(input.file, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line !== '' && !/^```/.test(line) && !/^\|[-|\s:]+\|$/.test(line));

// one min's census: which of its lines its `.md` lacks
const getOneMinCensus = (input) => {
  const peer = input.file.replace(/\.min$/, '');
  if (!fs.existsSync(peer)) return { file: input.file, peer: null, total: 0, absent: [] };
  const peerLines = new Set(getAllLinesOfFile({ file: peer }));
  const lines = getAllLinesOfFile({ file: input.file });
  return { file: input.file, peer, total: lines.length, absent: lines.filter((line) => !peerLines.has(line)) };
};

const files = getAllFilesFromGlobs({ globs, skill: 'census.minpeer' }).filter((file) => file.endsWith('.md.min'));
const censuses = files.map((file) => getOneMinCensus({ file }));

// emit mode: one absent line per row, prefixed by its min
if (wantEmit) {
  for (const census of censuses) {
    if (!census.peer) console.log(`${census.file}\t<no .md peer>`);
    for (const line of census.absent) console.log(`${census.file}\t${line}`);
  }
  // .note = return, never process.exit: an exit truncates stdout that a pipe has not drained
  return;
}

// report mode
const totalLines = censuses.reduce((sum, census) => sum + census.total, 0);
const totalAbsent = censuses.reduce((sum, census) => sum + census.absent.length, 0);
console.log('🦉 census.minpeer — min lines absent from the .md beside them');
console.log('');
console.log(`📜 census.minpeer (${files.length} mins)`);
if (wantFiles)
  for (const census of censuses)
    console.log(
      `   ├─ ${census.peer ? `${String(census.absent.length).padStart(3)} / ${String(census.total).padStart(3)} absent` : 'no .md peer   '}  ${path.basename(census.file)}`,
    );
console.log(`   └─ total: ${totalAbsent} of ${totalLines} min lines absent from their .md`);
