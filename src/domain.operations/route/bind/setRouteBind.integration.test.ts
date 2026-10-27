import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { asRouteStatusLineCachePath } from '@src/domain.operations/route/statusLine/cache/asRouteStatusLineCachePath';
import { asRouteStatusLinePointerPath } from '@src/domain.operations/route/statusLine/file/asRouteStatusLinePointerPath';
import { getOneRouteStatusLinePointer } from '@src/domain.operations/route/statusLine/file/getOneRouteStatusLinePointer';
import { MARK_OF_MULTI_BIND } from '@src/domain.operations/route/statusLine/file/MARK_OF_MULTI_BIND';

import { MESSAGE_OF_MULTI_BIND } from './MESSAGE_OF_MULTI_BIND';
import { setRouteBind } from './setRouteBind';

describe('setRouteBind', () => {
  given('[case1] valid route on a feature branch', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo with a route directory (ci-safe)
      tempDir = genTempDir({ slug: 'test-bind-set-valid', git: true });
      await fs.mkdir(path.join(tempDir, 'my-route'), { recursive: true });
      execSync('git checkout -b human/test-bind', { cwd: tempDir });
    });

    when('[t0] route dir found and branch is not protected', () => {
      then('creates flag file with correct format', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await setRouteBind({ route: 'my-route' });
          expect(result.route).toEqual('my-route');

          // verify flag file found
          const flagContent = await fs.readFile(result.flagPath, 'utf-8');
          expect(flagContent).toContain('branch: human/test-bind');
          expect(flagContent).toContain('bound_by: route.bind skill');

          // verify flag location
          expect(result.flagPath).toContain(
            path.join('my-route', '.route', '.bind.human.test-bind.flag'),
          );

          // the status file lands on bind, before any passage, and git must not see it
          const statusFilePath = path.join(
            'my-route',
            '.route',
            '.status.line.json',
          );
          expect(
            await fs.access(statusFilePath).then(
              () => true,
              () => false,
            ),
          ).toBe(true);
          const untracked = execSync('git status --porcelain -uall', {
            cwd: tempDir,
          }).toString();
          expect(untracked).not.toContain('.status.line.json');
          expect(untracked).toContain('.bind.human.test-bind.flag');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });

    when('[t1] same route bound a second time', () => {
      then('returns idempotent result without error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const resultFirst = await setRouteBind({ route: 'my-route' });
          const resultSecond = await setRouteBind({ route: 'my-route' });
          expect(resultSecond.route).toEqual(resultFirst.route);
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case2] route directory does not exist', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo without the route directory (ci-safe)
      tempDir = genTempDir({ slug: 'test-bind-set-nodir', git: true });
      execSync('git checkout -b human/test-nodir', { cwd: tempDir });
    });

    when('[t0] route path is absent', () => {
      then('throws error with path in message', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const error = await getError(
            setRouteBind({ route: 'nonexistent-route' }),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('route directory does not exist');
          expect(error.message).toContain('nonexistent-route');
          expect(error.message).toMatchSnapshot();
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case3] protected branch (main)', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo on main branch (ci-safe)
      tempDir = genTempDir({ slug: 'test-bind-set-protected', git: true });
      await fs.mkdir(path.join(tempDir, 'my-route'), { recursive: true });
      // genTempDir initializes on main branch by default, no checkout needed
    });

    when('[t0] branch is main', () => {
      then('throws protected branch error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const error = await getError(setRouteBind({ route: 'my-route' }));
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain(
            'cannot bind route on protected branch',
          );
          expect(error.message).toContain('switch to a feature branch first');
          expect(error.message).toMatchSnapshot();
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case4] different route already bound', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo with two route directories (ci-safe)
      tempDir = genTempDir({ slug: 'test-bind-set-conflict', git: true });
      await fs.mkdir(path.join(tempDir, 'route-a'), { recursive: true });
      await fs.mkdir(path.join(tempDir, 'route-b'), { recursive: true });
      execSync('git checkout -b human/test-conflict', { cwd: tempDir });
    });

    when('[t0] bind to route-a then attempt route-b', () => {
      then('throws already-bound error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          await setRouteBind({ route: 'route-a' });
          const error = await getError(setRouteBind({ route: 'route-b' }));
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('already bound to');
          expect(error.message).toContain('route-a');
          expect(error.message).toContain('route.bind --del');
          expect(error.message).toMatchSnapshot();
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case5] the status line cache cannot be dropped', () => {
    let tempDir: string;

    beforeEach(async () => {
      // the cache path is a non-empty dir, so a forced rm of it as a file still faults
      tempDir = genTempDir({ slug: 'test-bind-set-dropfault', git: true });
      await fs.mkdir(path.join(tempDir, 'my-route'), { recursive: true });
      execSync('git checkout -b human/test-dropfault', { cwd: tempDir });
      const cachePath = asRouteStatusLineCachePath({
        cwd: tempDir,
        branch: 'human/test-dropfault',
      });
      await fs.mkdir(path.join(cachePath, 'blocker'), { recursive: true });
    });

    when('[t0] the route is bound', () => {
      then('the bind lands and the drop fault warns on stderr', async () => {
        const originalCwd = process.cwd();
        // .spy = console.error, silenced to capture the warn rows; the git/fs work stays real
        const errorSpy = jest.spyOn(console, 'error').mockImplementation();
        process.chdir(tempDir);
        try {
          const result = await setRouteBind({ route: 'my-route' });
          expect(result.route).toEqual('my-route');
          const flagContent = await fs.readFile(result.flagPath, 'utf-8');
          expect(flagContent).toContain('branch: human/test-dropfault');
          const rows = errorSpy.mock.calls.map((call) => String(call[0]));
          const rowsOfDrop = rows.filter((row) =>
            row.includes('status line cache drop failed'),
          );
          expect(rowsOfDrop).toHaveLength(1);
          // the full row a caller reads, pinned so drift in its text shows in review
          expect(rowsOfDrop).toMatchSnapshot();
        } finally {
          process.chdir(originalCwd);
          errorSpy.mockRestore();
        }
      });
    });
  });

  given('[case6] two routes already hold the branch flag', () => {
    let tempDir: string;
    const branch = 'human/test-multibind';

    beforeEach(async () => {
      // a second flag planted by hand, the state a race of two binds leaves
      tempDir = genTempDir({ slug: 'test-bind-set-multibind', git: true });
      execSync(`git checkout -b ${branch}`, { cwd: tempDir });
      for (const route of ['route-a', 'route-b']) {
        await fs.mkdir(path.join(tempDir, route, '.route'), {
          recursive: true,
        });
        await fs.writeFile(
          path.join(
            tempDir,
            route,
            '.route',
            '.bind.human.test-multibind.flag',
          ),
          `branch: ${branch}\nbound_by: route.bind skill\n`,
        );
      }
    });

    when('[t0] route-a is bound again', () => {
      then(
        'the bind refuses with the multi-bind fault and marks the pointer',
        async () => {
          const originalCwd = process.cwd();
          process.chdir(tempDir);
          try {
            const error = await getError(setRouteBind({ route: 'route-a' }));
            expect(error).toBeInstanceOf(BadRequestError);
            expect(error.message).toContain(MESSAGE_OF_MULTI_BIND);
            const tempDirReal = await fs.realpath(tempDir);
            expect(
              error.message
                .split(tempDirReal)
                .join('$REPO')
                .split(tempDir)
                .join('$REPO'),
            ).toMatchSnapshot();
            const pointer = await getOneRouteStatusLinePointer({
              cwd: tempDir,
              branch,
            });
            expect(pointer).toEqual(MARK_OF_MULTI_BIND);
          } finally {
            process.chdir(originalCwd);
          }
        },
      );
    });

    when(
      '[t1] route-a is bound again, and the pointer cannot be marked',
      () => {
        then(
          'the bind still refuses with the multi-bind fault, and one stderr row names the mark fault',
          async () => {
            // a non-empty dir where the pointer belongs: the mark write faults
            await fs.mkdir(
              path.join(
                asRouteStatusLinePointerPath({ cwd: tempDir, branch }),
                'blocker',
              ),
              { recursive: true },
            );
            const originalCwd = process.cwd();
            // .spy = console.error, silenced to capture the warn rows; the git/fs work stays real
            const errorSpy = jest.spyOn(console, 'error').mockImplementation();
            process.chdir(tempDir);
            try {
              const error = await getError(setRouteBind({ route: 'route-a' }));
              expect(error).toBeInstanceOf(BadRequestError);
              expect(error.message).toContain(MESSAGE_OF_MULTI_BIND);
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
      },
    );
  });

  given('[case7] the route path is a file', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = genTempDir({ slug: 'test-bind-set-notdir', git: true });
      execSync('git checkout -b human/test-notdir', { cwd: tempDir });
      await fs.writeFile(path.join(tempDir, 'my-route.md'), 'not a route');
    });

    when('[t0] the file is bound', () => {
      then('the bind refuses and names the fix', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const error = await getError(setRouteBind({ route: 'my-route.md' }));
          expect(error).toBeInstanceOf(BadRequestError);
          expect(error.message).toContain('route is not a directory');
          expect(error.message).toMatchSnapshot();
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });
});
