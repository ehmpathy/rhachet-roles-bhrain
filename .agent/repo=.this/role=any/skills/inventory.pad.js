/**
 * .what = pad the numeric ordinal of each `case=` entry of one inventory dir to a fixed width:
 *         `case=S1-slug.md` → `case=S001-slug.md`, and the same id in the summary's table rows
 *         and each entry's H1 line
 * .why  = an unpadded ordinal sorts `F10` before `F9`, so a name sort loses the sequence the
 *         ordinal exists to keep (librarian `rule.forbid.itemization-without-coordinates`); a
 *         rename by hand across a set and its summary is the tactic this replaces
 *
 * usage:
 *   rhx inventory.pad --dir .behavior/<route>/.seeds                 # plan: print each rename
 *   rhx inventory.pad --dir .behavior/<route>/.seeds --mode apply    # rename and rewrite
 *   rhx inventory.pad --dir <dir> --width 4                          # a set past 999 entries
 *
 * guarantee:
 *   - plan by default; no file moves until `--mode apply`
 *   - rewrites an id only in a summary's `|` table rows and an entry's first `# ` line, never
 *     in the body, so a seed's verbatim `.said` stays untouched
 *   - idempotent: a padded entry is left as is, so a rerun converges
 *   - exit 2 on bad input (no --dir, a dir that does not exist, a width under 1, an unknown flag)
 */
const fs = require('node:fs');
const path = require('node:path');

// fail with the caller's fix named
const failConstraint = (message, fix) => {
  process.stderr.write(`✋ ConstraintError: inventory.pad: ${message}\n   └─ fix: ${fix}\n`);
  process.exit(2);
};

// read the flags
const args = process.argv.slice(2);
const flags = { dir: null, width: 3, mode: 'plan' };
for (let index = 0; index < args.length; index += 1) {
  const flag = args[index];
  const value = args[index + 1];
  if (flag === '--help' || flag === '-h') {
    process.stdout.write(
      [
        '🦉 inventory.pad — pad the case= ordinals of one inventory dir',
        '   ├─ usage: rhx inventory.pad --dir <dir> [--width 3] [--mode plan|apply]',
        '   ├─ --dir    the dir that holds the inventory summary and its entries (required)',
        '   ├─ --width  the least digit count (default 3)',
        '   ├─ --mode   plan prints the renames (default); apply makes them',
        '   └─ example: rhx inventory.pad --dir .behavior/<route>/.fulcrums --mode apply',
        '',
      ].join('\n'),
    );
    process.exit(0);
  }
  if (!value) failConstraint(`flag ${flag} has no value`, 'pass a value after each flag');
  if (flag === '--dir') flags.dir = value;
  else if (flag === '--width') flags.width = Number(value);
  else if (flag === '--mode') flags.mode = value;
  else if (['--skill', '--repo', '--role'].includes(flag)) {
    // the flags rhx passes to name the skill it ran
  } else failConstraint(`unknown flag ${flag}`, 'see rhx inventory.pad --help');
  index += 1;
}
if (!flags.dir) failConstraint('no --dir named', 'rhx inventory.pad --dir <dir>');
if (!fs.existsSync(flags.dir) || !fs.statSync(flags.dir).isDirectory())
  failConstraint(`--dir ${flags.dir} is not a dir`, 'name the dir that holds the inventory');
if (!Number.isInteger(flags.width) || flags.width < 1)
  failConstraint(`--width ${flags.width} is not a whole number of 1 or more`, '--width 3');
if (!['plan', 'apply'].includes(flags.mode))
  failConstraint(`--mode ${flags.mode} is neither plan nor apply`, '--mode plan or --mode apply');

// find each entry whose ordinal is short of the width
const entryPattern = /(case=)([A-Z]+)(\d+)(-)/;
const names = fs.readdirSync(flags.dir).filter((name) => name.endsWith('.md'));
const renames = names
  .map((name) => {
    const match = name.match(entryPattern);
    if (!match) return null;
    const [, , prefix, digits] = match;
    if (digits.length >= flags.width) return null;
    const idFrom = `${prefix}${digits}`;
    const idInto = `${prefix}${digits.padStart(flags.width, '0')}`;
    return { nameFrom: name, nameInto: name.replace(entryPattern, `$1${idInto}$4`), idFrom, idInto };
  })
  .filter(Boolean);

// rewrite whole-word ids in one line
const asLineWithIdsPadded = (line) =>
  renames.reduce(
    (text, rename) => text.replace(new RegExp(`\\b${rename.idFrom}\\b`, 'g'), rename.idInto),
    line,
  );

// report the plan
process.stdout.write(`🦉 inventory.pad --dir ${flags.dir} --mode ${flags.mode}\n`);
if (renames.length === 0) {
  process.stdout.write('   └─ every ordinal holds its width; none to pad\n');
  process.exit(0);
}
renames.forEach((rename, index) => {
  const glyph = index === renames.length - 1 ? '└─' : '├─';
  process.stdout.write(`   ${glyph} ${rename.nameFrom} → ${rename.nameInto}\n`);
});
if (flags.mode === 'plan') {
  process.stdout.write('\n🥥 run with --mode apply to rename and rewrite the ids\n');
  process.exit(0);
}

// rename each entry, then pad the id in its first H1 line
for (const rename of renames) {
  const pathInto = path.join(flags.dir, rename.nameInto);
  fs.renameSync(path.join(flags.dir, rename.nameFrom), pathInto);
  const lines = fs.readFileSync(pathInto, 'utf8').split('\n');
  const indexOfHeader = lines.findIndex((line) => line.startsWith('# '));
  if (indexOfHeader >= 0) lines[indexOfHeader] = asLineWithIdsPadded(lines[indexOfHeader]);
  fs.writeFileSync(pathInto, lines.join('\n'));
}

// pad the ids in each summary's table rows
const summaries = fs.readdirSync(flags.dir).filter((name) => name.endsWith('._.md'));
for (const summary of summaries) {
  const pathSummary = path.join(flags.dir, summary);
  const text = fs
    .readFileSync(pathSummary, 'utf8')
    .split('\n')
    .map((line) => (line.startsWith('|') ? asLineWithIdsPadded(line) : line))
    .join('\n');
  fs.writeFileSync(pathSummary, text);
}
process.stdout.write(`\n✨ ${renames.length} entries padded; ${summaries.length} summary rewritten\n`);
