import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { answerEveryPeerGiven } from './.test/answerEveryPeerGiven';
import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-budget');

/**
 * .what = live CLI coverage for the budget gate's REFUSAL path — the behavior whose whole
 *         purpose is to refuse
 * .why = the gate is a branch inside `routeGuardBudget`: it calls `computeBudgetGrantRefusal`,
 *        renders `formatBudgetGrantRefusalLines` to stderr, and exits 2. every OTHER suite in
 *        this corpus either pre-mints a live urgent concession in its setup (the GRANTED path)
 *        or fails at flag validation ABOVE the gate — so before this file the refusal was proven
 *        only at the pure-transformer + snapshot grain.
 *
 * 🔴 .what that left unproven is the BRANCH, and every one of these regressions ships green
 *    under a unit-only corpus (raised i001/r008 b1 + r009 b1):
 *
 *    | the regression | who catches it |
 *    |---|---|
 *    | the gate moved BELOW the write | only a byte-compare of the guard file |
 *    | `process.exit(2)` dropped, or changed to 0/1 | only a live exit-code assertion |
 *    | the refusal written to stdout | only a live stream assertion |
 *    | the remedy block cut from the render | only a live stderr read |
 *
 * 🔴 .the first three cases are the gate's three conjuncts, one apiece, and they are ordered as
 *    the gate orders them — scope → warrant → moment (`computeBudgetGrantRefusal`). so `[case1]`
 *    reaches the warrant only because its `--stone` resolved to one, and `[case3]` reaches the
 *    moment only because a warrant stands.
 *
 * 🔴 .`[case4]` is not a fourth conjunct — it is the WISH's own journey through the warrant one.
 *    `[case1]` refuses an EMPTY ledger, which proves the gate reads a warrant and not that it
 *    reads the severity on one. `[case4]` spends the whole budget, concedes every concern
 *    `better`, and is refused anyway — the loop the wish measures, end to end (i003/r008 n1).
 *
 * ⚠️ .the guard-unchanged assertion is the one that pins `rule.require.failfast` here. the gate
 *    reads BEFORE the write for exactly this reason: read after, and a refusal leaves a mutated
 *    guard file with no emit to explain it.
 */
describe('driver.route.peer-budget-refusal.acceptance', () => {
  given('[case1] a grant sought with no live urgent concession', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-refusal-no-warrant',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-budget-refusal', {
        cwd: tempDir,
      });

      const guardPath = path.join(tempDir, '1.execute.guard');
      const guardBefore = await fs.readFile(guardPath, 'utf-8');

      return { tempDir, guardPath, guardBefore };
    });

    when('[t0] the budget command is invoked', () => {
      const result = useThen('the grant is refused', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: {
            for: 'review',
            add: '2',
            route: '.',
            peer: 'mock-reviewer',
            stone: '1.execute',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 — a constraint the caller must fix', () => {
        // the caller can earn the round or converge; neither is a server fault
        // (rule.require.exit-code-semantics)
        expect(result.code).toEqual(2);
      });

      then('the refusal is on stderr, never stdout', () => {
        // rule.forbid.stdout-on-exit-errors — stdout may be hidden on a non-zero exit
        expect(result.stderr).toContain('budget refused');
        expect(result.stdout).not.toContain('budget refused');
      });

      then('the refusal names WHY it refused', () => {
        expect(result.stderr).toContain(
          'a grant needs a live urgent concession',
        );
      });

      then('the refusal names the sanctioned move — req 5', () => {
        // converge, then re-arrive: the driver's own lever, and the FIRST one offered
        expect(result.stderr).toContain('--as absorbed');
        // or grade a concern urgent, where one ships nameable harm
        expect(result.stderr).toContain('--severity urgent');
        // and the harm set, so the driver learns how to grade at the moment it matters
        expect(result.stderr).toContain('security');
      });

      then('the remedy block claims NO human is needed', () => {
        // rule.always.spend-own-levers-before-escalation — the driver's lever at this cell is
        // convergence, so the block must not send them to a foreman for a round they can earn
        expect(result.stderr).toContain('yours to run, no human needed');
      });

      then('🔴 the guard file is byte-identical — the gate read before the write', async () => {
        // the whole reason the gate sits above the write. a refusal that mutated the guard
        // would leave a changed budget with no emit to explain it (rule.require.failfast)
        const guardAfter = await fs.readFile(scene.guardPath, 'utf-8');
        expect(guardAfter).toEqual(scene.guardBefore);
      });

      then('stderr has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'refusal — no warrant',
        );
      });
    });
  });

  given('[case2] a --stone prefix that resolves to several stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-refusal-multi-stone',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-budget-multi', {
        cwd: tempDir,
      });

      // 🔴 a SECOND stone that is a PEER of the first, never a descendant of it. the `--stone`
      //    filter is delimiter-aware (`isStoneMatchedByName`), so `1` names both — which is the
      //    F12 scope conjunct's whole subject: one warrant would otherwise buy rounds on every
      //    stone the prefix reached.
      //
      // ⚠️ `1.execute` names `1.execute` ALONE, and `[t1]` pins that. the two facts together are
      //    what make the refusal's own remedy runnable: it prints "name the one stone you meant,
      //    in full", and the full name must then resolve to one. it did not until i002/r009 b1 —
      //    the filter was a bare `startsWith`, so the remedy re-matched both and refused again,
      //    which left `1.execute` un-grantable for the life of the route.
      const guardBase = await fs.readFile(
        path.join(tempDir, '1.execute.guard'),
        'utf-8',
      );
      await fs.writeFile(path.join(tempDir, '1.execute-b.guard'), guardBase);
      await fs.writeFile(
        path.join(tempDir, '1.execute-b.stone'),
        'a peer stone whose name shares the first stone prefix\n',
      );

      const guardPaths = [
        path.join(tempDir, '1.execute.guard'),
        path.join(tempDir, '1.execute-b.guard'),
      ];
      const guardsBefore = await Promise.all(
        guardPaths.map((p) => fs.readFile(p, 'utf-8')),
      );

      return { tempDir, guardPaths, guardsBefore };
    });

    when('[t0] the budget command is invoked with the prefix', () => {
      const result = useThen('the grant is refused', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: '2', route: '.', stone: '1' },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal is on stderr, never stdout', () => {
        expect(result.stderr).toContain('budget refused');
        expect(result.stdout).not.toContain('budget refused');
      });

      then('the refusal names the SCOPE, never the warrant', () => {
        // 🔴 the gate's order: a multi-match is ambiguous about WHICH stone's ledger to read,
        //    so it is refused BEFORE the warrant is judged. judged after, the gate would answer
        //    a question the invocation never posed
        expect(result.stderr).toContain('--stone matched 2 stones');
        expect(result.stderr).not.toContain(
          'a grant needs a live urgent concession',
        );
      });

      then('it names every stone it matched, so the driver can re-run', () => {
        expect(result.stderr).toContain('1.execute');
        expect(result.stderr).toContain('1.execute-b');
      });

      then('🔴 both guard files are byte-identical', async () => {
        const guardsAfter = await Promise.all(
          scene.guardPaths.map((p) => fs.readFile(p, 'utf-8')),
        );
        expect(guardsAfter).toEqual(scene.guardsBefore);
      });

      then('stderr has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'refusal — stone matched many',
        );
      });
    });

    // 🔴 the remedy the scope refusal prints must RUN. it is the one clamp that parts a refusal
    //    from a dead end: the gate says "name the one stone you meant, in full", so the full name
    //    has to reach one stone. a bare-prefix filter re-matched both and refused identically, and
    //    a driver that obeyed the remedy verbatim looped forever (i002/r009 b1).
    //
    // ⚠️ this asserts the SCOPE conjunct cleared, never that the grant landed. the stone has no
    //    warrant, so the gate refuses again — at the NEXT conjunct, which is progress a driver can
    //    act on rather than the same wall twice.
    when('[t1] the remedy is obeyed — the one stone, named in full', () => {
      const result = useThen('the command runs', async () =>
        invokeRouteSkill({
          skill: 'route.guard.budget',
          args: { for: 'review', add: '2', route: '.', stone: '1.execute' },
          cwd: scene.tempDir,
        }),
      );

      then('🔴 the SCOPE refusal is gone — the full name reached one stone', () => {
        expect(result.stderr).not.toContain('--stone matched');
      });

      then('the gate moved on to the warrant', () => {
        expect(result.stderr).toContain(
          'a grant needs a live urgent concession',
        );
      });

      then('the peer stone is untouched by the narrowed invocation', async () => {
        const guardsAfter = await Promise.all(
          scene.guardPaths.map((p) => fs.readFile(p, 'utf-8')),
        );
        expect(guardsAfter).toEqual(scene.guardsBefore);
      });

      // 🔴 the TERMINAL step of the journey renders, so it is snapped.
      //    [t0] carried a snapshot and this did not, so a reviewer who follows the snapshots saw
      //    the refusal open and never saw what the remedy produced — which is the half that
      //    matters, since the whole point of [t1] is that the handed-over command LANDS
      //    (`rule.require.snapshot-every-journey-step`, raised i003/r001 n2).
      then('stderr has good vibes: the warrant refusal the remedy reached', () => {
        expect(result.stderr).toMatchSnapshot(
          'refusal — the narrowed stone, warrant absent',
        );
      });
    });
  });

  given(
    '[case3] a live urgent concession, and the reviewer still has rounds',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDirForRhachet({
          slug: 'peer-budget-refusal-rounds-remain',
          clone: ASSETS_DIR,
        });
        await execAsync('npx rhachet roles link --role driver', {
          cwd: tempDir,
        });
        await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });
        await execAsync('git checkout -b vlad/test-budget-premature', {
          cwd: tempDir,
        });
        return { tempDir };
      });

      when('[t0] one round is spent, and its concern is graded urgent', () => {
        const result = useThen('the warrant is minted', async () => {
          await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
          await fs.writeFile(
            path.join(scene.tempDir, 'src', 'feature.ts'),
            'export const feature = () => "v1";',
          );

          // round 1 — the reviewer runs and rejects, so the meter reads 1 of 2
          await invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.execute', route: '.', as: 'passed' },
            cwd: scene.tempDir,
          });

          // the driver concedes URGENT, which mints the warrant the gate reads
          await answerEveryPeerGiven({
            cwd: scene.tempDir,
            stone: '1.execute',
            severity: 'urgent',
          });

          return invokeRouteSkill({
            skill: 'route.guard.budget',
            args: {
              for: 'review',
              add: '2',
              route: '.',
              peer: 'mock-reviewer',
              stone: '1.execute',
            },
            cwd: scene.tempDir,
          });
        });

        then('exit code is 2 — a pad before the bound bites is refused', () => {
          // 🔴 F10, ruled: the warrant alone is not enough. a grant needs a reviewer that has
          //    RUN DRY, or a preemptive top-up removes the bound in advance
          expect(result.code).toEqual(2);
        });

        then('the refusal names the MOMENT, never the warrant', () => {
          expect(result.stderr).toContain('rounds remain');
          expect(result.stderr).not.toContain(
            'a grant needs a live urgent concession',
          );
        });

        then('it names the spend, so the branch condition stays checkable', () => {
          expect(result.stderr).toContain('mock-reviewer = 1/2 rounds spent');
        });

        then('the sanctioned move is to spend the rounds in hand', () => {
          expect(result.stderr).toContain('spend the rounds in hand');
          expect(result.stderr).toContain('--as passed');
        });

        then('stderr has good vibes', () => {
          expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
            'refusal — rounds remain',
          );
        });
      });
    },
  );

  /**
   * 🔴 .the WISH's headline journey, and `[case1]` cannot stand in for it.
   *    `[case1]` refuses a stone whose ledger is EMPTY, which proves the gate reads a warrant —
   *    never that it reads the SEVERITY on one. so the whole of the wish's cue was covered at the
   *    pure-unit grain alone: the loop it measures is a driver that spends every round it was
   *    given, concedes each concern `better`, and asks for more (raised i003/r008 n1).
   *
   * 🔴 .the discriminant is proven by the two facts TOGETHER, and either alone leaves the case
   *    passable for the wrong reason:
   *
   *    | the fact | what it forecloses |
   *    |---|---|
   *    | `2/2 rounds spent` | the moment conjunct would have cleared, so this is not `rounds-remain` under another name |
   *    | a `conceded` row on the ledger | a concession really does stand, so this is not `[case1]`'s empty stone with extra steps |
   *
   * ⚠️ .the artifact is edited between the rounds because a driver edits between rounds — an
   *    unchanged artifact is what the guard's hash cache reads, and a journey that skipped the
   *    edit would prove the meter drains on a re-run rather than on a round.
   */
  given('[case4] every round spent, and every concession graded better', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-budget-refusal-better-only',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-review.sh', { cwd: tempDir });
      await execAsync('git checkout -b vlad/test-budget-better', {
        cwd: tempDir,
      });

      const guardPath = path.join(tempDir, '1.execute.guard');
      const guardBefore = await fs.readFile(guardPath, 'utf-8');

      return { tempDir, guardPath, guardBefore };
    });

    when('[t0] the budget is spent down with better concessions alone', () => {
      const result = useThen('the grant is refused', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });

        // round 1 of 2 — the reviewer runs and rejects
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        await answerEveryPeerGiven({
          cwd: scene.tempDir,
          stone: '1.execute',
          severity: 'better',
        });

        // round 2 of 2 — the artifact changed, so the reviewer runs again and the meter runs dry
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v2";',
        );
        await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.execute', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
        await answerEveryPeerGiven({
          cwd: scene.tempDir,
          stone: '1.execute',
          severity: 'better',
        });

        return invokeRouteSkill({
          skill: 'route.guard.budget',
          args: {
            for: 'review',
            add: '2',
            route: '.',
            peer: 'mock-reviewer',
            stone: '1.execute',
          },
          cwd: scene.tempDir,
        });
      });

      then('a better concession really does stand on the ledger', async () => {
        // 🔴 without this the case could pass for [case1]'s reason — an empty stone. the ledger
        //    is where the gate reads, so it is where the premise must be checked
        const passage = await fs.readFile(
          path.join(scene.tempDir, '.route', 'passage.jsonl'),
          'utf-8',
        );
        expect(passage).toContain('"status":"conceded"');
        expect(passage).toContain('"severity":"better"');
        expect(passage).not.toContain('"severity":"urgent"');
      });

      then('exit code is 2 — better mints no warrant', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal is on stderr, never stdout', () => {
        expect(result.stderr).toContain('budget refused');
        expect(result.stdout).not.toContain('budget refused');
      });

      then('the refusal names the WARRANT, never the moment', () => {
        // 🔴 `2/2` is the half that carries this case: the reviewer HAS run dry, so the moment
        //    conjunct would have cleared. what refuses is the grade, and only the grade
        expect(result.stderr).toContain('mock-reviewer = 2/2 rounds spent');
        expect(result.stderr).toContain(
          'a grant needs a live urgent concession',
        );
        expect(result.stderr).not.toContain('rounds remain');
      });

      then('it names the stone whose ledger it read', () => {
        expect(result.stderr).toContain(
          'no live urgent concession stands on 1.execute',
        );
      });

      then('the refusal teaches the rule the wish rests on', () => {
        // inside the meter, taste counts. past the meter, only harm buys a round
        expect(result.stderr).toContain('the allowance for taste');
        expect(result.stderr).toContain('better = every other concern');
      });

      then('🔴 the guard file is byte-identical', async () => {
        const guardAfter = await fs.readFile(scene.guardPath, 'utf-8');
        expect(guardAfter).toEqual(scene.guardBefore);
      });

      then('stderr has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stderr)).toMatchSnapshot(
          'refusal — every round spent, every concession better',
        );
      });
    });
  });
});
