import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');
const ASSETS_GUARDED_DIR = path.join(
  __dirname,
  '.test/assets/route-driver-guarded',
);

describe('driver.route.set.acceptance', () => {
  given('[case1] route.stone.set --as passed', () => {
    when('[t0] stone has artifact', () => {
      const res = useThen('invoke set skill', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-passed',
          clone: ASSETS_DIR,
        });

        // link the driver role
        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create artifact
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision\n\nTest');

        // invoke skill
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        console.log('\n--- cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end cli ---\n');

        // check for passage marker
        const passageExists = await fs
          .access(path.join(tempDir, '.route', '1.vision.passed'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, passageExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('outputs passed message', () => {
        expect(res.cli.stdout).toContain('passage = allowed');
      });

      then('creates passage marker', () => {
        expect(res.passageExists).toBe(true);
      });
    });

    when('[t1] stone has no artifact', () => {
      const res = useThen('invoke set skill without artifact', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-noart',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli fails with error', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error mentions artifact not found', () => {
        expect(res.cli.stderr).toContain('artifact not found');
      });
    });
  });

  given('[case2] route.stone.set --as approved', () => {
    // note: NODE_ENV=production overrides Jest's NODE_ENV=test to test real agent lock
    // human approval path is verified in unit tests (setStoneAsApproved.test.ts [case1])
    when('[t0] agent tries to approve', () => {
      const res = useThen('invoke set skill with approved', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-approved',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // NODE_ENV=production + CI='' simulates real agent (non-test, non-CI) environment
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'approved' },
          cwd: tempDir,
          env: { NODE_ENV: 'production', CI: '' },
        });

        // check for approval marker (should NOT exist)
        const approvalExists = await fs
          .access(path.join(tempDir, '.route', '1.vision.approved'))
          .then(() => true)
          .catch(() => false);

        return { cli, tempDir, approvalExists };
      });

      then('cli fails (agents cannot approve)', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('outputs "only humans can approve"', () => {
        expect(res.cli.stdout).toContain('only humans can approve');
      });

      then('does NOT create approval marker', () => {
        expect(res.approvalExists).toBe(false);
      });
    });
  });

  given('[case3] route.stone.set --as passed with guard (allowed)', () => {
    when('[t0] guarded stone with review + judge that pass', () => {
      const res = useThen(
        'invoke set skill on guarded stone',
        async () => {
          const tempDir = genTempDirForRhachet({
            slug: 'driver-set-guarded-pass',
            clone: ASSETS_GUARDED_DIR,
          });

          // link the driver role
          await execAsync('npx rhachet roles link --role driver', {
            cwd: tempDir,
          });

          // create artifact
          await fs.writeFile(
            path.join(tempDir, '1.test.md'),
            '# Test artifact\n\ncontent for review',
          );

          // invoke skill
          const cli = await invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.test', route: '.', as: 'passed' },
            cwd: tempDir,
          });

          console.log('\n--- [case3] cli.stdout ---');
          console.log(cli.stdout);
          console.log('\n--- [case3] cli.stderr ---');
          console.log(cli.stderr);
          console.log('--- end [case3] cli ---\n');

          // check for passage marker
          const passageExists = await fs
            .access(path.join(tempDir, '.route', '1.test.passed'))
            .then(() => true)
            .catch(() => false);

          return { cli, tempDir, passageExists };
        },
      );

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout contains passage = allowed', () => {
        expect(res.cli.stdout).toContain('passage = allowed');
      });

      then('stdout contains guard section', () => {
        expect(res.cli.stdout).toContain('guard');
      });

      then('stdout contains artifacts section', () => {
        expect(res.cli.stdout).toContain('artifacts');
        expect(res.cli.stdout).toContain('1.test.md');
      });

      then('stdout contains reviews section with r1 label', () => {
        expect(res.cli.stdout).toContain('reviews');
        expect(res.cli.stdout).toContain('r1:');
      });

      then('stdout contains judges section with j1 label', () => {
        expect(res.cli.stdout).toContain('judges');
        expect(res.cli.stdout).toContain('j1:');
      });

      then('stdout contains review result with nitpick count', () => {
        expect(res.cli.stdout).toContain('1 nitpick');
      });

      then('stdout contains judge result with passed mark', () => {
        expect(res.cli.stdout).toMatch(/finished \d+\.\ds ✓/);
      });

      then('stderr contains progress output', () => {
        // stderr should have inflight or finished lines from genContextCliEmit
        expect(res.cli.stderr.length).toBeGreaterThan(0);
      });

      then('creates passage marker', () => {
        expect(res.passageExists).toBe(true);
      });
    });
  });

  given('[case4] route.stone.set --as passed with guard (blocked)', () => {
    when('[t0] guarded stone with review + judge that fail', () => {
      const res = useThen(
        'invoke set skill on blocked guarded stone',
        async () => {
          const tempDir = genTempDirForRhachet({
            slug: 'driver-set-guarded-block',
            clone: ASSETS_GUARDED_DIR,
          });

          // link the driver role
          await execAsync('npx rhachet roles link --role driver', {
            cwd: tempDir,
          });

          // create artifact for the blocked stone
          await fs.writeFile(
            path.join(tempDir, '2.blocked.md'),
            '# Blocked artifact\n\ncontent with issues',
          );

          // invoke skill
          const cli = await invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '2.blocked', route: '.', as: 'passed' },
            cwd: tempDir,
          });

          console.log('\n--- [case4] cli.stdout ---');
          console.log(cli.stdout);
          console.log('\n--- [case4] cli.stderr ---');
          console.log(cli.stderr);
          console.log('--- end [case4] cli ---\n');

          // check passage marker should NOT exist
          const passageExists = await fs
            .access(path.join(tempDir, '.route', '2.blocked.passed'))
            .then(() => true)
            .catch(() => false);

          return { cli, tempDir, passageExists };
        },
      );

      then('cli exits with non-zero code', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('stdout contains passage = blocked', () => {
        expect(res.cli.stdout).toContain('passage = blocked');
      });

      then('stdout contains guard section', () => {
        expect(res.cli.stdout).toContain('guard');
      });

      then('stdout contains review with blocker count', () => {
        expect(res.cli.stdout).toContain('3 blockers');
      });

      then('stdout contains judge with failed mark', () => {
        expect(res.cli.stdout).toMatch(/finished \d+\.\ds ✗/);
      });

      then('stdout contains failure reason', () => {
        expect(res.cli.stdout).toContain(
          'reason: blockers exceed threshold (3 > 0)',
        );
      });

      then('stderr contains progress output', () => {
        expect(res.cli.stderr.length).toBeGreaterThan(0);
      });

      then('does not create passage marker', () => {
        expect(res.passageExists).toBe(false);
      });
    });
  });

  given('[case5] route.stone.set with flexible pattern lookup', () => {
    when('[t0] partial pattern matches single stone', () => {
      const res = useThen('invoke set skill with partial pattern', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-flex-match',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create artifact for 1.vision
        await fs.writeFile(path.join(tempDir, '1.vision.md'), '# Vision\n\nTest');

        // invoke with partial pattern 'vision' (should match 1.vision)
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: 'vision', route: '.', as: 'passed' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('outputs passed message for matched stone', () => {
        expect(res.cli.stdout).toContain('1.vision');
        expect(res.cli.stdout).toContain('passage = allowed');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });

    // note: NODE_ENV=production overrides Jest's NODE_ENV=test to test real agent lock
    // human approval via numeric prefix pattern is verified via unit tests
    when('[t1] numeric prefix pattern agent approval locked', () => {
      const res = useThen('invoke set skill with numeric prefix', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-flex-numeric',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // invoke with numeric prefix '2.' (should match 2.criteria)
        // NODE_ENV=production + CI='' simulates real agent (non-test, non-CI) environment
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.', route: '.', as: 'approved' },
          cwd: tempDir,
          env: { NODE_ENV: 'production', CI: '' },
        });

        return { cli, tempDir };
      });

      then('cli fails (agents cannot approve)', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('outputs blocked message for matched stone', () => {
        expect(res.cli.stdout).toContain('2.criteria');
        expect(res.cli.stdout).toContain('only humans can approve');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case6] route.stone.set with ambiguous pattern (failfast)', () => {
    when('[t0] pattern matches multiple stones', () => {
      const res = useThen('invoke set skill with ambiguous pattern', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-flex-ambig',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // invoke with ambiguous pattern that matches all stones
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '.', route: '.', as: 'approved' },
          cwd: tempDir,
        });

        return { cli, tempDir };
      });

      then('cli fails with non-zero code', () => {
        expect(res.cli.code).not.toEqual(0);
      });

      then('error mentions multiple stones matched', () => {
        expect(res.cli.stderr).toContain('matched');
        expect(res.cli.stderr).toContain('stones');
        expect(res.cli.stderr).toContain('be more specific');
      });

      then('error lists matched stone names', () => {
        expect(res.cli.stderr).toContain('1.vision');
        expect(res.cli.stderr).toContain('2.criteria');
        expect(res.cli.stderr).toContain('3.plan');
      });

      then('stderr matches snapshot', () => {
        expect(res.cli.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case7] route.stone.set --as passed with guard (cached)', () => {
    when('[t0] second run with same artifact reuses cached results', () => {
      const res = useThen(
        'invoke set skill twice on guarded stone',
        async () => {
          const tempDir = genTempDirForRhachet({
            slug: 'driver-set-guarded-cache',
            clone: ASSETS_GUARDED_DIR,
          });

          // link the driver role
          await execAsync('npx rhachet roles link --role driver', {
            cwd: tempDir,
          });

          // create artifact
          await fs.writeFile(
            path.join(tempDir, '1.test.md'),
            '# Test artifact\n\ncontent for cached test',
          );

          // first invocation — runs fresh
          await invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.test', route: '.', as: 'passed' },
            cwd: tempDir,
          });

          // remove passage marker so second run re-evaluates
          await fs.rm(path.join(tempDir, '.route', '1.test.passed'), {
            force: true,
          });

          // second invocation — should use cached reviews
          const cli = await invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.test', route: '.', as: 'passed' },
            cwd: tempDir,
          });

          console.log('\n--- [case5] cli.stdout ---');
          console.log(cli.stdout);
          console.log('\n--- [case5] cli.stderr ---');
          console.log(cli.stderr);
          console.log('--- end [case5] cli ---\n');

          return { cli, tempDir };
        },
      );

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout shows cached indicator for review', () => {
        expect(res.cli.stdout).toContain('cached');
      });

      then('stdout contains passage = allowed', () => {
        expect(res.cli.stdout).toContain('passage = allowed');
      });
    });
  });
});
