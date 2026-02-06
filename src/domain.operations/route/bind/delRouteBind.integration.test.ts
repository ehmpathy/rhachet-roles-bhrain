import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { delRouteBind } from './delRouteBind';

describe('delRouteBind', () => {
  given('[case1] branch has a bind flag', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create temp git repo with route dir and flag file (ci-safe)
      tempDir = genTempDir({ slug: 'test-bind-del-bound', git: true });
      const routeStateDir = path.join(tempDir, 'my-route', '.route');
      await fs.mkdir(routeStateDir, { recursive: true });
      execSync('git checkout -b vlad/test-del', { cwd: tempDir });

      await fs.writeFile(
        path.join(routeStateDir, '.bind.vlad.test-del.flag'),
        'branch: vlad/test-del\nbound_by: route.bind skill\n',
      );
    });

    when('[t0] delRouteBind is called', () => {
      then('removes flag file and returns deleted: true', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await delRouteBind();
          expect(result.deleted).toBe(true);

          // verify flag file removed
          const flagPath = path.join(
            tempDir,
            'my-route',
            '.route',
            '.bind.vlad.test-del.flag',
          );
          const flagPresent = await fs
            .access(flagPath)
            .then(() => true)
            .catch(() => false);
          expect(flagPresent).toBe(false);
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case2] branch has no bind flag', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create temp git repo without any bind flag (ci-safe)
      tempDir = genTempDir({ slug: 'test-bind-del-nobound', git: true });
      execSync('git checkout -b vlad/test-del-none', { cwd: tempDir });
    });

    when('[t0] delRouteBind is called', () => {
      then('returns deleted: false without error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await delRouteBind();
          expect(result.deleted).toBe(false);
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });
});
