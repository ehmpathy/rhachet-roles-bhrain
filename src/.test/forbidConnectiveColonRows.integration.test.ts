import * as fs from 'node:fs';
import * as path from 'node:path';
import { given, then, when } from 'test-fns';

/**
 * .what = clamp: no snapshot body under src/ or blackbox/ holds a tree row that opens on a
 *         connective or a hint word with a colon — `├─ or: …`, `└─ tip: …`, `└─ hint: …`
 * .why = a colon after a connective reads as a key with a value, where no key exists: `or:`
 *        is a word of a sentence, never a field. and a `tip:`, `hint:`, or `note:` row is
 *        guidance mixed into the verdict tree — a next move renders as its own
 *        `✨ did you know?` block (rule.require.coconut-hints). a snapshot pins what stdout and
 *        stderr print, so a scan of snapshot bodies is a scan of every rendered surface a test
 *        covers
 *
 * .note = plain `key: value` rows (`corpus: <path>`, `received: x`) are fields, not this, so
 *         the pattern names the forbidden words alone
 * .note = a filesystem read, so it is an integration test (rule.forbid.unit.remote-boundaries)
 */
const ROOT_OF_REPO = path.join(__dirname, '../..');

/** .what = a tree row that opens on a connective or a hint word, then a colon */
const PATTERN_OF_ROW_FORBIDDEN =
  /[├└]─ (or|and|then|also|tip|note|hint|e\.g\.): /;

/** .what = the trees the ban governs, relative to the repo root */
const DIRS_OF_SCOPE = ['src', 'blackbox'];

/** .what = dir names never walked — installs and build output, not authored here */
const DIRS_SKIPPED = new Set(['node_modules', 'dist', '.log', '.temp']);

/** .what = every snapshot file under a dir, recursively; symlinks and skipped dirs left out */
const getAllSnapshotsUnder = (input: { dir: string }): string[] => {
  if (!fs.existsSync(input.dir)) return [];
  return fs
    .readdirSync(input.dir, { withFileTypes: true })
    .filter((entry) => !DIRS_SKIPPED.has(entry.name))
    .flatMap((entry) => {
      const at = path.join(input.dir, entry.name);
      if (entry.isDirectory()) return getAllSnapshotsUnder({ dir: at });
      const isSnapshot =
        entry.isFile() &&
        entry.name.endsWith('.snap') &&
        path.basename(input.dir) === '__snapshots__';
      return isSnapshot ? [at] : [];
    });
};

/** .what = each `file:line` within one text that holds a forbidden row */
const getAllRowHitsOfText = (input: {
  text: string;
  relative: string;
}): string[] =>
  input.text
    .split('\n')
    .map((line, index) => ({ line, at: index + 1 }))
    .filter((one) => PATTERN_OF_ROW_FORBIDDEN.test(one.line))
    .map((one) => `${input.relative}:${one.at}`);

describe('forbidConnectiveColonRows.integration', () => {
  given('[case1] the matcher, against rows it must and must not flag', () => {
    when('[t0] each row is read', () => {
      then('it flags a connective or a hint word with a colon', () => {
        const hits = getAllRowHitsOfText({
          relative: 'sample',
          text: [
            '   ├─ or: narrow its bind — yours to make',
            '   └─ tip: claim each domain whole',
            '   │  └─ hint: run with --help',
            '   ├─ note: --paths-wout narrows the bind',
            '   └─ e.g.: src/route/**',
          ].join('\n'),
        });
        expect(hits).toEqual([
          'sample:1',
          'sample:2',
          'sample:3',
          'sample:4',
          'sample:5',
        ]);
      });

      then('it leaves a key with a value, and a colon-free connective', () => {
        const hits = getAllRowHitsOfText({
          relative: 'sample',
          text: [
            '   ├─ corpus: .log/x',
            '   ├─ received: since-moon',
            '   ├─ or narrow its bind — yours to make',
            '   └─ order: by round',
          ].join('\n'),
        });
        expect(hits).toEqual([]);
      });
    });
  });

  given('[case2] every snapshot body under the trees the ban governs', () => {
    const files = DIRS_OF_SCOPE.flatMap((dir) =>
      getAllSnapshotsUnder({ dir: path.join(ROOT_OF_REPO, dir) }),
    );

    when('[t0] each is read for a forbidden row', () => {
      then('the walk found snapshots to read', () => {
        expect(files.length).toBeGreaterThan(50);
      });

      then('no snapshot body holds one', () => {
        const hits = files.flatMap((file) =>
          getAllRowHitsOfText({
            text: fs.readFileSync(file, 'utf8'),
            relative: path.relative(ROOT_OF_REPO, file),
          }),
        );
        expect(hits).toEqual([]);
      });
    });
  });
});
