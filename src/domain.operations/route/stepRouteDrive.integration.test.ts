import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { stepRouteDrive } from './stepRouteDrive';

/**
 * .what = integration tests for stepRouteDrive
 * .why = verifies GPS-like guidance with real filesystem
 *
 * .note = tests pass route param directly to avoid bind conflicts
 *         (all tests run in same git repo context)
 */
describe('stepRouteDrive.integration', () => {
  given('[case1] route with unpassed stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case1', git: true });

      // create route structure (stones use .stone extension, not .stone.md)
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- feature works',
      );

      return { tempDir };
    });

    when('[t0] stepRouteDrive is called', () => {
      const result = useThen('returns current stone', async () =>
        stepRouteDrive({ route: scene.tempDir }),
      );

      then('emit is not null', () => {
        expect(result.emit).not.toBeNull();
      });

      then('stdout contains stone name', () => {
        expect(result.emit?.stdout).toContain('1');
      });

      then('stdout contains stone content', () => {
        expect(result.emit?.stdout).toContain('feature works');
      });

      then('stdout contains pass command', () => {
        expect(result.emit?.stdout).toContain('--as passed');
      });
    });
  });

  given('[case2] route with all stones passed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case2', git: true });

      // create route structure
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.stone'),
        '# stone: implement\n\ndone when:\n- feature works',
      );

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.i1.md'),
        '# implementation\n\nfeature implemented.',
      );

      // mark as passed
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(path.join(tempDir, '.route', '1.passed'), '');

      return { tempDir };
    });

    when('[t0] stepRouteDrive is called in direct mode', () => {
      const result = useThen('returns route complete', async () =>
        stepRouteDrive({ route: scene.tempDir }),
      );

      then('emit is not null', () => {
        expect(result.emit).not.toBeNull();
      });

      then('stdout shows route complete', () => {
        expect(result.emit?.stdout.toLowerCase()).toContain('complete');
      });
    });

    when('[t1] stepRouteDrive is called in hook mode', () => {
      const result = useThen('returns null emit', async () =>
        stepRouteDrive({ route: scene.tempDir, mode: 'hook' }),
      );

      then('emit is null (silent)', () => {
        expect(result.emit).toBeNull();
      });
    });
  });

  given('[case3] empty route (no stones)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'drive-int-case3', git: true });

      // create just a wish, no stones
      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );

      return { tempDir };
    });

    when('[t0] stepRouteDrive is called', () => {
      const result = useThen('returns route complete', async () =>
        stepRouteDrive({ route: scene.tempDir }),
      );

      then('shows route complete (no stones to pass)', () => {
        expect(result.emit?.stdout.toLowerCase()).toContain('complete');
      });
    });
  });
});
