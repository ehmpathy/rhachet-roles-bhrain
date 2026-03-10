import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, when } from 'test-fns';

import { getAllBindFlagsByBranch } from './getAllBindFlagsByBranch';

describe('getAllBindFlagsByBranch', () => {
  given('[case1] bind flag in valid location', () => {
    const tempDir = genTempDir({ slug: 'test-bind-flags-valid' });

    beforeEach(async () => {
      const routeDir = path.join(tempDir, '.behavior', 'my-feature', '.route');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '.bind.vlad.test-branch.flag'),
        'branch: vlad/test-branch\n',
      );
    });

    when('[t0] lookup executed', () => {
      then('finds the flag', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await getAllBindFlagsByBranch({
            branch: 'vlad/test-branch',
          });
          expect(result.flagFiles).toHaveLength(1);
          expect(result.flagFiles[0]).toContain('.bind.vlad.test-branch.flag');
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case2] bind flag in .temp directory', () => {
    const tempDir = genTempDir({ slug: 'test-bind-flags-temp' });

    beforeEach(async () => {
      // flag in .temp should be ignored
      const routeDir = path.join(tempDir, '.temp', 'some-test', '.route');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '.bind.vlad.ignored-branch.flag'),
        'branch: vlad/ignored-branch\n',
      );
    });

    when('[t0] lookup executed', () => {
      then('ignores flag in .temp', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await getAllBindFlagsByBranch({
            branch: 'vlad/ignored-branch',
          });
          expect(result.flagFiles).toHaveLength(0);
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case3] bind flag in dist directory', () => {
    const tempDir = genTempDir({ slug: 'test-bind-flags-dist' });

    beforeEach(async () => {
      // flag in dist should be ignored
      const routeDir = path.join(tempDir, 'dist', 'some-build', '.route');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '.bind.vlad.ignored-branch.flag'),
        'branch: vlad/ignored-branch\n',
      );
    });

    when('[t0] lookup executed', () => {
      then('ignores flag in dist', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await getAllBindFlagsByBranch({
            branch: 'vlad/ignored-branch',
          });
          expect(result.flagFiles).toHaveLength(0);
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case4] bind flag in node_modules directory', () => {
    const tempDir = genTempDir({ slug: 'test-bind-flags-nm' });

    beforeEach(async () => {
      // flag in node_modules should be ignored
      const routeDir = path.join(tempDir, 'node_modules', 'some-pkg', '.route');
      await fs.mkdir(routeDir, { recursive: true });
      await fs.writeFile(
        path.join(routeDir, '.bind.vlad.ignored-branch.flag'),
        'branch: vlad/ignored-branch\n',
      );
    });

    when('[t0] lookup executed', () => {
      then('ignores flag in node_modules', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await getAllBindFlagsByBranch({
            branch: 'vlad/ignored-branch',
          });
          expect(result.flagFiles).toHaveLength(0);
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });

  given('[case5] bind flags in mixed locations', () => {
    const tempDir = genTempDir({ slug: 'test-bind-flags-mixed' });

    beforeEach(async () => {
      // valid flag
      const validRouteDir = path.join(
        tempDir,
        '.behavior',
        'my-feature',
        '.route',
      );
      await fs.mkdir(validRouteDir, { recursive: true });
      await fs.writeFile(
        path.join(validRouteDir, '.bind.vlad.mixed-branch.flag'),
        'branch: vlad/mixed-branch\n',
      );

      // ignored flags
      const tempRouteDir = path.join(tempDir, '.temp', 'test', '.route');
      const distRouteDir = path.join(tempDir, 'dist', 'build', '.route');
      await fs.mkdir(tempRouteDir, { recursive: true });
      await fs.mkdir(distRouteDir, { recursive: true });
      await fs.writeFile(
        path.join(tempRouteDir, '.bind.vlad.mixed-branch.flag'),
        'branch: vlad/mixed-branch\n',
      );
      await fs.writeFile(
        path.join(distRouteDir, '.bind.vlad.mixed-branch.flag'),
        'branch: vlad/mixed-branch\n',
      );
    });

    when('[t0] lookup executed', () => {
      then('finds only valid flag, ignores others', async () => {
        const originalCwd = process.cwd();
        process.chdir(tempDir);
        try {
          const result = await getAllBindFlagsByBranch({
            branch: 'vlad/mixed-branch',
          });
          expect(result.flagFiles).toHaveLength(1);
          // check path contains valid location, not ignored dirs relative to cwd
          const flagPath = result.flagFiles[0]!;
          expect(flagPath).toContain('.behavior/my-feature');
          // ensure it's the valid one (not from .temp or dist subdirs we created)
          expect(flagPath).not.toMatch(/\/.temp\/test\//);
          expect(flagPath).not.toMatch(/\/dist\/build\//);
        } finally {
          process.chdir(originalCwd);
        }
      });
    });
  });
});
