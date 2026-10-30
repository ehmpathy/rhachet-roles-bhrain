import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { asRouteStatusLinePointerPath } from '@src/domain.operations/route/statusLine/file/asRouteStatusLinePointerPath';

import { delRouteBind } from './delRouteBind';

describe('delRouteBind', () => {
  given('[case1] branch has a bind flag', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create temp git repo with route dir and flag file (ci-safe)
      tempDir = genTempDir({ slug: 'test-bind-del-bound', git: true });
      const routeStateDir = path.join(tempDir, 'my-route', '.route');
      await fs.mkdir(routeStateDir, { recursive: true });
      execSync('git checkout -b human/test-del', { cwd: tempDir });

      await fs.writeFile(
        path.join(routeStateDir, '.bind.human.test-del.flag'),
        'branch: human/test-del\nbound_by: route.bind skill\n',
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
            '.bind.human.test-del.flag',
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
      execSync('git checkout -b human/test-del-none', { cwd: tempDir });
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

  given(
    '[case3] a bound branch whose status line pointer cannot be dropped',
    () => {
      let tempDir: string;

      beforeEach(async () => {
        // a non-empty dir where the pointer belongs: its removal faults
        tempDir = genTempDir({ slug: 'test-bind-del-pointerfault', git: true });
        const routeStateDir = path.join(tempDir, 'my-route', '.route');
        await fs.mkdir(routeStateDir, { recursive: true });
        execSync('git checkout -b human/test-del-fault', { cwd: tempDir });
        await fs.writeFile(
          path.join(routeStateDir, '.bind.human.test-del-fault.flag'),
          'branch: human/test-del-fault\nbound_by: route.bind skill\n',
        );
        const pointerPath = asRouteStatusLinePointerPath({
          cwd: tempDir,
          branch: 'human/test-del-fault',
        });
        await fs.mkdir(path.join(pointerPath, 'blocker'), { recursive: true });
      });

      when('[t0] delRouteBind is called', () => {
        then(
          'the unbind lands, and one stderr row names the drop fault',
          async () => {
            const originalCwd = process.cwd();
            const errorSpy = jest.spyOn(console, 'error').mockImplementation();
            process.chdir(tempDir);
            try {
              const result = await delRouteBind();
              expect(result.deleted).toBe(true);
              const tempDirReal = await fs.realpath(tempDir);
              const rows = errorSpy.mock.calls
                .map((call) => String(call[0]))
                .map((row) =>
                  row
                    .split(tempDirReal)
                    .join('$REPO')
                    .split(tempDir)
                    .join('$REPO'),
                );
              expect(rows).toHaveLength(1);
              expect(rows).toMatchSnapshot();
            } finally {
              process.chdir(originalCwd);
              errorSpy.mockRestore();
            }
          },
        );
      });
    },
  );
});
