import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-contemplation');

/**
 * .what = acceptance test that admin overrides bypass the contemplation gate (usecase 7)
 * .why = --as overruled / --as forced are admin escapes; the contemplation gate
 *        lives inside setStoneAsPassed, NOT the override handlers, so an admin
 *        override is never re-gated by a driver requirement (design-note B6)
 */
describe('driver.route.peer-contemplation-override.acceptance', () => {
  given('[case1] a stone with an uncontemplated architect blocker', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-contemplation-override',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-blocker.sh', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review-clean.sh', { cwd: tempDir });
      await fs.writeFile(
        path.join(tempDir, '1.execute.md'),
        '# execute\n\nthe work under review.\n',
      );
      // trigger the reviews so an uncontemplated .given exists
      await invokeRouteSkill({
        skill: 'route.stone.set',
        args: { stone: '1.execute', route: '.', as: 'passed' },
        cwd: tempDir,
      });
      return { tempDir };
    });

    when('[t0] driver signals --as overruled with no .taken', () => {
      const result = useThen('the override is applied', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'overruled' },
          cwd: scene.tempDir,
        }),
      );

      then('the contemplation gate does not block the override (exit 0)', () => {
        expect(result.code).toEqual(0);
      });

      then('no contemplation reply-prompt is shown', () => {
        expect(result.stdout).not.toContain('the reviewers await your reply');
      });

      then('the overrule indicator is shown (explicit, not snapshot-only)', () => {
        // .why = pin the overrule-confirmation indicator with a hard assertion so
        //        the coverage cannot silently drift out of the snapshot alone
        expect(result.stdout).toContain('level 1, overruled');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    when('[t1] driver signals --as forced with no .taken', () => {
      const result = useThen('the override is applied', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'forced' },
          cwd: scene.tempDir,
        }),
      );

      then('the contemplation gate does not block the override (exit 0)', () => {
        expect(result.code).toEqual(0);
      });

      then('no contemplation reply-prompt is shown', () => {
        expect(result.stdout).not.toContain('the reviewers await your reply');
      });

      then('the force grants approval (explicit, not snapshot-only)', () => {
        // .why = the force bypasses the contemplation gate AND grants approval on
        //        this single, judge-clear level. it does NOT mint a false overrule
        //        marker — l1 sits within the judge's 1-blocker budget, so the
        //        false-provenance fix (force.multilevel case2) applies. pin the
        //        approval grant explicitly so the intent survives beyond the snapshot.
        expect(result.stdout).toContain('approved  = ✓');
      });

      then('the force does NOT mint a false overrule on the judge-clear level', () => {
        // .why = l1 is merit-clear at the judge (1 blocker ≤ budget 1); a force must
        //        not persist a bogus "forgiven by human" marker on a level that was
        //        never judge-blocked — the same guarantee force.multilevel case2 clamps
        expect(result.stdout).not.toContain('overruled = ✓ (level 1)');
      });

      then('stdout matches snapshot', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
