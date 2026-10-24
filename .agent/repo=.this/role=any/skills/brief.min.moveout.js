#!/usr/bin/env node
// .what = move the argument-only `## .why…` sections out of a glob set of `.md.min` briefs.
//         plan lists each section; apply drops it from the min. the `.md` beside each min
//         already holds the full argument, so the section is moved, never lost.
//
// .why  = `rule.prefer.rules-that-refout` says a rule boots its cue and refs out its argument,
//         and a `.why` section is the case FOR a cue, read once, by a reader who disputes it.
//         a min that keeps one pays it on every boot. by hand, the move across many mins
//         drops a cue or misses a section; one walk names each section it moves.
//
// .note = a section that holds any cue line, per the one shared classifier
//         (`src/domain.operations/learn/asBriefLinesByCue.ts`: a table row, a blockquote, a bullet,
//         a fence, an enforcement line), is HELD, never cut — move such a section by hand.
//         a section whose header is absent from the `.md` is held too: it may have no home there.
//         a symlinked min is skipped (its source is edited where it lives), and so is a min with
//         no `.md` beside it. a `#` inside a fence never ends a section.
//
// usage:
//   rhx brief.min.moveout --glob 'src/domain.roles/learner/briefs/rule.*.md.min'
//   rhx brief.min.moveout --glob 'src/domain.roles/learner/briefs/rule.*.md.min' --mode apply
//
// flags:
//   --glob <pattern>      a set of mins; repeat it to union several sets
//   --mode plan|apply     plan (default) lists; apply rewrites each min
//
// exit: 0 on success · 2 on bad input (no --glob, an unknown --mode, or a glob that names no file).
const fs = require('fs');
const path = require('path');
const { getAllFilesFromGlobs } = require('./glob.files.lib.js');
const { asBriefLinesByCue } = require(
  path.join(__dirname, '../../../../src/domain.operations/learn/asBriefLinesByCue.ts'),
);
const { asLinesWithFenceState } = require(
  path.join(__dirname, '../../../../src/domain.operations/learn/asLinesWithFenceState.ts'),
);

const argv = process.argv.slice(2);
const globs = argv.reduce((acc, arg, index) => {
  if (arg === '--glob' && argv[index + 1]) acc.push(argv[index + 1]);
  return acc;
}, []);
const modeIndex = argv.indexOf('--mode');
const mode = modeIndex >= 0 ? argv[modeIndex + 1] : 'plan';

if (globs.length === 0 || !['plan', 'apply'].includes(mode)) {
  console.error('✋ ConstraintError: needs one --glob, and a --mode of plan or apply');
  console.error('   └─ usage: --glob <pattern> [--glob <pattern> ...] [--mode plan|apply]');
  process.exit(2);
}

// a `.why` section opens at a level-2 header that names `.why`, or the peer `.the two arguments`
const isWhyHeader = (line) => /^## .*(\.why\b|\.the two arguments)/.test(line);
const isSectionEnd = (line) => /^#{1,2} /.test(line);

// mark each line with whether it sits inside a fence (a fence mark counts as inside)
const asLinesWithFence = (text) =>
  asLinesWithFenceState({ text }).map((entry) => ({
    line: entry.line,
    fenced: entry.inFence || entry.isFence,
  }));

// split one min into its why-sections, each as the index range it spans
const asWhySections = (marked) =>
  marked.reduce(
    (acc, entry, index) => {
      if (!entry.fenced && isWhyHeader(entry.line))
        return { open: index, sections: acc.open === null ? acc.sections : [...acc.sections, { from: acc.open, to: index }] };
      if (acc.open !== null && !entry.fenced && isSectionEnd(entry.line))
        return { open: null, sections: [...acc.sections, { from: acc.open, to: index }] };
      return acc;
    },
    { open: null, sections: [] },
  );

const files = getAllFilesFromGlobs({ globs, skill: 'brief.min.moveout' }).filter((f) => f.endsWith('.md.min'));
const tally = files.reduce(
  (acc, file) => {
    // skip a symlink (its source is edited where it lives) and a min with no `.md` beside it
    const mdPath = file.replace(/\.min$/, '');
    if (fs.lstatSync(file).isSymbolicLink()) return acc;
    if (!fs.existsSync(mdPath)) return acc;
    const mdText = fs.readFileSync(mdPath, 'utf8');

    const text = fs.readFileSync(file, 'utf8');
    const lines = text.split('\n');
    const marked = asLinesWithFence(text);
    const split = asWhySections(marked);
    const sections = [
      ...split.sections,
      ...(split.open === null ? [] : [{ from: split.open, to: lines.length }]),
    ].map((range) => ({ ...range, lines: lines.slice(range.from, range.to) }));
    if (sections.length === 0) return acc;

    // a section with a cue line, or with any body line the `.md` lacks verbatim, stays; the rest
    // move out. a move deletes text, so it is safe only where the `.md` already holds every line
    const mdLines = new Set(mdText.split('\n').map((line) => line.trim()));
    const asReasonHeld = (section) => {
      const body = section.lines.slice(1);
      if (asBriefLinesByCue({ text: body.join('\n') }).cueLines.length > 0) return 'a cue line';
      const absent = body.map((line) => line.trim()).filter((line) => line !== '' && !mdLines.has(line));
      if (absent.length > 0) return `${absent.length} body line(s) absent from the .md`;
      return null;
    };
    const sectionsHeld = sections.filter((s) => asReasonHeld(s) !== null);
    const sectionsMoved = sections.filter((s) => asReasonHeld(s) === null);
    sectionsMoved.forEach((s) => {
      console.log(`${mode === 'apply' ? 'moved' : 'would move'}  ${file}  ${s.lines[0]}  (${s.lines.length} lines)`);
    });
    sectionsHeld.forEach((s) => {
      console.log(`held (${asReasonHeld(s)})  ${file}  ${s.lines[0]}`);
    });

    // rebuild the min: drop the moved ranges, keep all else where it sat
    if (mode === 'apply' && sectionsMoved.length > 0) {
      const dropped = new Set(sectionsMoved.flatMap((s) => Array.from({ length: s.to - s.from }, (_, i) => s.from + i)));
      fs.writeFileSync(file, lines.filter((_, index) => !dropped.has(index)).join('\n'));
    }
    return { moved: acc.moved + sectionsMoved.length, held: acc.held + sectionsHeld.length };
  },
  { moved: 0, held: 0 },
);

console.log(`\n${mode === 'apply' ? 'moved' : 'would move'} ${tally.moved} sections · held ${tally.held}`);
