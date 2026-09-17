import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { answerEveryPeerGiven } from './.test/answerEveryPeerGiven';
import { getAllPourAnnounceLines } from './.test/getAllPourAnnounceLines';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';
import {
  clearReviewWindows,
  computeMaxInFlight,
  readReviewWindows,
} from './.test/readReviewWindows';

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/route-peer-concurrency-default',
);

/**
 * .mock = reviewer subprocess (mock-window.sh)
 * .why = real reviewers cost LLM tokens; these mocks emit wall-clock overlap
 *        windows that `readReviewWindows` measures to prove concurrency clamps
 * .real = the full acceptance suite at `--scope peer-budget` exercises real
 *         reviewer subprocesses via `rhx review`; this suite's concern is the
 *         concurrency primitive, not the reviewer contract
 */

/**
 * .what = `RHACHET_LEVEL_CONCURRENCY` — the operator's run-time override of the
 *         level default — asserted against the SAME twelve-wide level the default
 *         clamp uses
 * .why = the default `10` is fulcrum F2's open call. permissive is settled; the
 *        value awaits the wisher. so the override is what lets an operator move it
 *        with no code edit and no snapshot re-baseline, and an escape hatch nobody
 *        proved is an escape hatch nobody can rely on.
 *
 * .note = it reuses the default fixture rather than a fresh one, deliberately. the
 *         property under test is *the override beats the default*, so the two
 *         clamps must range over the identical roster — a second fixture would let
 *         a difference in the roster masquerade as the override at work.
 *
 * .note = `2`, never `1`. a bound of one is indistinguishable from a serial walk,
 *         so it cannot part "the override bound the pour" from "concurrency broke
 *         entirely" — the same pair the default clamp draws with its
 *         `toBeGreaterThan(1)` half.
 */
describe('driver.route.peer-concurrency-env.acceptance', () => {
  given('[journey] a level of twelve, with the env override set to two', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-concurrency-env',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-window.sh', { cwd: tempDir });

      return { tempDir };
    });

    when('[t0] the stone arrives under RHACHET_LEVEL_CONCURRENCY=2', () => {
      const result = useThen('the stone blocks at l1', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );

        await clearReviewWindows({ cwd: scene.tempDir });
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
          env: { RHACHET_LEVEL_CONCURRENCY: '2' },
        });
      });

      const observed = useThen('the windows are read', async () => {
        const windows = await readReviewWindows({ cwd: scene.tempDir });
        return {
          count: windows.length,
          peak: computeMaxInFlight({ windows }),
        };
      });

      then('every one of the twelve still ran', () => {
        // .why = the override governs how many run AT ONCE, never how many run.
        //        a clamp on the peak alone would green if the override silently
        //        dropped lanes rather than held them in a queue
        expect(observed.count).toEqual(12);
      });

      then('CLAMP: the env override binds, below the default', () => {
        // 🔴 .why = the teeth. `2` sits strictly under `DEFAULT_LEVEL_CONCURRENCY`
        //           = 10, so this line can only pass if the override was read.
        //
        // ✅ .proven = `getDefaultLevelConcurrency()` reverted to the bare
        //             `DEFAULT_LEVEL_CONCURRENCY` const — this line alone went red
        //             at `Expected: <= 2 / Received: 10`, while the other four
        //             stayed green. restored → 5/5. so it bites THIS override and
        //             no neighbour's.
        expect(observed.peak).toBeLessThanOrEqual(2);
      });

      then('CLAMP: the override still fans out — it is not a serial walk', () => {
        // .why = the limit above is satisfied by a peak of 1, so it cannot part
        //        "bound at two" from "not concurrent at all". the two clamps are
        //        only meaningful together
        expect(observed.peak).toBeGreaterThan(1);
      });

      then('the pour announce reads as declared', () => {
        // .why = the env override clamps prove the BOUND held; this frame pins
        //        the HEADER — `🦉 l1 pours 12 lanes · ≤2 at a time` plus the
        //        12-member roster. without it, a change to the announce format
        //        (e.g. a dropped ` · ≤2 at a time` clause) would pass both
        //        numeric clamps and go unnoticed — the same gap the nitpick raised
        const lines = getAllPourAnnounceLines(result.stderr);
        expect(lines).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        // .why = `rule.require.snapshot-every-journey-step` — the env override
        //        clamps above prove the BOUND held; this frame proves the RENDER
        //        is coherent for a driver who reads the log under an override.
        //        without it, a change that altered the pour announce or the
        //        verdict tree would pass both numeric clamps and go unnoticed
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });
  });

  // 🔴 .why the malformed case exists = the journey above proves a VALID override
  //     binds. a typo'd override (`export RHACHET_LEVEL_CONCURRENCY=abc`) reads
  //     through the same `asGuardPositiveInt` refusal, and the error an operator
  //     actually receives was clamped in the unit suite alone — so its rendered
  //     shape was shown to no reviewer and could drift unnoticed, the same friction
  //     gap the `.guard`-key refusals close (rule.forbid.friction-hazards, i020/r009)
  given('[malformed] the operator override is not a positive integer', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-concurrency-env-malformed',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-window.sh', { cwd: tempDir });
      await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, 'src', 'feature.ts'),
        'export const feature = () => "v1";',
      );

      return { tempDir };
    });

    when('[t0] the stone arrives under RHACHET_LEVEL_CONCURRENCY=abc', () => {
      const result = useThen('the pour refuses the override', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
          env: { RHACHET_LEVEL_CONCURRENCY: 'abc' },
        }),
      );

      then('CLAMP: the stone refuses as a CONSTRAINT, exit 2', () => {
        // .why = a malformed override cannot silently fall back to the default —
        //        the operator asked for a bound and gave a value the pour cannot
        //        read, so it refuses loud rather than pour at a number they did not set
        //
        // 🔴 .why exactly 2, never merely non-zero = the typo is caller-fixable, so
        //        `asGuardPositiveInt` throws a `BadRequestError` the cli maps to exit
        //        2 (a constraint). a bare `not.toEqual(0)` would ALSO pass on a
        //        malfunction (exit 1) — a green for the wrong class, the same gap the
        //        `peer-concurrency-refusals` suite closed at i017/r2. tightened to
        //        match that suite, so a refusal misclassified as a malfunction goes
        //        red here (i025/r2)
        expect(result.code).toEqual(2);
      });

      then('CLAMP: the message names the env var and the fault', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('RHACHET_LEVEL_CONCURRENCY');
      });

      then('the refusal reads as an error, never a stack trace', () => {
        const output = result.stdout + result.stderr;
        expect(output).toMatchSnapshot();
      });
    });

    // 🔴 .why the empty-string case is distinct from [t0] = `RHACHET_LEVEL_CONCURRENCY=abc`
    //     renders `declares "abc"`. `export RHACHET_LEVEL_CONCURRENCY=` (the most likely
    //     accidental typo in a shell profile) renders `declares ""` — a distinct byte
    //     string that the [t0] snapshot does not pin. the unit suite ([case6] of
    //     asGuardPositiveInt.test.ts) proves the transformer refuses an empty string,
    //     but never pins the RENDERED shape a driver meets at the acceptance grain.
    //     one snapshot commits the exact message bytes; a drift in the template
    //     (e.g. a quote dropped) would otherwise ship undetected
    when('[t1] the stone arrives under RHACHET_LEVEL_CONCURRENCY= (empty)', () => {
      const result = useThen('the pour refuses the empty override', async () =>
        invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
          env: { RHACHET_LEVEL_CONCURRENCY: '' },
        }),
      );

      then('CLAMP: the stone refuses as a CONSTRAINT, exit 2', () => {
        // .why = an empty string is `!== undefined`, so it reaches `asGuardPositiveInt`
        //        rather than defer to the default — `parseInt('')` is `NaN`, and a NaN
        //        bound never binds. the throw prevents a pour that fans out uncapped
        //        while the operator believes a bound is in force
        expect(result.code).toEqual(2);
      });

      then('CLAMP: the message names the env var and the fault', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('RHACHET_LEVEL_CONCURRENCY');
      });

      then('the refusal renders `declares ""` — distinct from the abc variant', () => {
        // .why = the byte string `declares ""` is the value under test here; the
        //        snapshot is the oracle. a regression that drops the quotes or merges
        //        the two templates would surface here and not at [t0]
        const output = result.stdout + result.stderr;
        expect(output).toMatchSnapshot();
      });
    });
  });
});
