import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-force-multilevel');

/**
 * .what = acceptance tests for --as forced on a MULTI-LEVEL guard
 * .why = proves the two-stop force timeline from the vision:
 *        - force at a non-terminal level (l1 active) overrules l1 but
 *          WITHHOLDS approval (l3 not yet seen) — output omits approval line
 *        - force at the terminal level (l3 active) overrules l3 AND grants
 *          approval — output shows approved = ✓
 *
 * scenario:
 *   - guard has l1 (default-rejects) + l3 (always passes)
 *   - guard has BOTH a reviewed? judge AND an approved? judge
 */
describe('driver.route.force.multilevel.acceptance', () => {
  const setupScene = async (slug: string) => {
    const tempDir = genTempDirForRhachet({ slug, clone: ASSETS_DIR });
    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });
    await fs.writeFile(
      path.join(tempDir, '1.feature.md'),
      '# Feature\n\nMulti-level guard with an approval gate.',
    );
    return { tempDir };
  };

  given('[case1] force at a non-terminal level withholds approval', () => {
    const scene = useBeforeAll(async () => setupScene('force-multi-withhold'));

    when('[t0] initial pass attempted (l1 rejects, l3 queued)', () => {
      const result = useThen('pass fails due to l1 blocker', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — l1 blocker gates passage)', () => {
        // exit 2 = constraint (caller must fix the l1 blocker), not a mere non-zero —
        // a code 1 (malfunction) here would signal a crash regression
        expect(result.code).toEqual(2);
      });

      then('snapshot shows the l1-blocked initial pass', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] human forces while l1 is the active level', () => {
      const result = useThen('force succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'forced' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout overrules level 1', () => {
        expect(result.stdout).toContain('overruled = ✓ (level 1)');
      });

      then('stdout WITHHOLDS approval (no approval line)', () => {
        // .why = l1 is not the terminal level, so approval is withheld;
        //        the absence of the approval line is the signal
        expect(result.stdout).not.toContain('approved  = ✓');
      });

      then('snapshot shows overrule only, approval withheld', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case2] force at the terminal level grants approval', () => {
    const scene = useBeforeAll(async () => setupScene('force-multi-approve'));

    when('[t0] force l1 then pass so l3 becomes active', () => {
      const result = useThen('l3 unlocks after l1 force', async () => {
        // force l1 (withholds approval) — this overrules l1
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'forced' },
          cwd: scene.tempDir,
        });
        // pass: l1 forgiven, l3 runs and passes review, but approval gate blocks
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('pass is blocked on the approval gate (l3 is now terminal active)', () => {
        // reviewed? passes (l1 overruled, l3 approved) but approved? still gates → exit 2
        // (constraint: awaits human approval), never a code 1 malfunction
        expect(result.code).toEqual(2);
      });

      then('snapshot shows l3 active, blocked on the approval gate', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] human forces to grant the approval gate (l3 already merit-approved)', () => {
      const result = useThen('force grants approval', async () => {
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'forced' },
          cwd: scene.tempDir,
        });
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        // l3 has approved on its own merit and l1 is overruled, so every review
        // level is already clear (activeLevel === null); this force exists only to
        // grant the approved? gate
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'forced' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout does NOT mint a false overrule on the merit-approved l3', () => {
        // .why = l3 cleared on its own merit — a force must not persist a bogus
        //        "forgiven by human" marker on a level that was never blocked
        //        (the false-provenance fix). only the approval is granted here.
        expect(result.stdout).not.toContain('overruled = ✓ (level 3)');
      });

      then('stdout GRANTS approval', () => {
        expect(result.stdout).toContain('approved  = ✓');
      });

      then('snapshot shows approval granted, no spurious l3 overrule', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t2] pass after terminal force succeeds', () => {
      const result = useThen('stone passes once approved', async () => {
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'forced' },
          cwd: scene.tempDir,
        });
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'forced' },
          cwd: scene.tempDir,
        });
        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('stdout confirms passage', () => {
        expect(result.stdout).toContain('passage = ');
      });

      then('snapshot shows the passed stone after terminal force', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  given('[case3] robot cannot force (negative path)', () => {
    const scene = useBeforeAll(async () => setupScene('force-multi-robot'));

    when('[t0] robot runs --as forced (non-TTY, production)', () => {
      const result = useThen('force is rejected for a non-human', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.feature', route: '.', as: 'forced' },
          cwd: scene.tempDir,
          env: { NODE_ENV: 'production', CI: '' },
        }),
      );

      then('exit code is 2 (constraint — a non-human may not force)', () => {
        // exit 2 = constraint (only a human at a TTY may force), not a mere non-zero —
        // a code 1 (malfunction) here would signal a crash regression
        expect(result.code).toEqual(2);
      });

      then('stdout explains only humans can force', () => {
        // .why = force is a human-only authority; a robot attempt must be
        //        rejected with guidance, never silently granted
        expect(result.stdout).toContain('only humans can force');
      });

      then('snapshot shows the robot-force rejection', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
