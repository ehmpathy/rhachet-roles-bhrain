#!/usr/bin/env node
// .what = census the cue share of a glob set of briefs: per file, the chars that are CUE
//         lines and the chars that are ARGUMENT lines. or emit every cue line, for a
//         before/after diff.
//
// .why  = `rule.prefer.rules-that-refout` says a rule keeps its cue at say and refs out its
//         argument, and names the classifier: cue = a table row · a blockquote · a bullet ·
//         a 👎/👍 header · an enforcement line; argument = each other line. a boot budget set
//         without that split is a guess at how far a cue-only rewrite can shrink a min.
//         and a cue-only rewrite of many files by hand can drop a row silently — the boot
//         still passes, under budget. `--emit` lists every cue line so a census taken
//         before the rewrite and one taken after can be diffed, and a dropped line is named.
//
// .note = the classifier is a line heuristic, and it says so. fenced code counts as cue (a
//         shape or a demo pair is read at the act). a header counts as cue (structure a reader
//         scans). prose paragraphs count as argument — a one-line claim that is not a
//         blockquote among them, which this heuristic undercounts. so `cue%` is a FLOOR on
//         what must stay. the estimate of tokens is chars/4, as `census.tokens` uses.
//
// usage:
//   rhx census.cues --glob 'src/domain.roles/learner/briefs/*.md.min'
//   rhx census.cues --glob 'src/domain.roles/learner/briefs/*.md.min' --files
//   rhx census.cues --glob 'src/domain.roles/learner/briefs/*.md.min' --emit | rhx teesafe .temp/cues.before.txt
//
// flags:
//   --glob <pattern>  a set of briefs to census; repeat it to union several sets
//   --files           add one row per file (its cue share and size), above the total
//   --emit            print every cue line as `<file>\t<line>`, no report — for a before/after diff
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

// the one cue classifier, a shipped transformer that the boot clamp test imports too
// .note = it is typescript; the `.sh` runs this file via `tsx`, so the require reads the source
const { asBriefLinesByCue } = require(
  path.join(__dirname, '../../../../src/domain.operations/learn/asBriefLinesByCue.ts'),
);

// the chars a set of lines costs, each with its newline
const asCharsOfLines = (lines) => lines.reduce((sum, line) => sum + line.length + 1, 0);

// sort one file's lines into cue and argument
const getOneFileCensus = (input) => {
  const sorted = asBriefLinesByCue({ text: fs.readFileSync(input.file, 'utf8') });
  return {
    file: input.file,
    cueChars: asCharsOfLines(sorted.cueLines),
    argChars: asCharsOfLines(sorted.argLines),
    cueLines: sorted.cueLines,
  };
};

const files = getAllFilesFromGlobs({ globs, skill: 'census.cues' });
const censuses = files.map((file) => getOneFileCensus({ file }));

// emit mode: one cue line per row, prefixed by its file, for a before/after diff
if (wantEmit) {
  for (const census of censuses)
    for (const line of census.cueLines) console.log(`${census.file}\t${line.trim()}`);
  // .note = return, never process.exit: an exit truncates stdout that a pipe has not drained
  return;
}

// report mode: per file (optional), then the total
const asTokens = (chars) => Math.round(chars / 4).toLocaleString('en-US');
const asShare = (part, whole) => (whole === 0 ? '0%' : `${Math.round((100 * part) / whole)}%`);
const totalCue = censuses.reduce((sum, census) => sum + census.cueChars, 0);
const totalArg = censuses.reduce((sum, census) => sum + census.argChars, 0);

console.log('🦉 census.cues — cue vs argument, per rule.prefer.rules-that-refout');
console.log('');
console.log(`📜 census.cues (${files.length} files, ~tokens = chars/4, an estimate)`);
if (wantFiles)
  for (const census of censuses)
    console.log(
      `   ├─ cue ${asShare(census.cueChars, census.cueChars + census.argChars).padStart(4)} · ` +
        `~${asTokens(census.cueChars)} cue / ~${asTokens(census.cueChars + census.argChars)} all  ` +
        `${path.basename(census.file)}`,
    );
console.log(
  `   └─ total: cue ${asShare(totalCue, totalCue + totalArg)} · ~${asTokens(totalCue)} cue ` +
    `+ ~${asTokens(totalArg)} argument = ~${asTokens(totalCue + totalArg)}`,
);
