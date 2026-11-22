import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { setRouteReminderHandleDir } from './setRouteReminderHandleDir';

/**
 * .what = integration cases for the handle dir findsert: the dir, and its self-ignore
 * .why = an unlinked repo would show every pid, log, and focus as untracked; the `*` `.gitignore`
 *        keeps them out of every diff. an extant `.gitignore` is the human's, and is kept
 */
describe('setRouteReminderHandleDir.integration', () => {
  given('[case1] a dir path that does not exist yet', () => {
    const scene = useBeforeAll(async () => {
      const parent = await fs.mkdtemp(
        path.join(os.tmpdir(), 'reminder-handle-dir-'),
      );
      return { dirPath: path.join(parent, 'a', 'b') };
    });

    when('[t0] the dir is set twice', () => {
      then('the dir exists, and ignores all it holds', async () => {
        await setRouteReminderHandleDir({ dirPath: scene.dirPath });
        await setRouteReminderHandleDir({ dirPath: scene.dirPath });
        expect(
          await fs.readFile(path.join(scene.dirPath, '.gitignore'), 'utf-8'),
        ).toEqual('*\n');
      });
    });
  });

  given('[case2] a dir that already holds its own .gitignore', () => {
    const scene = useBeforeAll(async () => {
      const dirPath = await fs.mkdtemp(
        path.join(os.tmpdir(), 'reminder-handle-dir-'),
      );
      await fs.writeFile(path.join(dirPath, '.gitignore'), '*.pid\n');
      return { dirPath };
    });

    when('[t0] the dir is set', () => {
      then('the extant .gitignore is kept as is', async () => {
        await setRouteReminderHandleDir({ dirPath: scene.dirPath });
        expect(
          await fs.readFile(path.join(scene.dirPath, '.gitignore'), 'utf-8'),
        ).toEqual('*.pid\n');
      });
    });
  });
});
