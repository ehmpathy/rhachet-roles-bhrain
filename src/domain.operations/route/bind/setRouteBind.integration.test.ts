import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { setRouteBind } from './setRouteBind';

describe('setRouteBind', () => {
  given('[case1] valid route on a feature branch', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create a temp git repo with a route directory (ci-safe)
      tempDir = genTempDir({ slug: 'test-bind-set-valid', git: true });
      await fs.mkdir(path.join(tempDir, 'my-route'), { recursive: true });
      execSync('git checkout -b vlad/test-bind', { cwd: tempDir });
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
          expect(flagContent).toContain('branch: vlad/test-bind');
          expect(flagContent).toContain('bound_by: route.bind skill');

          // verify flag location
          expect(result.flagPath).toContain(
            path.join('my-route', '.route', '.bind.vlad.test-bind.flag'),
          );
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
      execSync('git checkout -b vlad/test-nodir', { cwd: tempDir });
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
      execSync('git checkout -b vlad/test-conflict', { cwd: tempDir });
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
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });
});
