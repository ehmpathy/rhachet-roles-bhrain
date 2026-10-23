import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { getOneGuardTemplatePathOrNull } from './getOneGuardTemplatePathOrNull';

/**
 * .what = integration tests for the guard template real-path lookup
 * .why = an absent template is a decision value, so ENOENT and ENOTDIR must both read
 *        as null over real files, never surface as a raw stack
 */
describe('getOneGuardTemplatePathOrNull.integration', () => {
  const scene = useBeforeAll(async () => {
    const cwd = path.join(
      os.tmpdir(),
      `int-guard-template-path-${Date.now()}-${process.pid}`,
    );
    await fs.mkdir(cwd, { recursive: true });
    await fs.writeFile(path.join(cwd, 'review.guard'), 'reviews: []\n');
    return { cwd: await fs.realpath(cwd) };
  });

  afterAll(async () => {
    await fs.rm(scene.cwd, { recursive: true, force: true });
  });

  given('[case1] a template that is present', () => {
    when('[t0] its real path is asked for', () => {
      then('it returns the real path', async () => {
        const at = path.join(scene.cwd, 'review.guard');
        expect(await getOneGuardTemplatePathOrNull({ path: at })).toEqual(at);
      });
    });
  });

  given('[case2] a template that is absent (ENOENT)', () => {
    when('[t0] its real path is asked for', () => {
      then('it returns null', async () => {
        const at = path.join(scene.cwd, 'absent.guard');
        expect(await getOneGuardTemplatePathOrNull({ path: at })).toBeNull();
      });
    });
  });

  given('[case3] a template path whose parent is a file (ENOTDIR)', () => {
    when('[t0] its real path is asked for', () => {
      then('it returns null, never a raw stack', async () => {
        const at = path.join(scene.cwd, 'review.guard', 'child.guard');
        expect(await getOneGuardTemplatePathOrNull({ path: at })).toBeNull();
      });
    });
  });
});
