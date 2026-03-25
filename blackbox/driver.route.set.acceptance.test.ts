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

        // check for passage marker in passage.jsonl
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8').catch(() => '');
        const passageExists = passageContent
          .split('\n')
          .filter(Boolean)
          .some((line) => {
            const entry = JSON.parse(line);
            return entry.stone === '1.vision' && entry.status === 'passed';
          });

        return { cli, tempDir, passageExists };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('outputs passed message', () => {
        expect(res.cli.stdout).toContain('passage = allowed');
      });

      then('outputs reminder to continue route', () => {
        expect(res.cli.stdout).toContain('the way continues, run');
        expect(res.cli.stdout).toContain('rhx route.drive');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
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

        // check for approval marker in passage.jsonl (should NOT exist)
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8').catch(() => '');
        const approvalExists = passageContent
          .split('\n')
          .filter(Boolean)
          .some((line) => {
            const entry = JSON.parse(line);
            return entry.stone === '1.vision' && entry.status === 'approved';
          });

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

          // check for passage marker in passage.jsonl
          const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
          const passageContent = await fs.readFile(passagePath, 'utf-8').catch(() => '');
          const passageExists = passageContent
            .split('\n')
            .filter(Boolean)
            .some((line) => {
              const entry = JSON.parse(line);
              return entry.stone === '1.test' && entry.status === 'passed';
            });

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

      then('stdout contains progress output with branch format', () => {
        // progress lines appear in stdout as part of owl header
        expect(res.cli.stdout).toContain('review.1');
        expect(res.cli.stdout).toContain('judge.1');
      });

      then('outputs reminder to continue route', () => {
        expect(res.cli.stdout).toContain('the way continues, run');
        expect(res.cli.stdout).toContain('rhx route.drive');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
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

          // check passage marker should NOT exist in passage.jsonl
          const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
          const passageContent = await fs.readFile(passagePath, 'utf-8').catch(() => '');
          const passageExists = passageContent
            .split('\n')
            .filter(Boolean)
            .some((line) => {
              const entry = JSON.parse(line);
              return entry.stone === '2.blocked' && entry.status === 'passed';
            });

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

      then('does NOT output reminder (blocked)', () => {
        expect(res.cli.stdout).not.toContain('the way continues');
        expect(res.cli.stdout).not.toContain('rhx route.drive');
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

          // note: with passage.jsonl, we don't "remove" entries (append-only)
          // the second run will still re-evaluate guards and use cached reviews

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

      then('stdout shows glob pattern under cached indicator with on prefix', () => {
        // the cachedOn feature shows the original glob (what invalidates the cache)
        expect(res.cli.stdout).toContain('on $route/1.test*.md');
      });

      then('stdout contains passage = allowed', () => {
        expect(res.cli.stdout).toContain('passage = allowed');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case8] route.stone.set --as rewound', () => {
    when('[t0] rewind a single stone with guard artifacts', () => {
      const res = useThen('invoke rewound on stone with artifacts', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-rewound-single',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create .route directory and guard artifacts
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', '1.vision.guard.review.i1.abc.r1.md'),
          '# review',
        );
        await fs.writeFile(
          path.join(tempDir, '.route', '1.vision.guard.judge.i1.abc.j1.md'),
          '# judge',
        );

        // invoke rewind
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound' },
          cwd: tempDir,
        });

        console.log('\n--- [case8] cli.stdout ---');
        console.log(cli.stdout);
        console.log('\n--- [case8] cli.stderr ---');
        console.log(cli.stderr);
        console.log('--- end [case8] cli ---\n');

        // check passage.jsonl for rewound entry
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8').catch(() => '');
        const rewoundExists = passageContent
          .split('\n')
          .filter(Boolean)
          .some((line) => {
            const entry = JSON.parse(line);
            return entry.stone === '1.vision' && entry.status === 'rewound';
          });

        // check guard artifacts are deleted
        const routeFiles = await fs.readdir(path.join(tempDir, '.route'));
        const guardFiles = routeFiles.filter((f) => f.includes('.guard.'));

        return { cli, tempDir, rewoundExists, guardFiles };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout contains rewound output tree', () => {
        expect(res.cli.stdout).toContain('1.vision');
        expect(res.cli.stdout).toContain('cascade');
        expect(res.cli.stdout).toContain('done');
      });

      then('creates passage marker with status rewound', () => {
        expect(res.rewoundExists).toBe(true);
      });

      then('deletes guard artifacts', () => {
        expect(res.guardFiles).toHaveLength(0);
      });
    });

    when('[t1] cascade rewind affects subsequent stones', () => {
      const res = useThen('invoke rewound with cascade', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-rewound-cascade',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create .route directory with artifacts for multiple stones
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', '1.vision.guard.review.i1.abc.r1.md'),
          '# review',
        );
        await fs.writeFile(
          path.join(tempDir, '.route', '2.criteria.guard.review.i1.abc.r1.md'),
          '# review',
        );
        await fs.writeFile(
          path.join(tempDir, '.route', '3.plan.guard.review.i1.abc.r1.md'),
          '# review',
        );

        // invoke rewind on stone 2 (should cascade to 2 and 3, not 1)
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '2.criteria', route: '.', as: 'rewound' },
          cwd: tempDir,
        });

        // check which guard files remain
        const routeFiles = await fs.readdir(path.join(tempDir, '.route'));
        const guardFiles = routeFiles.filter((f) => f.includes('.guard.'));

        // check passage.jsonl for rewound entries
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8').catch(() => '');
        const lines = passageContent.split('\n').filter(Boolean);
        const rewoundStones = lines
          .map((line) => JSON.parse(line))
          .filter((e: { status: string }) => e.status === 'rewound')
          .map((e: { stone: string }) => e.stone);

        return { cli, tempDir, guardFiles, rewoundStones };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('stdout shows cascade for stones 2 and 3', () => {
        expect(res.cli.stdout).toContain('2.criteria');
        expect(res.cli.stdout).toContain('3.plan');
      });

      then('passage contains rewound entries for stones 2 and 3', () => {
        expect(res.rewoundStones).toContain('2.criteria');
        expect(res.rewoundStones).toContain('3.plan');
        expect(res.rewoundStones).not.toContain('1.vision');
      });

      then('only stone 1 guard artifacts remain', () => {
        expect(res.guardFiles).toHaveLength(1);
        expect(res.guardFiles[0]).toContain('1.vision');
      });

      then('stdout matches snapshot', () => {
        expect(res.cli.stdout).toMatchSnapshot();
      });
    });

    when('[t2] rewind invalidates prior approval', () => {
      const res = useThen('invoke rewound after approval', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-rewound-invalid',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create .route directory with prior approval
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(tempDir, '.route', 'passage.jsonl'),
          '{"stone":"1.vision","status":"approved"}\n',
        );

        // invoke rewind
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound' },
          cwd: tempDir,
        });

        // check passage.jsonl for both entries
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8');
        const lines = passageContent.split('\n').filter(Boolean);

        return { cli, tempDir, lines };
      });

      then('cli completes successfully', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('passage.jsonl contains approved then rewound entries (cascade)', () => {
        // cascade rewinds all 3 stones (1, 2, 3)
        expect(res.lines).toHaveLength(4);
        expect(res.lines[0]).toContain('approved');
        expect(res.lines[1]).toContain('rewound');
        expect(res.lines[2]).toContain('rewound');
        expect(res.lines[3]).toContain('rewound');
      });
    });

    when('[t3] idempotent rewind (twice)', () => {
      const res = useThen('invoke rewound twice', async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'driver-set-rewound-idempotent',
          clone: ASSETS_DIR,
        });

        await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

        // create .route directory
        await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });

        // first rewind
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound' },
          cwd: tempDir,
        });

        // second rewind
        const cli = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'rewound' },
          cwd: tempDir,
        });

        // check passage.jsonl for entries
        const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
        const passageContent = await fs.readFile(passagePath, 'utf-8');
        const lines = passageContent.split('\n').filter(Boolean);

        return { cli, tempDir, lines };
      });

      then('cli completes successfully on second call', () => {
        expect(res.cli.code).toEqual(0);
      });

      then('passage.jsonl contains rewound entries for each cascade (3 stones × 2 rewinds)', () => {
        // cascade rewinds all 3 stones twice = 6 entries
        expect(res.lines).toHaveLength(6);
        expect(res.lines.every((l: string) => l.includes('rewound'))).toBe(true);
      });
    });
  });
});
