import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { getRouteBindByBranch } from './getRouteBindByBranch';

describe('getRouteBindByBranch', () => {
  given('[case1] no bind flag files found', () => {
    let tempDir: string;

    beforeEach(() => {
      // create empty temp dir (no git needed - explicit branch param used)
      tempDir = genTempDir({ slug: 'test-bind-resolve-none' });
    });

    when('[t0] branch has no flags', () => {
      then('returns null', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await getRouteBindByBranch({
            branch: 'vlad/some-branch',
          });
          expect(result).toBeNull();
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case2] one bind flag file found', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create temp dir with a bind flag (no git needed - explicit branch param used)
      tempDir = genTempDir({ slug: 'test-bind-resolve-one' });
      const routeDir = path.join(tempDir, '.behavior', 'my-feature', '.route');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '.bind.vlad.test-branch.flag'),
        'branch: vlad/test-branch\nbound_by: route.bind skill\n',
      );
    });

    when('[t0] branch matches flag', () => {
      then('returns correct route path', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await getRouteBindByBranch({
            branch: 'vlad/test-branch',
          });
          expect(result).not.toBeNull();
          expect(result!.route).toEqual('.behavior/my-feature');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case3] multiple bind flag files found', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create temp dir with two bind flags for same branch
      tempDir = genTempDir({ slug: 'test-bind-resolve-multi' });
      const routeDir1 = path.join(tempDir, '.behavior', 'route-a', '.route');
      const routeDir2 = path.join(tempDir, '.behavior', 'route-b', '.route');
      await fs.mkdir(routeDir1, { recursive: true });
      await fs.mkdir(routeDir2, { recursive: true });
      await fs.writeFile(
        path.join(routeDir1, '.bind.vlad.ambiguous.flag'),
        'branch: vlad/ambiguous\nbound_by: route.bind skill\n',
      );
      await fs.writeFile(
        path.join(routeDir2, '.bind.vlad.ambiguous.flag'),
        'branch: vlad/ambiguous\nbound_by: route.bind skill\n',
      );
    });

    when('[t0] branch has multiple flags', () => {
      then('throws disambiguation error', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const error = await getError(
            getRouteBindByBranch({ branch: 'vlad/ambiguous' }),
          );
          expect(error).toBeInstanceOf(Error);
          expect(error.message).toContain('multiple routes bound');
          expect(error.message).toContain('disambiguate');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case4] branch name flatten', () => {
    let tempDir: string;

    beforeEach(async () => {
      // create flag for branch with slashes
      tempDir = genTempDir({ slug: 'test-bind-resolve-flatten' });
      const routeDir = path.join(tempDir, 'my-route', '.route');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '.bind.feat.sub.deep.flag'),
        'branch: feat/sub/deep\nbound_by: route.bind skill\n',
      );
    });

    when('[t0] branch has slashes', () => {
      then('flattens correctly and finds flag', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await getRouteBindByBranch({
            branch: 'feat/sub/deep',
          });
          expect(result).not.toBeNull();
          expect(result!.route).toEqual('my-route');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });
});
