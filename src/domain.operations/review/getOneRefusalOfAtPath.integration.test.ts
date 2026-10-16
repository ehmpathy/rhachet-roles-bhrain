import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getOneRefusalOfAtPath } from '@src/domain.operations/review/getOneRefusalOfAtPath';

/**
 * .what = integration tests for the `--at` path refusal of the cost breadths
 * .why = a typo'd or stale `--at` must refuse with the fix that names it, over real
 *        paths, never read as a tree that has yet to run a review
 */
describe('getOneRefusalOfAtPath.integration', () => {
  const scene = useBeforeAll(async () => {
    const cwd = path.join(
      os.tmpdir(),
      `int-refusal-of-at-${Date.now()}-${process.pid}`,
    );
    await fs.mkdir(cwd, { recursive: true });
    await fs.writeFile(path.join(cwd, 'afile.md'), 'hi\n');
    return { cwd };
  });

  afterAll(async () => {
    await fs.rm(scene.cwd, { recursive: true, force: true });
  });

  given('[case1] an --at that names a directory', () => {
    when('[t0] it is checked', () => {
      then('it earns no refusal', async () => {
        expect(await getOneRefusalOfAtPath({ at: scene.cwd })).toBeNull();
      });
    });
  });

  given('[case2] an --at that is not there', () => {
    when('[t0] it is checked', () => {
      then('it refuses as an absent directory', async () => {
        const at = path.join(scene.cwd, 'absent');
        expect(await getOneRefusalOfAtPath({ at })).toEqual({
          headline: `--at names a directory that is not there: ${at}`,
          fix: 'check the --at path, then point it at a tree where reviews ran',
        });
      });
    });
  });

  given('[case3] an --at that names a file', () => {
    when('[t0] it is checked', () => {
      then('it refuses and names the dir that holds it', async () => {
        const at = path.join(scene.cwd, 'afile.md');
        expect(await getOneRefusalOfAtPath({ at })).toEqual({
          headline: `--at names a file, not a directory: ${at}`,
          fix: `point --at at the directory that holds it: ${scene.cwd}`,
        });
      });
    });
  });
});
