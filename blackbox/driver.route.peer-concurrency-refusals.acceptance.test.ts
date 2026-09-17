import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-concurrency');

/**
 * .mock = the reviewer subprocess each guard below names (`.test/mock-window.sh`)
 * .why = every case in this suite is refused at PARSE, before a lane is ever spawned —
 *        so the mock is never executed here. it is present only because a guard must
 *        name a runnable command to be well-formed at all; the refusal fires on the
 *        concurrency declaration, which is the sole subject under test.
 * .real = `driver.route.peer-concurrency.acceptance.test.ts` runs this same fixture's
 *         reviewers for real, on wall-clock windows, and is the live boundary contract
 *         for the pour itself. this suite deliberately never reaches that path.
 *
 * ⚠️ .note = the annotation is owed even where the mock cannot run (raised i012, i014,
 *    and again i016). a reader cannot part "mocked and never spawned" from "mocked and
 *    silently substituted" without it, and only the first is sound
 *    (`rule.forbid.acceptance.mocks`).
 */

/**
 * .what = the reviewer block every case below shares, so each case's guard differs
 *         ONLY in the concurrency declaration it is written to exercise
 * .why = a fixture that varies in two places cannot prove which one was refused
 */
const REVIEWERS = `artifacts:
  - src/**/*.ts

reviews:
  peer:
    - slug: l1-a
      run: bash $route/.test/mock-window.sh l1-a
      budget: 5
      level: 1
`;

/**
 * .what = clones the fixture, overwrites its guard, and arrives the stone
 * .why = every refusal case is the same three moves; only the guard body varies
 */
const arriveWithGuard = async (input: {
  slug: string;
  guard: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const tempDir = genTempDirForRhachet({
    slug: input.slug,
    clone: ASSETS_DIR,
  });

  await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
  await fs.mkdir(path.join(tempDir, 'src'), { recursive: true });
  await fs.writeFile(
    path.join(tempDir, 'src', 'feature.ts'),
    'export const feature = () => "v1";',
  );
  await fs.writeFile(path.join(tempDir, '1.vision.guard'), input.guard);

  return invokeRouteSkill({
    skill: 'route.stone.set',
    args: { stone: '1.vision', route: '.', as: 'passed' },
    cwd: tempDir,
  });
};

/**
 * .what = the parse-time refusals a driver meets, seen END TO END
 * .why = the unit suite clamps that parseStoneGuard THROWS. this clamps what the
 *        driver actually receives: a non-zero exit, and an error that names the fix
 *        rather than a stack trace.
 *
 * .note = a bound that fails open is worse than an absent one — an author who
 *         mistypes a group believes they capped a level that then fans out. so
 *         every case here asserts BOTH that the stone did not pass AND that the
 *         message says what to do (rule.require.errors-name-the-fix)
 *
 * .note = no reviewer runs in any case below. the refusal fires at parse, before a
 *         subprocess exists — which is the whole point of a parse-time invariant
 *
 * 🔴 .note = each case ALSO snapshots the whole refusal, and the pair is deliberate
 *            (`rule.require.snapshots`). a `toContain` proves the fix is NAMED; it
 *            cannot prove the docblock's other claim — *"an error that names the fix
 *            rather than a stack trace"* — because a stack trace with the phrase
 *            buried in it passes every `toContain` here. the snapshot is what puts
 *            the message's SHAPE in front of a reviewer in the diff.
 *
 *            ⇒ the snapshot is stable by construction: a parse refusal runs no
 *              reviewer, so there is no artifact hash and no elapsed clock to churn.
 */
describe('driver.route.peer-concurrency-refusals.acceptance', () => {
  given('[case1] a reviewer names a group with no bound declared', () => {
    when('[t0] the stone arrives', () => {
      const result = useThen('the guard refuses it', async () =>
        arriveWithGuard({
          slug: 'concurrency-undeclared',
          guard: `${REVIEWERS}      group: anthropic

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0 --allow-nitpicks 1
`,
        }),
      );

      then('CLAMP: [case7] the stone does not pass', () => {
        expect(result.code).toEqual(2); // constraint (2), never malfunction (1) — a bad guard is caller-must-fix
      });

      then('CLAMP: [case7] the message names the group and the fix', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('anthropic');
        expect(output).toContain('reviews.groups');
      });

      then('the refusal reads as an error, never a stack trace', () => {
        expect(
          sanitizeTimeForSnapshot(result.stdout + result.stderr),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case2] a group is declared that no reviewer joined', () => {
    when('[t0] the stone arrives', () => {
      const result = useThen('the guard refuses it', async () =>
        arriveWithGuard({
          slug: 'concurrency-phantom',
          guard: `${REVIEWERS}
  groups:
    anthropic:
      concurrency: 2

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0 --allow-nitpicks 1
`,
        }),
      );

      then('CLAMP: [case3] the stone does not pass', () => {
        // .why = a bound at a level nobody sits at is INERT, never harmless. the
        //        author believes a cap is in force; the level fans out uncapped
        expect(result.code).toEqual(2); // constraint (2), never malfunction (1) — a bad guard is caller-must-fix
      });

      then('CLAMP: [case3] the message names the group and the fix', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('anthropic');
        expect(output).toContain('no members');
      });

      then('the refusal reads as an error, never a stack trace', () => {
        expect(
          sanitizeTimeForSnapshot(result.stdout + result.stderr),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case3] one group carries two bounds, and the values MATCH', () => {
    when('[t0] the stone arrives', () => {
      const result = useThen('the guard refuses it anyway', async () =>
        arriveWithGuard({
          slug: 'concurrency-duplicate',
          guard: `${REVIEWERS}      group: anthropic

  groups:
    anthropic:
      concurrency: 2
      concurrency: 2

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0 --allow-nitpicks 1
`,
        }),
      );

      then('CLAMP: [case3] agreement does not excuse the duplicate', () => {
        // .why = THE clamp fulcrum F3 asks for. two declarations of one fact is an
        //        ambiguity whichever way it is settled — to pick the last silently
        //        teaches an author that duplicates are fine, and the next duplicate
        //        will disagree. so the MATCHING pair is the case this exists to catch
        expect(result.code).toEqual(2); // constraint (2), never malfunction (1) — a bad guard is caller-must-fix
      });

      then('CLAMP: [case3] the message says a group carries one bound', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('anthropic');
        expect(output).toContain('even if the values match');
      });

      then('the refusal reads as an error, never a stack trace', () => {
        expect(
          sanitizeTimeForSnapshot(result.stdout + result.stderr),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case4] a bound is not a positive integer', () => {
    when('[t0] the stone arrives with concurrency: 0', () => {
      const result = useThen('the guard refuses it', async () =>
        arriveWithGuard({
          slug: 'concurrency-zero',
          guard: `${REVIEWERS}      group: anthropic

  groups:
    anthropic:
      concurrency: 0

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0 --allow-nitpicks 1
`,
        }),
      );

      then('CLAMP: [case7] a bound of zero halts the level forever', () => {
        // .why = `concurrency: 0` admits no reviewer, so the level never settles and
        //        the guard hangs on a queue that never drains. refused at parse
        //        rather than diagnosed at 3am
        expect(result.code).toEqual(2); // constraint (2), never malfunction (1) — a bad guard is caller-must-fix
      });

      then('CLAMP: [case7] the message names the value it read', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('anthropic');
      });

      then('the refusal reads as an error, never a stack trace', () => {
        expect(
          sanitizeTimeForSnapshot(result.stdout + result.stderr),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case5] the bound is written on the REVIEWER, not on the group', () => {
    when('[t0] the stone arrives', () => {
      const result = useThen('the guard refuses it', async () =>
        arriveWithGuard({
          slug: 'concurrency-misplaced',
          guard: `${REVIEWERS}      concurrency: 2

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0 --allow-nitpicks 1
`,
        }),
      );

      then('CLAMP: [case7][t3] a bound at a key the parser reads not', () => {
        // .why = the ONE refusal that protects the wish's second outcome. the other
        //        four guard against an author who declares too much; this guards
        //        against a valve that is SILENTLY ABSENT. with no refusal the line
        //        parses clean, the cap never binds, and the level fans out while the
        //        author believes it is capped — a valve that fails open
        expect(result.code).toEqual(2); // constraint (2), never malfunction (1) — a bad guard is caller-must-fix
      });

      then('CLAMP: [case7][t3] the message names the key and the fix', () => {
        // 🔴 .note = BOTH assertions are load-bearing, and each catches what the
        //            other misses. neither alone is a clamp.
        //
        //            the vision (`case=7`) argued for the exit code: *"a clamp on
        //            the message alone would be toothless — a run that parses clean
        //            and WARNS to stderr would satisfy it"*. true.
        //
        //            measured 2026-09-09, the converse: with the refusal disabled
        //            the suite went 2 passed / 1 failed, and the failure was HERE.
        //            `code !== 0` passed under the defect — a silently dropped
        //            bound leaves the reviewer to run and REJECT, so the stone
        //            fails anyway, for a reason unrelated to the defect.
        //
        //            ⇒ exit-code-only reads green under a silent drop; message-only
        //              reads green under a mere warn. keep both.
        const output = result.stdout + result.stderr;
        expect(output).toContain('concurrency: 2');
        expect(output).toContain('reviews.groups');
      });

      then('the refusal reads as an error, never a stack trace', () => {
        expect(
          sanitizeTimeForSnapshot(result.stdout + result.stderr),
        ).toMatchSnapshot();
      });
    });
  });

  // 🔴 .why cases 6-8 exist = the five above cover the CONCURRENCY keys only.
  //     `budget:`, `level:`, and a stray `concurrency:` read through the SAME
  //     `asGuardPositiveInt` refusal and the same parse-time throw, and each is a
  //     user-seen error a guard author meets — yet each was clamped in the unit
  //     suite alone (`parseStoneGuard.test.ts`), so the exact message a driver sees
  //     was shown to no reviewer and could drift in rendered form unnoticed
  //     (rule.require.errors-name-the-fix / rule.forbid.friction-hazards, i020/r009)

  given('[case6] a budget is not a positive integer', () => {
    when('[t0] the stone arrives with budget: abc', () => {
      const result = useThen('the guard refuses it', async () =>
        arriveWithGuard({
          slug: 'budget-nonint',
          guard: `artifacts:
  - src/**/*.ts

reviews:
  peer:
    - slug: l1-a
      run: bash $route/.test/mock-window.sh l1-a
      budget: abc
      level: 1

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0 --allow-nitpicks 1
`,
        }),
      );

      then('CLAMP: the stone does not pass', () => {
        expect(result.code).toEqual(2); // constraint (2) — a bad guard is caller-must-fix
      });

      then('CLAMP: the message names the value and the fix', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('budget');
      });

      then('the refusal reads as an error, never a stack trace', () => {
        expect(
          sanitizeTimeForSnapshot(result.stdout + result.stderr),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case7] a level is not a positive integer', () => {
    when('[t0] the stone arrives with level: 1.5', () => {
      const result = useThen('the guard refuses it', async () =>
        arriveWithGuard({
          slug: 'level-nonint',
          guard: `artifacts:
  - src/**/*.ts

reviews:
  peer:
    - slug: l1-a
      run: bash $route/.test/mock-window.sh l1-a
      budget: 5
      level: 1.5

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0 --allow-nitpicks 1
`,
        }),
      );

      then('CLAMP: the stone does not pass', () => {
        // .why = `parseInt` would SILENTLY truncate `1.5` to `1`, so the author's
        //        `1.5` binds as `1` with no line of output to say so. the refusal
        //        surfaces the typo rather than take a value the author did not mean
        expect(result.code).toEqual(2); // constraint (2) — a bad guard is caller-must-fix
      });

      then('CLAMP: the message names the value and the fix', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('positive integer');
        expect(output).toContain('level');
      });

      then('the refusal reads as an error, never a stack trace', () => {
        expect(
          sanitizeTimeForSnapshot(result.stdout + result.stderr),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case8] a concurrency bound sits under groups with no group name', () => {
    when('[t0] the stone arrives with a stray concurrency', () => {
      const result = useThen('the guard refuses it', async () =>
        arriveWithGuard({
          slug: 'concurrency-stray',
          guard: `${REVIEWERS}      group: anthropic

  groups:
    concurrency: 2

judges:
  - rhx route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0 --allow-nitpicks 1
`,
        }),
      );

      then('CLAMP: the stone does not pass', () => {
        // .why = a bound with no group name above it names no group, so it caps
        //        naught — the same fail-open shape [case5] guards, one indent up
        expect(result.code).toEqual(2); // constraint (2) — a bad guard is caller-must-fix
      });

      then('CLAMP: the message names the fix — declare the group first', () => {
        const output = result.stdout + result.stderr;
        expect(output).toContain('group name');
        expect(output).toContain('reviews.groups');
      });

      then('the refusal reads as an error, never a stack trace', () => {
        expect(
          sanitizeTimeForSnapshot(result.stdout + result.stderr),
        ).toMatchSnapshot();
      });
    });
  });
});
