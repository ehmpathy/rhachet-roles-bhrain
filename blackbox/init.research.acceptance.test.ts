import * as fs from 'fs/promises';
import * as path from 'path';

import { genTempDir, given, then, when } from 'test-fns';

import { asSnapshotSafe, invokeResearchSkill } from './.test/invokeResearchSkill';

/**
 * .what = create a temp directory ready for init.research tests
 * .why = acceptance tests need isolated git repos with rhachet roles linked
 */
const genResearchTestDir = (input: { slug: string }): string => {
  const tempDir = genTempDir({
    slug: input.slug,
    git: true,
    symlink: [
      // symlink rhachet-roles-bhrain package structure
      { at: 'node_modules/rhachet-roles-bhrain/package.json', to: 'package.json' },
      { at: 'node_modules/rhachet-roles-bhrain/dist', to: 'dist' },
    ],
  });

  // create minimal package.json for rhachet to discover roles
  require('fs').writeFileSync(
    path.join(tempDir, 'package.json'),
    JSON.stringify(
      {
        name: 'test-research',
        dependencies: {
          'rhachet-roles-bhrain': 'link:./node_modules/rhachet-roles-bhrain',
        },
      },
      null,
      2,
    ),
  );

  // link librarian role (sync since genTempDir returns sync)
  require('child_process').execSync('npx rhachet roles link --role librarian', {
    cwd: tempDir,
    stdio: 'pipe',
  });

  // create a feature branch (not main/master)
  require('child_process').execSync('git checkout -b test/init-research', {
    cwd: tempDir,
    stdio: 'pipe',
  });

  return tempDir;
};

describe('init.research', () => {
  given('[case1] empty directory', () => {
    when('[t0] init.research --name consensus-algorithms', () => {
      then('cli output matches expected format', async () => {
        const tempDir = genResearchTestDir({ slug: 'init-research-1' });

        const result = await invokeResearchSkill({
          cwd: tempDir,
          args: '--name consensus-algorithms',
        });

        expect(result.code).toEqual(0);
        expect(asSnapshotSafe(result.stdout)).toMatchSnapshot();
      });

      then('.research directory is created with templates', async () => {
        const tempDir = genResearchTestDir({ slug: 'init-research-2' });

        await invokeResearchSkill({
          cwd: tempDir,
          args: '--name consensus-algorithms',
        });

        // check research dir created
        const researchDirs = await fs.readdir(path.join(tempDir, '.research'));
        expect(researchDirs.length).toEqual(1);
        expect(researchDirs[0]).toMatch(/^v\d{4}_\d{2}_\d{2}\.consensus-algorithms$/);

        // check templates created
        const researchDir = path.join(tempDir, '.research', researchDirs[0]!);
        const files = await fs.readdir(researchDir);
        expect(files).toContain('0.wish.md');
        expect(files).toContain('1.1.probes.aim.internal.stone');
        expect(files).toContain('.bind');
      });

      then('.bind flag is created', async () => {
        const tempDir = genResearchTestDir({ slug: 'init-research-3' });

        await invokeResearchSkill({
          cwd: tempDir,
          args: '--name consensus-algorithms',
        });

        // check bind dir created
        const researchDirs = await fs.readdir(path.join(tempDir, '.research'));
        const researchDir = path.join(tempDir, '.research', researchDirs[0]!);
        const bindFiles = await fs.readdir(path.join(researchDir, '.bind'));
        expect(bindFiles.length).toEqual(1);
        expect(bindFiles[0]).toMatch(/\.consensus-algorithms\.flag$/);
      });
    });
  });

  given('[case2] research already bound', () => {
    when('[t0] init.research with same name (idempotent)', () => {
      then('returns successfully without error', async () => {
        const tempDir = genResearchTestDir({ slug: 'init-research-idem' });

        // first init
        const result1 = await invokeResearchSkill({
          cwd: tempDir,
          args: '--name consensus-algorithms',
        });
        expect(result1.code).toEqual(0);

        // second init (idempotent)
        const result2 = await invokeResearchSkill({
          cwd: tempDir,
          args: '--name consensus-algorithms',
        });
        expect(result2.code).toEqual(0);
        expect(asSnapshotSafe(result2.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case3] absent required args', () => {
    when('[t0] init.research without --name', () => {
      then('returns error', async () => {
        const tempDir = genResearchTestDir({ slug: 'init-research-noname' });

        const result = await invokeResearchSkill({
          cwd: tempDir,
          args: '',
        });

        expect(result.code).not.toEqual(0);
        expect(result.stderr).toContain('--name is required');
      });
    });
  });

  given('[case4] help flag', () => {
    when('[t0] init.research --help', () => {
      then('shows usage information', async () => {
        const tempDir = genResearchTestDir({ slug: 'init-research-help' });

        const result = await invokeResearchSkill({
          cwd: tempDir,
          args: '--help',
        });

        expect(result.code).toEqual(0);
        expect(result.stdout).toContain('usage:');
        expect(result.stdout).toContain('--name');
        expect(result.stdout).toContain('--dir');
        expect(result.stdout).toContain('--open');
      });
    });
  });
});
