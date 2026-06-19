import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-overrule-test');

/**
 * .what = acceptance tests for --as overruled and --as forced statuses
 * .why = verifies that humans can push past overzealous reviewers
 *
 * scenario overview:
 *   - stone has a guard with reviewed? judge (threshold: 0 blockers, 0 nitpicks)
 *   - mock review always emits 3 blockers and 7 nitpicks (overzealous reviewer)
 *   - human can use --as overruled to bypass the review threshold
 *   - human can use --as forced to both approve AND overrule
 */
describe('driver.route.overrule.acceptance', () => {
  // =========================================================================
  // --as overruled cases
  // =========================================================================

  given('[case1] human overrules blocked review', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'overrule-human',
        clone: ASSETS_DIR,
      });

      // link the driver role
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

      // make mock-review.sh executable
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // create artifact
      await fs.writeFile(
        path.join(tempDir, '1.plan.md'),
        '# Plan\n\nThis plan is fine but reviewer is overzealous.',
      );

      // verify pass fails due to blockers (setup precondition)
      const passResult = await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.plan', route: '.', as: 'passed' },
        cwd: tempDir,
      });
      if (passResult.code === 0) {
        throw new Error(
          'precondition failed: pass should have been blocked by overzealous reviewer',
        );
      }

      return { tempDir };
    });

    when('[t0] human runs --as overruled', () => {
      // note: we cannot truly simulate TTY in acceptance tests
      // but the implementation should allow overruled in test environment
      // real TTY check is verified in unit tests
      then('exit code is 0', async () => {
        const result = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'overruled' },
          cwd: scene.tempDir,
        });
        expect(result.code).toEqual(0);
      });

      then('stdout shows overrule confirmation', async () => {
        const result = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'overruled' },
          cwd: scene.tempDir,
        });
        expect(result.stdout).toContain('overruled');
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] pass attempted after overrule', () => {
      const result = useThen('pass succeeds', async () => {
        // first overrule
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'overruled' },
          cwd: scene.tempDir,
        });
        // then pass
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms passage', () => {
        expect(result.stdout).toContain('passage = allowed');
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] robot attempts overrule', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'overrule-robot',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      await fs.writeFile(
        path.join(tempDir, '1.plan.md'),
        '# Plan\n\nAgent tries to overrule.',
      );

      return { tempDir };
    });

    when('[t0] robot runs --as overruled (non-TTY, production)', () => {
      const result = useThen('command fails', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'overruled' },
          cwd: scene.tempDir,
          env: { NODE_ENV: 'production', CI: '' },
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stdout shows guidance', () => {
        expect(result.stdout).toContain('only humans can overrule');
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case3] overrule before review', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'overrule-preemptive',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      // create artifact but don't run review yet
      await fs.writeFile(
        path.join(tempDir, '1.plan.md'),
        '# Plan\n\nPreemptive overrule before review runs.',
      );

      return { tempDir };
    });

    when('[t0] human overrules preemptively', () => {
      const result = useThen('overrule succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'overruled' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });
    });

    when('[t1] pass attempted after preemptive overrule', () => {
      const result = useThen('pass succeeds', async () => {
        // first overrule preemptively
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'overruled' },
          cwd: scene.tempDir,
        });
        // then pass (review will run but overrule marker should bypass)
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms passage', () => {
        expect(result.stdout).toContain('passage = allowed');
      });
    });
  });

  given('[case4] rewind clears overrule marker', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'overrule-rewind',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      await fs.writeFile(
        path.join(tempDir, '1.plan.md'),
        '# Plan\n\nTest rewind clears overrule.',
      );

      // verify overrule succeeds (setup precondition)
      const overruleResult = await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.plan', route: '.', as: 'overruled' },
        cwd: tempDir,
      });
      if (overruleResult.code !== 0) {
        throw new Error(
          `precondition failed: overrule should have succeeded, got exit ${overruleResult.code}`,
        );
      }

      return { tempDir };
    });

    when('[t0] stone is rewound', () => {
      const result = useThen('rewind succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'rewound' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });
    });

    when('[t1] pass attempted after rewind (overrule cleared)', () => {
      const result = useThen('pass fails (overrule no longer active)', async () => {
        // rewind first
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'rewound' },
          cwd: scene.tempDir,
        });
        // then pass - should fail because overrule was cleared
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });
    });
  });

  // =========================================================================
  // --as forced cases
  // =========================================================================

  given('[case5] human forces blocked stone', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'force-human',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      await fs.writeFile(
        path.join(tempDir, '1.plan.md'),
        '# Plan\n\nHuman forces through blockers.',
      );

      return { tempDir };
    });

    when('[t0] human runs --as forced', () => {
      const result = useThen('force succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'forced' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout shows both approval and overrule', () => {
        expect(result.stdout).toContain('approved');
        expect(result.stdout).toContain('overruled');
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] pass attempted after force', () => {
      const result = useThen('pass succeeds', async () => {
        // force first
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'forced' },
          cwd: scene.tempDir,
        });
        // then pass
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms passage', () => {
        expect(result.stdout).toContain('passage = allowed');
      });
    });
  });

  given('[case6] robot attempts force', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'force-robot',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      await fs.writeFile(
        path.join(tempDir, '1.plan.md'),
        '# Plan\n\nAgent tries to force.',
      );

      return { tempDir };
    });

    when('[t0] robot runs --as forced (non-TTY, production)', () => {
      const result = useThen('command fails', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'forced' },
          cwd: scene.tempDir,
          env: { NODE_ENV: 'production', CI: '' },
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stdout shows guidance', () => {
        expect(result.stdout).toContain('only humans can force');
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case7] rewind clears forced markers', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'force-rewind',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      await fs.writeFile(
        path.join(tempDir, '1.plan.md'),
        '# Plan\n\nTest rewind clears forced markers.',
      );

      // verify force succeeds (setup precondition)
      const forceResult = await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.plan', route: '.', as: 'forced' },
        cwd: tempDir,
      });
      if (forceResult.code !== 0) {
        throw new Error(
          `precondition failed: force should have succeeded, got exit ${forceResult.code}`,
        );
      }

      return { tempDir };
    });

    when('[t0] stone is rewound', () => {
      const result = useThen('rewind succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'rewound' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });
    });

    when('[t1] pass attempted after rewind (force markers cleared)', () => {
      const result = useThen('pass fails', async () => {
        // rewind first
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'rewound' },
          cwd: scene.tempDir,
        });
        // then pass - should fail because both markers were cleared
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });
    });
  });

  // =========================================================================
  // reviewed? judge integration
  // =========================================================================

  given('[case8] approval alone does not bypass review threshold', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'approval-only',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });

      await fs.writeFile(
        path.join(tempDir, '1.plan.md'),
        '# Plan\n\nApproval alone is insufficient.',
      );

      // verify approve succeeds (setup precondition)
      const approveResult = await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.plan', route: '.', as: 'approved' },
        cwd: tempDir,
      });
      if (approveResult.code !== 0) {
        throw new Error(
          `precondition failed: approve should have succeeded, got exit ${approveResult.code}`,
        );
      }

      return { tempDir };
    });

    when('[t0] pass attempted with approval but no overrule', () => {
      const result = useThen('pass fails', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.plan', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is non-zero', () => {
        expect(result.code).not.toEqual(0);
      });

      then('output mentions blockers', () => {
        const output = result.stdout.toLowerCase() + result.stderr.toLowerCase();
        expect(output).toMatch(/block|fail|not passed|denied/);
      });
    });
  });
});
