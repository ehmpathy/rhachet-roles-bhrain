import * as fs from 'node:fs';
import * as path from 'node:path';
import { given, then, when } from 'test-fns';

/**
 * .what = clamp: no snapshot body under src/ or blackbox/ carries the forbidden caution glyph U+26A0
 * .why = the glyph catalog forbids it in rendered output (it renders at 1 cell where every palette
 *        glyph renders at 2, so it kinks every column under it, and it is a second symbol for the
 *        one concept 🟡 already marks). a snapshot pins what stdout and stderr print, so a scan of
 *        snapshot bodies is a scan of every rendered surface a test covers. prose and comments
 *        may still name the glyph, which is why the scan reads snapshots alone
 *
 * .note = a filesystem read, so it is an integration test (rule.forbid.unit.remote-boundaries)
 * .note = the glyph is built from its codepoint, so this file never holds it
 */
const ROOT_OF_REPO = path.join(__dirname, '../..');

/** .what = the forbidden glyph, built from its codepoint */
const GLYPH_FORBIDDEN = String.fromCodePoint(0x26a0);

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

/** .what = each `file:line` within one snapshot that holds the forbidden glyph */
const getAllGlyphHitsOfFile = (input: { file: string }): string[] => {
  const text = fs.readFileSync(input.file, 'utf8');
  if (!text.includes(GLYPH_FORBIDDEN)) return [];
  const relative = path.relative(ROOT_OF_REPO, input.file);
  return text
    .split('\n')
    .map((line, index) => ({ line, at: index + 1 }))
    .filter((one) => one.line.includes(GLYPH_FORBIDDEN))
    .map((one) => `${relative}:${one.at}`);
};

describe('forbidWidthAmbiguousGlyph.integration', () => {
  given('[case1] every snapshot body under the trees the ban governs', () => {
    const files = DIRS_OF_SCOPE.flatMap((dir) =>
      getAllSnapshotsUnder({ dir: path.join(ROOT_OF_REPO, dir) }),
    );

    when('[t0] each is read for the forbidden glyph', () => {
      then('the walk found snapshots to read', () => {
        expect(files.length).toBeGreaterThan(50);
      });

      then('no snapshot body holds it', () => {
        const hits = files.flatMap((file) => getAllGlyphHitsOfFile({ file }));
        expect(hits).toEqual([]);
      });
    });
  });
});
