import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-budget-3level',
);

/**
 * .what = the multi-level clamp — on an l1+l2+l3 ladder, an overrule of a lower level must
 *         not let a driver skip the still-un-approved levels above it.
 * .why = the overrule tally forgives a whole *level*; the residual-leak risk is a deeper
 *        ladder where a waved l1 could wrongly clear l2/l3. this probes D2/D3 directly.
 *
 * invariant (define.invariant.review.peer.passage):
 *   - overrule l1 unlocks l2 (the NEXT gate), never l3 directly
 *   - passage stays blocked until EVERY level is terminal (approved or overruled)
 *
 * asset = route-peer-budget-3level (basic=l1, advanced=l2, premium=l3, all reject-by-default).
 */
describe('driver.route.overrule-skip-multilevel.acceptance', () => {
  const genScene = async (input: { slug: string }) => {
    const tempDir = genTempDirForRhachet({ slug: input.slug, clone: ASSETS_DIR });
    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-basic.sh', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-advanced.sh', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-premium.sh', { cwd: tempDir });
    await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
    await fs.writeFile(
      path.join(tempDir, 'src', 'feature.ts'),
      'export const feature = () => "v1";',
    );
    return tempDir;
  };

  const setStone = (input: { tempDir: string; as: 'passed' | 'overruled' }) =>
    invokeRouteSkill({
      skill: 'route.stone.set',
      args: { stone: '1.vision', route: '.', as: input.as },
      cwd: input.tempDir,
    });

  // ===========================================================================
  // D2 — overrule l1 only. l2 is the NEXT ready gate. passage must block on l2,
  //      never leap to l3. an un-approved l2 stands.
  // ===========================================================================
  given('[case1] D2 — overrule l1 only → l2 is the next gate → passage blocked', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-ml-d2' });
      await setStone({ tempDir, as: 'passed' }); // l1 rejects
      await setStone({ tempDir, as: 'overruled' }); // wave l1 → l2 active
      return { tempDir };
    });

    when('[t0] pass attempted after l1 overrule', () => {
      const result = useThen('the pass', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('CLAMP: passage BLOCKED — l2 is the next gate, not l3', () => {
        expect(result.code).toEqual(2); // constraint (blocked), not 1 (malfunction)
        expect(result.stdout).not.toContain('passage = allowed');
        expect(result.stdout).not.toContain('passage = overruled');
      });

      then('CLAMP: l2 ran and blocks (advanced-checker)', () => {
        expect(result.stdout).toContain('advanced-checker');
      });

      then('DISPLAY: no false "awaits l1 terminal" once l1 is overruled', () => {
        // .why = parity with the 2-level suite's explicit guard — an overruled l1 must never
        //        paint a bogus `awaits l1 terminal` on the level above it, and a `--resnap`
        //        must not be able to silently re-absorb a regression of that contradiction.
        expect(result.stdout).not.toContain('awaits l1 terminal');
      });

      then('DISPLAY: l1 carries the forgiven marker', () => {
        expect(result.stdout).toContain('overruled ✓ — forgiven by human');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // D3 — overrule l1, l2 APPROVES (flag), l3 still un-approved → passage blocked.
  //      the deepest residual-leak probe: two lower levels cleared, l3 still guards.
  // ===========================================================================
  given('[case2] D3 — l1 overruled, l2 approves, l3 un-approved → passage blocked', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-ml-d3' });
      // let l2 (advanced) pass so the ladder reaches l3; l3 (premium) still rejects
      await fs.writeFile(path.join(tempDir, '.test', 'advanced-should-pass'), '');
      await setStone({ tempDir, as: 'passed' }); // l1 rejects
      await setStone({ tempDir, as: 'overruled' }); // wave l1 → l2 active
      return { tempDir };
    });

    when('[t0] pass attempted — l1 waved, l2 approves, l3 rejects', () => {
      const result = useThen('the pass', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('CLAMP: passage BLOCKED — l3 still guards after l1 waved + l2 approved', () => {
        expect(result.code).toEqual(2); // constraint (blocked), not 1 (malfunction)
        expect(result.stdout).not.toContain('passage = allowed');
        expect(result.stdout).not.toContain('passage = overruled');
      });

      then('CLAMP: l3 (premium-checker) ran and blocks', () => {
        expect(result.stdout).toContain('premium-checker');
      });

      then('DISPLAY: l1 overruled is honest — forgiven marker, no false awaits', () => {
        // .why = the deepest display case: l1 waved + l2 approved on merit + l3 live. l1 must
        //        read as forgiven, and no reviewer may await the overruled l1 (parity guard).
        expect(result.stdout).not.toContain('awaits l1 terminal');
        expect(result.stdout).toContain('overruled ✓ — forgiven by human');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // D3-pass — the honest full clear: l1 overruled, l2 + l3 approve → passage allowed.
  // ===========================================================================
  given('[case3] D3-pass — l1 overruled, l2 + l3 approve → passage overruled (allowed)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-ml-d3-pass' });
      await fs.writeFile(path.join(tempDir, '.test', 'advanced-should-pass'), '');
      await fs.writeFile(path.join(tempDir, '.test', 'premium-should-pass'), '');
      await setStone({ tempDir, as: 'passed' }); // l1 rejects
      await setStone({ tempDir, as: 'overruled' }); // wave l1
      return { tempDir };
    });

    when('[t0] pass attempted — l1 waved, l2 + l3 approve', () => {
      const result = useThen('the pass', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage is allowed (overruled)', () => {
        expect(result.stdout).toContain('passage = overruled');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // JUDGE-READY — overrule every peer level (l1→l2→l3); the JUDGE is the next
  //   ready gate. the overrule of the TOP peer level must name "judge, ready" in
  //   its confirmation, never the raw JUDGE_LEVEL sentinel. this is the display
  //   path r10/r11 flagged: a human who waves the top peer level on a peer+judge
  //   stone must see the judge surfaced as the next gate.
  // ===========================================================================
  given(
    '[case4] JUDGE-READY — overrule the top peer level → the judge is the next ready gate',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = await genScene({ slug: 'overrule-skip-ml-judge-ready' });
        // walk the ladder to the top peer level: each pass runs the newly-unlocked
        // level (it rejects), each overrule waves it so the next level becomes active
        await setStone({ tempDir, as: 'passed' }); // l1 rejects
        await setStone({ tempDir, as: 'overruled' }); // wave l1 → l2 active
        await setStone({ tempDir, as: 'passed' }); // l2 rejects
        await setStone({ tempDir, as: 'overruled' }); // wave l2 → l3 active
        await setStone({ tempDir, as: 'passed' }); // l3 rejects
        return { tempDir };
      });

      when('[t0] the human overrules the TOP peer level (l3)', () => {
        const result = useThen('the overrule of l3', async () =>
          setStone({ tempDir: scene.tempDir, as: 'overruled' }),
        );

        then('exit code is 0 (overrule succeeds)', () => {
          expect(result.code).toEqual(0);
        });

        then('the confirmation waves l3', () => {
          expect(result.stdout).toContain('level 3, overruled');
        });

        then('DISPLAY: the JUDGE is named as the next ready gate', () => {
          // .why = once every peer level is waved, the judge is the next rung the driver must
          //        satisfy; the confirmation must surface it as "judge, ready" — never the raw
          //        JUDGE_LEVEL sentinel, and never silent (the display-vs-reality gap r10/r11 found)
          expect(result.stdout).toContain('judge, ready');
          expect(result.stdout).not.toContain('9007199254740991');
        });

        then('stdout has good vibes', () => {
          expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
        });
      });
    },
  );
});
