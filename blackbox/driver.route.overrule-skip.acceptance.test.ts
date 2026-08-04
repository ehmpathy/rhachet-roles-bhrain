import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, useWhen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-overrule-skip');

/**
 * .what = the core invariant clamp — an overruled lower level must NOT let a driver
 *         skip a ready/un-approved higher level. `PASS ⟺ every peer-review guard is terminal`.
 * .why = regression: a driver could `--as passed` and skip l3 once l1 was overruled. the
 *        overrule waves l1 only; l3 still guards. this suite is the durable clamp that a
 *        terminal *prior* level never substitutes for a later one.
 *
 * invariant (define.invariant.review.peer.passage):
 *   - l1 overruled UNLOCKS l3 — it does NOT clear it
 *   - a non-terminal l3 (queued | ready | rejected) blocks the stone, never a silent zero
 *
 * setup shape: l1 + l3 mock reviewers, each reject-by-default, pass via a flag file.
 * each case runs its full drive sequence in useBeforeAll so exactly one overrule is
 * applied where intended (overrule targets the ACTIVE level, so a stray second overrule
 * would silently wave l3 — the cases keep the count deliberate).
 */
describe('driver.route.overrule-skip.acceptance', () => {
  // util: a fresh linked tempdir with executable mock reviewers + an artifact
  const genScene = async (input: { slug: string }) => {
    const tempDir = genTempDirForRhachet({ slug: input.slug, clone: ASSETS_DIR });
    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-l1.sh', { cwd: tempDir });
    await execAsync('chmod +x .test/mock-review-l3.sh', { cwd: tempDir });
    await fs.writeFile(
      path.join(tempDir, '1.feature.md'),
      '# Feature\n\nImplemented.',
    );
    return tempDir;
  };

  const setStone = (input: {
    tempDir: string;
    as: 'passed' | 'overruled' | 'arrived';
  }) =>
    invokeRouteSkill({
      skill: 'route.stone.set',
      args: { stone: '1.feature', route: '.', as: input.as },
      cwd: input.tempDir,
    });

  // ===========================================================================
  // A2 — the wish's canonical scenario: pass → overrule l1 (ONCE) → pass.
  //      l1 rejected, then waved; l3 runs and rejects → passage BLOCKED.
  // ===========================================================================
  given('[case1] A2 — l1 rejected+overruled, l3 rejects → passage blocked', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-a2' });
      await setStone({ tempDir, as: 'passed' }); // l1 rejects, l3 locked → blocked
      await setStone({ tempDir, as: 'overruled' }); // human waves l1 (the active level)
      return { tempDir };
    });

    when('[t0] driver passes after the single l1 overrule', () => {
      const result = useThen('the final pass', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      // ---- THE CLAMP (the wish's non-negotiable bar) ----

      then('CLAMP: passage is BLOCKED — a rejecting l3 is not forgiven by an l1 overrule', () => {
        expect(result.code).toEqual(2); // constraint (blocked), not 1 (malfunction)
        expect(result.stdout).not.toContain('passage = allowed');
        expect(result.stdout).not.toContain('passage = overruled');
      });

      then('CLAMP: l3 actually ran and blocks (not a silent zero)', () => {
        expect(result.stdout).toContain('premium-checker');
        expect(result.stdout).toMatch(
          /premium-checker[\s\S]*rejected|premium-checker[\s\S]*blocker/,
        );
      });

      // ---- THE DISPLAY CLAMP (the persisted tree must not lie about l3) ----

      then('DISPLAY: the persisted l3 line is NOT the false "awaits l1 terminal"', () => {
        // .why = the verified defect: an overruled l1 (raw verdict still 'rejected') made the
        //        awaits calc paint `awaits l1 terminal` on l3 — even though l3 ran + rejected.
        //        an explicit assertion so the contradiction can never silently re-snapshot.
        expect(result.stdout).not.toContain('awaits l1 terminal');
      });

      then('DISPLAY: l1 carries the forgiven marker (overruled, not a live rejection)', () => {
        expect(result.stdout).toContain('overruled ✓ — forgiven by human');
      });

      then('DISPLAY: the path-continues footer names l1 overruled + the live l3 gate', () => {
        expect(result.stdout).toContain('the path continues');
        expect(result.stdout).toContain('l1 is terminal (overruled ✓)');
        expect(result.stdout).toContain('l3 has engaged');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // A1 — l1 overruled preemptively (before it ever runs), l3 ready → forced to
  //      run → rejects → passage BLOCKED.
  // ===========================================================================
  given('[case2] A1 — l1 overruled preemptively, l3 ready → passage blocked', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-a1' });
      await setStone({ tempDir, as: 'overruled' }); // wave l1 before it ever runs
      return { tempDir };
    });

    when('[t0] pass attempted with l1 pre-overruled, l3 never run', () => {
      const result = useThen('the pass', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('CLAMP: passage BLOCKED — a ready l3 is not a silent pass', () => {
        expect(result.code).toEqual(2); // constraint (blocked), not 1 (malfunction)
        expect(result.stdout).not.toContain('passage = allowed');
        expect(result.stdout).not.toContain('passage = overruled');
      });

      then('CLAMP: l3 was FORCED to engage and blocks (not blocked for another reason)', () => {
        // .why = a negative-only assertion could pass if the stone blocked for some other
        //        cause without l3 ever engaged. positively assert l3 ran + rejected, so
        //        this case truly proves "a ready l3 is forced to engage", not merely "blocked".
        expect(result.stdout).toContain('premium-checker');
        expect(result.stdout).toMatch(
          /premium-checker[\s\S]*rejected|premium-checker[\s\S]*blocker/,
        );
      });

      then('DISPLAY: no false "awaits l1 terminal" once l1 is overruled', () => {
        // .why = same verified defect as case1, at the preemptive-overrule boundary: l3 ran
        //        (forced by the overrule-unlock), so it must render its verdict, never `awaits`.
        expect(result.stdout).not.toContain('awaits l1 terminal');
      });

      then('DISPLAY: l1 carries the forgiven marker + the footer fires', () => {
        expect(result.stdout).toContain('overruled ✓ — forgiven by human');
        expect(result.stdout).toContain('l1 is terminal (overruled ✓)');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // B1 — the honest happy path: l1 overruled, l3 APPROVES → passage allowed.
  //      the driver genuinely converged l3; passage is legitimate.
  // ===========================================================================
  given('[case3] B1 — l1 overruled, l3 approves → passage overruled (allowed)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-b1' });
      await fs.writeFile(path.join(tempDir, '.test', 'l3-should-pass'), ''); // l3 converges
      await setStone({ tempDir, as: 'passed' }); // l1 rejects, l3 locked
      await setStone({ tempDir, as: 'overruled' }); // wave l1
      return { tempDir };
    });

    when('[t0] pass attempted (l1 overruled, l3 approves)', () => {
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
  // C2 — the deliberate double-overrule: human waves l1 AND l3. this is a
  //      legitimate, attributable human decision → passage allowed. it is the
  //      ONLY way to "skip" l3, and it is loud and explicit (contrast A2).
  // ===========================================================================
  given('[case4] C2 — l1 overruled then l3 overruled → passage overruled (allowed)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-c2' });
      await setStone({ tempDir, as: 'passed' }); // l1 rejects, l3 locked
      await setStone({ tempDir, as: 'overruled' }); // wave l1 (active level = l1)
      await setStone({ tempDir, as: 'passed' }); // l3 runs, rejects → still blocked
      await setStone({ tempDir, as: 'overruled' }); // wave l3 (active level = l3 now)
      return { tempDir };
    });

    when('[t0] pass attempted after BOTH levels overruled', () => {
      const result = useThen('the pass', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('passage is allowed (overruled) — human waved both levels', () => {
        expect(result.stdout).toContain('passage = overruled');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // A2-hash — the hash-divergence probe (vision hypothesis #2). the strongest
  //   residual leak candidate: overrule l1, pass (l3 rejects under hash H1),
  //   CHANGE the artifact (hash H2), pass again. the danger is that the judge
  //   tallies review files for H2 — where only l1's forgiven file exists and
  //   l3 has not yet re-run — and finds zero blockers → a false pass.
  //   the invariant demands l3 RE-RUN under H2 and block. this must stay green.
  // ===========================================================================
  given('[case5] A2-hash — l1 overruled, artifact changes, l3 re-runs → passage blocked', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-a2-hash' });
      await setStone({ tempDir, as: 'passed' }); // l1 rejects, l3 locked (hash H1)
      await setStone({ tempDir, as: 'overruled' }); // wave l1
      await setStone({ tempDir, as: 'passed' }); // l3 runs, rejects (hash H1)
      // change the artifact → new hash H2; l3 must re-run, not be skipped
      await fs.writeFile(
        path.join(tempDir, '1.feature.md'),
        '# Feature\n\nImplemented — revised, new hash.',
      );
      return { tempDir };
    });

    when('[t0] pass attempted after the artifact changed', () => {
      const result = useThen('the pass', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('CLAMP: passage BLOCKED — l3 re-runs under the new hash, not skipped', () => {
        expect(result.code).toEqual(2); // constraint (blocked), not 1 (malfunction)
        expect(result.stdout).not.toContain('passage = allowed');
        expect(result.stdout).not.toContain('passage = overruled');
      });

      then('CLAMP: l3 (premium-checker) re-ran and blocks', () => {
        expect(result.stdout).toContain('premium-checker');
        expect(result.stdout).toMatch(
          /premium-checker[\s\S]*rejected|premium-checker[\s\S]*blocker/,
        );
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // C4 — pass BEFORE any overrule → l1 blocks, l3 never reachable. the baseline
  //   must-block: with no overrule at all, a rejected l1 stops the stone and l3
  //   stays locked (awaits l1 terminal). proves the ladder gates from the bottom.
  // ===========================================================================
  given('[case6] C4 — pass before any overrule → l1 blocks, l3 locked', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-c4' });
      return { tempDir };
    });

    when('[t0] pass attempted with no overrule (l1 rejects)', () => {
      const result = useThen('the pass', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('CLAMP: passage BLOCKED — l1 rejects, no overrule to wave it', () => {
        expect(result.code).toEqual(2); // constraint (blocked), not 1 (malfunction)
        expect(result.stdout).not.toContain('passage = allowed');
        expect(result.stdout).not.toContain('passage = overruled');
      });

      then('CLAMP: l1 (basic-checker) blocks; l3 stays locked (awaits l1 terminal)', () => {
        expect(result.stdout).toContain('basic-checker');
        expect(result.stdout).toMatch(/basic-checker[\s\S]*rejected/);
        expect(result.stdout).toMatch(/premium-checker[\s\S]*awaits/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // C1 — the vision's day-in-the-life converge sequence: overrule l1 → pass
  //   (l3 rejects → BLOCKED) → driver fixes l3 → pass (l3 approves → ALLOWED).
  //   proves the driver is FORCED to drive l3 to a real verdict, then passes
  //   honestly once l3 converges. the full "block, then allow" arc in one case.
  // ===========================================================================
  given('[case7] C1 — overrule l1, l3 blocks, driver converges l3, then passes', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-c1' });
      await setStone({ tempDir, as: 'passed' }); // l1 rejects, l3 locked
      await setStone({ tempDir, as: 'overruled' }); // wave l1 → l3 becomes the live gate
      return { tempDir };
    });

    // step 1: l3 rejects → the stone is BLOCKED (the driver cannot skip it)
    const blockedResult = useWhen('[t0] pass with l3 un-converged', () => {
      const result = useThen('l3 blocks the pass', async () =>
        setStone({ tempDir: scene.tempDir, as: 'passed' }),
      );

      then('CLAMP: passage BLOCKED — driver forced to drive l3', () => {
        expect(result.code).toEqual(2); // constraint (blocked), not 1 (malfunction)
        expect(result.stdout).not.toContain('passage = allowed');
        expect(result.stdout).not.toContain('passage = overruled');
        expect(result.stdout).toMatch(
          /premium-checker[\s\S]*rejected|premium-checker[\s\S]*blocker/,
        );
      });

      then('stdout has good vibes (the blocked state, snapped)', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });

      return result;
    });

    // step 2: driver converges l3 (fixes the code) → pass now ALLOWED
    when('[t1] driver converges l3, then passes', () => {
      const result = useThen('the honest pass', async () => {
        // the driver fixes l3's complaint — l3 now approves. the flag alone does
        // not re-trigger l3 (it sits outside the artifact glob), so also revise the
        // artifact to bump the review hash → l3 re-runs and reads the pass flag.
        // l1's overrule marker persists across the hash change (see case5=A2-hash).
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'l3-should-pass'),
          '',
        );
        await fs.writeFile(
          path.join(scene.tempDir, '1.feature.md'),
          '# Feature\n\nImplemented — revised so l3 re-reviews and converges.',
        );
        return setStone({ tempDir: scene.tempDir, as: 'passed' });
      });

      then('the prior step truly blocked (sequence precondition holds)', () => {
        expect(blockedResult.code).toEqual(2); // constraint (blocked)
      });

      then('exit code is 0 — passage now allowed', () => {
        expect(result.code).toEqual(0);
      });

      then('passage = overruled (l1 waved, l3 genuinely approved)', () => {
        expect(result.stdout).toContain('passage = overruled');
        expect(result.stdout).toMatch(/premium-checker[\s\S]*approved/);
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // overrule-confirmation — the vision's "outcome world" showcase: an overrule
  //   of l1 emits `level 1, overruled` / `level 3, ready`, which names BOTH the
  //   waved level and the unlocked-next gate. captured + asserted here so the
  //   skip suite clamps the confirmation UX directly (also clamped extant in
  //   driver.route.overrule case15[t1]) — proves the human's overrule is
  //   attributed to a specific level and that l3 is announced as the live gate.
  // ===========================================================================
  given('[case8] overrule-confirm — an l1 overrule names the waved level + the ready l3 gate', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-confirm' });
      await setStone({ tempDir, as: 'passed' }); // l1 rejects, l3 locked
      return { tempDir };
    });

    when('[t0] human overrules the active level (l1)', () => {
      const result = useThen('the overrule', async () =>
        setStone({ tempDir: scene.tempDir, as: 'overruled' }),
      );

      then('CLAMP: confirmation names the waved level AND the unlocked-next gate', () => {
        expect(result.stdout).toContain('level 1, overruled');
        expect(result.stdout).toContain('level 3, ready');
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // ===========================================================================
  // the standalone judge path — the queued-precondition's DIRECT trigger.
  //   the vision's "honest gap": via --as passed, setStoneAsPassed runs every
  //   unlocked level BEFORE the judge, so a live journey cannot hold l3 queued.
  //   but `route.stone.judge` invoked ON ITS OWN sees an unlocked-but-unrun l3
  //   (l1 overruled → l3 unlocked, yet never run) and MUST block it — the
  //   defense-in-depth the queued-precondition exists for. this case pins that
  //   user-faced error path (passed: false + "not yet run" reason + exit 2).
  // ===========================================================================
  given('[case9] standalone judge — l1 overruled, l3 unlocked+queued → judge blocks', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = await genScene({ slug: 'overrule-skip-judge' });
      await setStone({ tempDir, as: 'passed' }); // l1 rejects, l3 locked
      await setStone({ tempDir, as: 'overruled' }); // wave l1 → l3 unlocked, yet never run
      return { tempDir };
    });

    when('[t0] the judge is invoked directly (not via --as passed)', () => {
      const result = useThen('the judge blocks the unrun l3', async () =>
        invokeRouteSkill({
          skill: 'route.stone.judge',
          args: {
            mechanism: 'reviewed?',
            stone: '1.feature',
            route: '.',
            'allow-blockers': '0',
            'allow-nitpicks': '3',
          },
          cwd: scene.tempDir,
        }),
      );

      then('CLAMP: passage BLOCKED — the queued l3 is not a silent pass', () => {
        expect(result.code).toEqual(2);
        expect(result.stdout).toContain('passed: false');
        expect(result.stdout).toMatch(
          /review level 3 not yet run \(still queued\)/,
        );
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });
});
