import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { answerEveryPeerGiven } from './.test/answerEveryPeerGiven';
import {
  assertPourRostersComplete,
  getAllPourAnnounceLines,
} from './.test/getAllPourAnnounceLines';
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
  type ReviewWindow,
  selectWindowsForLevel,
} from './.test/readReviewWindows';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-peer-concurrency');

/**
 * .mock = reviewer subprocess (mock-window.sh)
 * .why = real reviewers cost LLM tokens; these mocks emit wall-clock overlap
 *        windows that `readReviewWindows` measures to prove concurrency clamps
 * .real = the full acceptance suite at `--scope peer-budget` exercises real
 *         reviewer subprocesses via `rhx review`; this suite's concern is the
 *         concurrency primitive, not the reviewer contract
 */

/**
 * .what = the level-3 reviewers the fixture declares into the `serial` group
 * .why = `[t5]` appends a level-3 lane that joins NO group, so "at level 3" and
 *        "in the group" stop to be the same set. the bound is declared on the
 *        GROUP, so only this set is what it governs
 */
const GROUPED_L3_SLUGS = ['l3-a', 'l3-b', 'l3-c'];

/**
 * .what = reduces one pass's windows to the scalars each clamp asserts
 * .why = `useThen` hands back a PROXY that defers access, so an array read off it
 *        is not an array and `.filter` is absent on it. a scalar read through a
 *        property resolves, so the reduce happens inside the useThen rather than
 *        inside the assertion
 */
const summarizeWindows = (
  windows: ReviewWindow[],
): {
  l1Count: number;
  l1Peak: number;
  l1Slugs: string;
  l3Count: number;
  l3Peak: number;
  l3Slugs: string;
  l3GroupedPeak: number;
  lastL1End: number;
  firstL3Begin: number;
} => {
  const l1 = selectWindowsForLevel({ windows, prefix: 'l1-' });
  const l3 = selectWindowsForLevel({ windows, prefix: 'l3-' });

  // .why = the `serial` group's own members, by declared membership rather than
  //        by level. `[t5]` puts an UNGROUPED lane at level 3, so a level-wide
  //        peak and a group-wide peak are then different numbers — and the whole
  //        F13 hazard is that only one of the two respects the declared bound
  const grouped = l3.filter((w) => GROUPED_L3_SLUGS.includes(w.slug));

  return {
    l1Count: l1.length,
    l1Peak: computeMaxInFlight({ windows: l1 }),
    l1Slugs: l1
      .map((w) => w.slug)
      .sort()
      .join(','),
    l3Count: l3.length,
    l3Peak: computeMaxInFlight({ windows: l3 }),
    l3Slugs: l3
      .map((w) => w.slug)
      .sort()
      .join(','),
    l3GroupedPeak: computeMaxInFlight({ windows: grouped }),
    lastL1End: l1.length > 0 ? Math.max(...l1.map((w) => w.endedAt)) : 0,
    firstL3Begin:
      l3.length > 0 ? Math.min(...l3.map((w) => w.beganAt)) : Infinity,
  };
};

/**
 * .what = the rounds each level has actually SPENT, read off the meter ledger
 * .why = `1.vision.experience.case=4`'s clamp asks for a METER READ — *"the l3
 *        meter shows 0 rounds consumed"* — and a window count is a different
 *        boundary. a window proves no subprocess SPAWNED; the meter proves no
 *        budget BURNED, and the two are separate lines in the implementation
 *
 * 🔴 .note = the wrong implementation only this catches: a meter incremented at
 *            SCHEDULE rather than at SETTLE. that arm opens no l3 window — the
 *            gate still holds — and silently spends l3's budget on a pass where
 *            l3 never ran. a driver would then find level 3 exhausted though it
 *            read the artifact zero times, with no trace of where it went
 *
 * .note = reduced to scalars inside the read, per `summarizeWindows` above — a
 *         `useThen` proxy defers access, so an array read off it is not an array
 *
 * 🔴 .why only ENOENT is swallowed = the headline clamp here is
 *     `expect(metered.l3Rounds).toEqual(0)`. a bare `.catch(() => '')` makes an
 *     unreadable ledger read as zero rounds, so that clamp goes GREEN on data it
 *     never read — `rule.forbid.failhide`'s own words, *"a test that passes
 *     without verification is worse than no test"*. an absent ledger is the one
 *     legitimate empty case: no reviewer has settled yet on the very first pass
 */
const summarizeMeters = async (input: {
  cwd: string;
}): Promise<{ l1Rounds: number; l3Rounds: number; l3Slugs: string }> => {
  const metersPath = path.join(input.cwd, '.route', 'reviewPeerMeters.jsonl');
  const content = await fs.readFile(metersPath, 'utf-8').catch((error) => {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return '';
    throw error;
  });

  // last entry wins per slug, which is the ledger's own read semantics
  const latest = new Map<string, number>();
  for (const line of content.split('\n').filter(Boolean)) {
    const entry = JSON.parse(line) as {
      reviewer: { slug: string };
      rounds: number;
    };
    latest.set(entry.reviewer.slug, entry.rounds);
  }

  const sumFor = (prefix: string): number =>
    Array.from(latest.entries())
      .filter(([slug]) => slug.startsWith(prefix))
      .reduce((total, [, rounds]) => total + rounds, 0);

  return {
    l1Rounds: sumFor('l1-'),
    l3Rounds: sumFor('l3-'),
    l3Slugs: Array.from(latest.keys())
      .filter((slug) => slug.startsWith('l3-'))
      .sort()
      .join(','),
  };
};

/**
 * .what = the reviewer slug that HEADS each parsed block, in tree order
 * .why = the STRUCTURAL witness for the whole-block render. a mis-merge that folds two
 *        headers into one body drops a head, so the parsed set falls short of the
 *        roster. this parses the blocks: split on the `rN:` header, read the slug each
 *        block opens with, and hand back one entry per header. a collapsed render yields
 *        FEWER entries than the roster; a split render yields the roster, in order
 * .note = the slug is the first token after the header — `l1-a (l1, 1/5)` opens with
 *         `l1-a`. a block that names no known slug is dropped, so a judge line or a
 *         stray `rN:` inside prose contributes no phantom entry
 */
const parseReviewerBlockHeads = (
  stdout: string,
  known: string[],
): string[] =>
  stdout
    .split(/[├└]─ r\d+: /)
    .slice(1)
    .map((block) => known.find((slug) => block.startsWith(slug)))
    .filter((slug): slug is string => slug !== undefined);

/**
 * .what = the clamps for the concurrent pour and its per-group bound
 * .why = the wish's acceptance 7 asks for two tests with teeth: one that goes red
 *        under the serial arm, and one that goes red where a bound of 1 admits two
 *        in flight. these are those, plus the level gate and the co-member cases
 *        the vision's own coverage contract owes.
 *
 * .note = every assertion reads OBSERVED in-flight windows, never the wall clock.
 *         a duration assertion proves naught — a slow machine mimics a serial run
 *         and a fast one mimics a concurrent run.
 *
 * the fixture:
 *   l1 — l1-a..l1-d, no group, so no bound binds them
 *   l3 — l3-a..l3-c, group `serial`, whose concurrency is 1
 */
describe('driver.route.peer-concurrency.acceptance', () => {
  given('[journey] a level of four, and a level of three bounded at one', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-concurrency',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-window.sh', { cwd: tempDir });

      return { tempDir };
    });

    // =========================================================================
    // [t0] every l1 reviewer rejects — so l1 pours, and l3 never opens
    // =========================================================================

    when('[t0] the first arrival, with every l1 reviewer set to reject', () => {
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
        });
      });

      const observed = useThen('the windows are read', async () =>
        summarizeWindows(await readReviewWindows({ cwd: scene.tempDir })),
      );

      const metered = useThen('the meter ledger is read', async () =>
        summarizeMeters({ cwd: scene.tempDir }),
      );

      then('CLAMP: [case1] all four l1 reviewers are in flight at once', () => {
        // .why = THE clamp acceptance 1 asks for. under the serial arm the peak is
        //        1, because each lane is awaited before the next one begins
        expect(observed.l1Count).toEqual(4);
        expect(observed.l1Peak).toEqual(4);
      });

      then('CLAMP: [case4] no l3 reviewer ran while l1 was not terminal', () => {
        // .why = the level gate, seen as a COST rather than as a duration. l1
        //        rejected, so l3 must not have spawned — and a window that never
        //        opened is the direct evidence of that
        expect(observed.l3Count).toEqual(0);
      });

      then("CLAMP: [case4][t0] l3's meter shows 0 rounds consumed", () => {
        // 🔴 .why = the clamp `case=4` names verbatim, and it is a SECOND
        //           boundary rather than a restatement of the window clamp
        //           above. a window reports the SPAWN; a meter reports the
        //           SPEND, and the two are written at different call sites
        //
        // 🔴 .note = MEASURED 2026-09-09. moved the meter increment from settle
        //            to schedule — one write per ENUMERATED reviewer, right
        //            after the level sort, with the settle-time write disabled.
        //            this assertion went red at `Expected: 0 / Received: 3`,
        //            so all three l3 lanes spent a round on a pass where l3
        //            never ran.
        //
        //            ⇒ `CLAMP: [case4] no l3 reviewer ran while l1 was not
        //              terminal` stayed GREEN throughout, because no l3
        //              subprocess ever spawned. so the window clamp is a weak
        //              witness for this claim, and that is the whole argument
        //              for taking both rows the vision took
        expect(metered.l3Rounds).toEqual(0);

        // 🟡 and the ledger must not merely be EMPTY — l1 spent four rounds on
        //    this same pass, so a reader can tell "l3 spent zero" apart from
        //    "the meter was never written at all"
        expect(metered.l1Rounds).toEqual(4);
      });

      then('CLAMP: 🔴 the pour ANNOUNCES itself on a piped log', () => {
        // 🔴 .why = the WIRE clamp for `asReviewLevelPourAnnounce`. the
        //           transformer has six unit cases; not one proves it is
        //           CONNECTED. cut the `console.error(announce)` in
        //           `runStoneGuardReviews` and every unit test stays green
        //           while a piped log goes silent again — so this assertion is
        //           the whole teeth of the repair (i009/r10, point 1)
        //
        // .why = under a pipe the live status line is suppressed entirely, for
        //        the spam arithmetic at `genContextCliEmit.drawStatus`. so
        //        without this line the log carries NAUGHT between a level's
        //        launch and its settle, and a reader cannot part "this level is
        //        slow" from "this level never began"
        expect(result.stderr).toContain('🦉 l1 pours 4 lanes');

        // the roster is NAMED, in declared order — which is what makes the
        // announce a fix rather than a symptom
        //
        // 🔴 .why ONE MEMBER PER BRANCH = the roster was `join(', ')` until
        //           i019, which rendered ~145 unbroken chars at this repo's own
        //           12-wide fixture while EVERY other member list in the corpus
        //           used branches (`rule.forbid.snapshot-visual-blemishes`)
        expect(result.stderr).toContain(
          ['   ├─ r1:l1-a', '   ├─ r2:l1-b', '   ├─ r3:l1-c', '   └─ r4:l1-d'].join(
            '\n',
          ),
        );
      });

      then('CLAMP: 🔴 the announce is fixed, never a launch race', () => {
        // 🔴 .why = the reviewer proposed a line per LANE at launch. that form
        //           was built and measured nondeterministic on this very
        //           fixture — `[t5]` announced `r9` before `r5` where the
        //           declared order is the reverse, because a lane bound only by
        //           its level slot launches ahead of a grouped one. that is the
        //           hazard `genReviewWaveBuffer` exists to close (F9),
        //           reintroduced on a path that bypasses the buffer
        //
        // ⇒ so the announce must name no lane in LAUNCH order. one line per
        //   level, composed from the roster, is the form that survives
        const announces = result.stderr
          .split('\n')
          .filter((line) => line.includes('pours'));
        expect(announces).toHaveLength(1);

        // 🟡 and it lands on STDERR, so the 36 frozen stdout oracles are
        //    untouched. seven extant fixtures have a multi-member level, so the
        //    emit-path form would have moved seven of them
        expect(result.stdout).not.toContain('pours');
      });

      then('the pour announce reads as declared', () => {
        // .why = `toContain` proves the text is PRESENT; it cannot prove the
        //        full line is well-formed or that no extra clause crept in.
        //        the announce is deterministic — level, count, and roster are
        //        all fixed by the fixture — so a snapshot is the right oracle
        //
        // 🔴 .why the HELPER and not an inline filter = the filter read `└─`
        //           alone until i019 changed the roster to one member per
        //           branch, so three of four members fell out and `--resnap`
        //           wrote the remainder as the new oracle, GREEN, at five call
        //           sites at once. the helper clamps its own yield against the
        //           count the announce declares — an oracle a filter cannot
        //           supply itself
        const lines = getAllPourAnnounceLines(result.stderr);
        expect(lines).toMatchSnapshot();
      });

      then('every l1 reviewer reported a verdict', () => {
        for (const slug of ['l1-a', 'l1-b', 'l1-c', 'l1-d'])
          expect(result.stdout).toMatch(new RegExp(`${slug}.*rejected`, 's'));
      });

      then('l3 awaits its turn', () => {
        expect(result.stdout).toMatch(/l3-a.*awaits/s);
      });

      then('exit code is non-zero (blocked)', () => {
        expect(result.code).not.toEqual(0);
      });

      then('stdout has good vibes', () => {
        // .why = `rule.require.snapshot-every-journey-step` — EVERY `[tn]`, never a
        //        subset, so a reader follows the whole arc from the snapshots alone.
        //        `[t0]` is the opening state: four l1 lanes rejected, l3 not yet open
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // [t1] l1 approves — so l3 opens, and its bound of one holds
    // =========================================================================

    when('[t1] every l1 reviewer approves, so l3 opens', () => {
      const result = useThen('l3 runs under its bound', async () => {
        for (const slug of ['l1-a', 'l1-b', 'l1-c', 'l1-d'])
          await fs.writeFile(
            path.join(scene.tempDir, '.test', `${slug}.pass`),
            '',
          );

        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v2";',
        );

        await clearReviewWindows({ cwd: scene.tempDir });
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      const observed = useThen('the windows are read', async () =>
        summarizeWindows(await readReviewWindows({ cwd: scene.tempDir })),
      );

      then('CLAMP: [case2] l3 pours exactly one at a time', () => {
        // .why = THE clamp acceptance 4 asks for. it is a NON-OVERLAP assertion,
        //        never a duration one — "likely serial because it was slow" is
        //        what this refuses to accept as proof
        expect(observed.l3Count).toEqual(3);
        expect(observed.l3Peak).toEqual(1);
      });

      then('CLAMP: [case2] the bound at l3 does not leak up to l1', () => {
        // .why = a bound is per group. l1 joins no group, so it must still fan out
        //        to four in the same pass that l3 pours one at a time
        expect(observed.l1Count).toEqual(4);
        expect(observed.l1Peak).toEqual(4);
      });

      then('CLAMP: 🔴 the announce states the bound that ACTUALLY binds', () => {
        // 🔴 .why = the WIRE clamp for `getOneReviewLevelPourBound`. the
        //           announce once rendered the level-wide default verbatim, so
        //           this very level — three lanes in a `concurrency: 1` group —
        //           printed `≤10 at a time` while the assertion two rows above
        //           measures a peak of ONE. the one liveness line misreported
        //           the cap it exists to reveal (i011/r9)
        //
        // .why HERE = `[t0]` is the only other step that reaches the announce,
        //        and there l1 rejects, so l3 never pours and no l3 line exists.
        //        this is the one step where the grouped level announces at all
        expect(result.stderr).toContain('🦉 l3 pours 3 lanes · ≤1 at a time');

        // 🔴 the regression, named. `10` is `DEFAULT_LEVEL_CONCURRENCY`, and it
        //    is what this line carried before the bound was computed
        expect(result.stderr).not.toContain('≤10 at a time');
      });

      then('CLAMP: 🔴 a bound that binds NAUGHT states no clause', () => {
        // .why = the false-positive half, and it is what makes the clause
        //        informative rather than decorative. l1's four lanes sit under
        //        a level bound of ten, so naught is held back — and a
        //        `≤4 at a time` clause there would describe the ROSTER and
        //        invite a reader to hunt for a valve that is not there
        //
        // 🟡 it also holds the leaf's null branch WIRED. a bound computed
        //    correctly and then rendered unconditionally would put `≤4` here,
        //    and every unit case above would stay green
        const [l1Announce] = result.stderr
          .split('\n')
          .filter((line) => line.includes('l1 pours'));
        expect(l1Announce).toEqual('🦉 l1 pours 4 lanes');
      });

      then('the pour announce reads as declared', () => {
        // .why = `toContain` proves each fragment is PRESENT; it cannot prove
        //        the full lines are well-formed or that no extra clause crept
        //        in. these lines are deterministic — level, count, bound, and
        //        roster are all fixed by the fixture — so a snapshot is the
        //        right oracle
        const lines = getAllPourAnnounceLines(result.stderr);
        expect(lines).toMatchSnapshot();
      });

      then('CLAMP: [case4] no l3 window opens before the last l1 closes', () => {
        // .why = the gate holds BETWEEN levels, which the concurrent pour must not
        //        weaken. a level opens only once the level before it is terminal
        expect(observed.firstL3Begin).toBeGreaterThanOrEqual(observed.lastL1End);
      });

      then('every l1 reviewer approved', () => {
        for (const slug of ['l1-a', 'l1-b', 'l1-c', 'l1-d'])
          expect(result.stdout).toMatch(new RegExp(`${slug}.*approved`, 's'));
      });

      then('stdout has good vibes', () => {
        // .why = `[t1]` is the ONE step where both levels render a verdict. the
        //        transition l1-rejected → l1-approved → l3-ran is the arc this
        //        journey exists to show, and it is invisible without this frame
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // [t2] one co-member fails mid-flight — the others still land
    // =========================================================================

    when('[t2] one l1 co-member fails mid-flight', () => {
      const result = useThen('the level settles anyway', async () => {
        // l1-c hits a genuine constraint; l1-d cannot produce a verdict at all
        await fs.rm(path.join(scene.tempDir, '.test', 'l1-c.pass'));
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'l1-c.constraint'),
          '',
        );
        await fs.rm(path.join(scene.tempDir, '.test', 'l1-d.pass'));
        await fs.writeFile(
          path.join(scene.tempDir, '.test', 'l1-d.malfunction'),
          '',
        );

        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v3";',
        );

        await clearReviewWindows({ cwd: scene.tempDir });
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      const observed = useThen('the windows are read', async () =>
        summarizeWindows(await readReviewWindows({ cwd: scene.tempDir })),
      );

      then('CLAMP: [case5] a failed co-member cancels not one lane', () => {
        // .why = the pour settles ALL, never Promise.all. under Promise.all the
        //        first rejection abandons its co-members, so the peak would fall
        //        below four and lanes would be absent from the log entirely
        expect(observed.l1Count).toEqual(4);
        expect(observed.l1Peak).toEqual(4);
      });

      then('CLAMP: [case5] each of the four reports its own verdict', () => {
        expect(result.stdout).toMatch(/l1-a.*approved/s);
        expect(result.stdout).toMatch(/l1-b.*approved/s);
        expect(result.stdout).toMatch(/l1-c.*constraint/s);
        expect(result.stdout).toMatch(/l1-d.*malfunction/s);
      });

      then('the failed member is reported, never absent', () => {
        // .why = an absence and a malfunction read alike to a driver who scans the
        //        tree, and only one of them names a lane to go fix
        expect(result.stdout).toContain('l1-d');
      });

      // -----------------------------------------------------------------------
      // the render, read off the same pass — a concurrent pour, four lanes
      // -----------------------------------------------------------------------

      then('CLAMP: [case8] every reviewer appears in declared order', () => {
        // .why = a settle order differs from a declared order under a concurrent
        //        pour, and the emit path buffers each block until every earlier
        //        lane has landed. without that, the tree is a coin flip
        const declared = ['l1-a', 'l1-b', 'l1-c', 'l1-d'];
        const positions = declared.map((slug) => result.stdout.indexOf(slug));

        for (const position of positions) expect(position).toBeGreaterThan(-1);

        const sorted = [...positions].sort((a, b) => a - b);
        expect(positions).toEqual(sorted);
      });

      then('CLAMP: [case8] every l1 reviewer heads its OWN block', () => {
        // .why = the STRUCTURAL witness for whole-block render. the order clamp above
        //        reads a slug ANYWHERE — a body line that quotes `l1-c` satisfies it
        //        even if l1-c's own header was swallowed. this reads block HEADS: a
        //        collapse drops a head, so the parsed set falls short of the roster
        //        (i025/r2 blocker.2)
        // .note = the set, never the sequence — `result.stdout` legitimately holds
        //         the tree more than once here (the settled stream, then the final
        //         foreground render), so a whole-roster head appears per tree. the
        //         property under test is that NO head is dropped, which the set holds
        const declared = ['l1-a', 'l1-b', 'l1-c', 'l1-d'];
        const heads = parseReviewerBlockHeads(result.stdout, declared);
        expect([...new Set(heads)].sort()).toEqual([...declared].sort());
      });

      then('stdout has good vibes', () => {
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // [t3] the SAME artifact arrives again — so l1-a and l1-b are cached approved
    // =========================================================================

    when('[t3] the same artifact arrives again, two l1 lanes cached', () => {
      const result = useThen('the pool is smaller than the roster', async () => {
        // .note = src/feature.ts is deliberately NOT rewritten, so the artifact hash
        //         is the one [t2] reviewed. l1-a and l1-b approved it with 0 blockers,
        //         so their verdicts are cached; l1-c (constraint) and l1-d
        //         (malfunction) are terminal but NOT clean, so they run again
        await clearReviewWindows({ cwd: scene.tempDir });
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      const observed = useThen('the windows are read', async () =>
        summarizeWindows(await readReviewWindows({ cwd: scene.tempDir })),
      );

      then('CLAMP: [case6] a cached reviewer opens no window at all', () => {
        // .why = a short circuit is decided BEFORE the pool, so it must consume no
        //        slot. an absent window is the surest evidence of that — a cached
        //        lane that took a slot would still record BEGAN/ENDED, because the
        //        slot is taken around the subprocess the mock IS
        expect(observed.l1Count).toEqual(2);
        expect(observed.l1Slugs).toEqual('l1-c,l1-d');
      });

      then('CLAMP: [case6] the two that do run still pour together', () => {
        // .why = the skips must not merely be excluded — they must free the slots
        //        they never took, so the survivors fan out at full width
        expect(observed.l1Peak).toEqual(2);
      });

      then('CLAMP: [case6] a lane that already read this hash takes no slot', () => {
        // .why = the OTHER half of the short-circuit family, and it was found by
        //        this clamp rather than predicted. l3's three rejected in [t2] on
        //        this same hash, so a fresh verdict would tell the driver naught
        //        that is new — the guard reuses the one it holds and spawns no
        //        subprocess. so the pool here is 2 of a roster of 7, which is what
        //        makes the index clamp below a real test rather than a formality
        expect(observed.l3Count).toEqual(0);
      });

      then('CLAMP: [case9] each index still names its declared reviewer', () => {
        // .why = `pr.index` is a durable identity key — it is written into the
        //        review artifact's filename and is the cached-verdict key. this pass
        //        pours 2 of a roster of 7, so an index re-derived from POOL position
        //        would slide l1-c from r3 to r1 and credit one reviewer's cache to
        //        another. each index must still name the reviewer it was declared on
        for (const [index, slug] of [
          [1, 'l1-a'],
          [2, 'l1-b'],
          [3, 'l1-c'],
          [4, 'l1-d'],
          [5, 'l3-a'],
          [6, 'l3-b'],
          [7, 'l3-c'],
        ] as const)
          expect(result.stdout).toContain(`r${index}: ${slug}`);
      });

      then('CLAMP: [case6] the cached lanes still report their verdict', () => {
        // .why = a skip is not a silence. a cached approval must render exactly as
        //        a fresh one, or a driver reads an absence and cannot tell it from
        //        a reviewer that never spoke
        expect(result.stdout).toMatch(/l1-a.*approved/s);
        expect(result.stdout).toMatch(/l1-b.*approved/s);
      });

      then('the PARTIAL-POOL pour announce has good vibes', () => {
        // 🔴 .why = the announce is built from `toPour` — the POST-short-circuit
        //           pool, never the roster. so `[t3]` is the first step whose
        //           announce names a PROPER SUBSET: l1-c and l1-d only, because
        //           l1-a and l1-b were cached and took no slot.
        //
        //           ⇒ this is the ONE externally visible surface on which
        //             `[case6]`'s claim — *cached and exhausted take no slot* —
        //             can be read. stdout renders a cached verdict identically to
        //             a fresh one BY DESIGN (see the clamp above), so stdout
        //             structurally cannot part a correct 2-member announce from a
        //             regressed one that counts the cached pair back in.
        //
        // ⚠️ .note = the precedent is `i019/r9`: a roster filter silently dropped
        //       3 of 4 members and `--resnap` wrote the truncation as the new
        //       green. raised i026/r012
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        // .why = `[t3]` is where a cached lane and a fresh one sit
        //        side by side in one tree, and the rule's own argument is that a
        //        reader must be able to tell them apart WITHOUT a run — `[case6]`
        //        asserts a cached lane still reports, and this is what that looks like
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // [t4] a reviewer is APPENDED to the roster — the index must not re-scan
    // =========================================================================

    when('[t4] an eighth reviewer is appended to the roster', () => {
      const result = useThen('the roster grows and the indices hold', async () => {
        // .note = APPENDED at the END of `reviews.peer`, deliberately. `index: i + 1`
        //         is the DECLARED array position, so an append is safe and an insert
        //         is not — to add at the head shifts every later index and misroutes
        //         cached reviews. this clamp proves the safe case stays safe; the
        //         unsafe one is extant behavior this wish does not change
        //
        // .note = the new lane sits at level 1 while its array position is 8, so
        //         this ALSO proves the index is taken BEFORE the level sort. an
        //         implementation that numbered post-sort would call it r5
        const guardPath = path.join(scene.tempDir, '1.vision.guard');
        const guard = await fs.readFile(guardPath, 'utf-8');
        await fs.writeFile(
          guardPath,
          guard.replace(
            '  groups:',
            `    - slug: l1-e
      run: bash $route/.test/mock-window.sh l1-e
      budget: 5
      level: 1

  groups:`,
          ),
        );

        await clearReviewWindows({ cwd: scene.tempDir });
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

        return invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });
      });

      const observedAfterAppend = useThen('the windows are read', async () =>
        summarizeWindows(await readReviewWindows({ cwd: scene.tempDir })),
      );

      then('CLAMP: [case9][t7] every extant index still names its reviewer', () => {
        // 🔴 .why = the ONE wrong implementation `[t6]` cannot catch: an index
        //           re-derived by a RE-SCAN of the roster at run time. the pool
        //           changed in [t3] and the roster did not, so only a roster append
        //           moves this. r1..r7 must be exactly where they were declared
        //
        // 🔴 .note = MEASURED 2026-09-09. re-derived the index after the level sort
        //            (`peerReviewsWithIndex.forEach((pr, i) => { pr.index = i + 1 })`)
        //            and the suite went 31 passed / 2 failed — BOTH failures here,
        //            and every other clamp green.
        //
        //            ⇒ [t3]'s own index clamp PASSED under that defect, which is
        //              the whole argument for this case. [t3]'s roster is already
        //              in level order, so a post-sort re-index is a no-op on it.
        //              only a lane appended at a level that reorders moves it, and
        //              l1-e is declared 8th at level 1 for exactly that reason.
        //
        //            the render read `r5: l1-e` where `r5: l3-a` belongs — so the
        //            defect does not merely misname the new lane, it slides three
        //            extant reviewers onto indices that key another's cache
        for (const [index, slug] of [
          [1, 'l1-a'],
          [2, 'l1-b'],
          [3, 'l1-c'],
          [4, 'l1-d'],
          [5, 'l3-a'],
          [6, 'l3-b'],
          [7, 'l3-c'],
        ] as const)
          expect(result.stdout).toContain(`r${index}: ${slug}`);
      });

      then('CLAMP: [case9][t7] the appended reviewer takes the NEXT index', () => {
        // .why = 8, its declared array position — never 5, which is where it would
        //        land if the index were assigned after the level sort
        expect(result.stdout).toContain('r8: l1-e');
      });

      then('CLAMP: [case9][t7] the appended lane pours WITH its level', () => {
        // .why = a roster append must not serialize the level it joins. l1-e is new
        //        so it runs; l1-c and l1-d are terminal-but-unclean so they run too.
        //        all three must be aloft together
        expect(observedAfterAppend.l1Peak).toBeGreaterThanOrEqual(2);
      });

      then('the PARTIAL-POOL pour announce has good vibes', () => {
        // 🔴 .why = the SECOND partial-pool shape, and it differs from `[t3]`'s in
        //           kind rather than in size: the roster GREW to 8 while the pool
        //           holds 3 — l1-c, l1-d (still unclean, so they re-run) plus the
        //           appended l1-e. two cached lanes stay out of it.
        //
        //           ⇒ so this frame carries the one claim `[t3]`'s cannot: that a
        //             roster APPEND lands in the pool while the cached members it
        //             joined stay excluded. an announce that read from the roster
        //             would print 8 here and 4 in `[t3]`, and every stdout clamp
        //             in both blocks would stay green
        expect(getAllPourAnnounceLines(result.stderr)).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        // .why = `[t4]` renders the widest roster the journey reaches — eight
        //        reviewers, r1..r8. the two index clamps above read `toContain` on
        //        eight strings; this frame is what puts the WHOLE ordered roster in
        //        front of a reviewer, which is the claim `toContain` cannot make
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

    // =========================================================================
    // [t5] 🔴 the F13 hazard, at ACCEPTANCE grain — an ungrouped lane is
    //         appended at level 3, beside the group bounded at one
    // =========================================================================

    when('[t5] an UNGROUPED reviewer is appended at level 3', () => {
      /**
       * .what = the hazard `RouteStoneGuardReviewPeer.group` documents, run
       *         through the real parser, the real pour, and the real render
       *
       * .why  = F13 was clamped at the unit tier by
       *         `runWithinConcurrencyBounds.test.ts [case6]`, and i004/r2's
       *         reviewer named the residue precisely: *"no acceptance-level
       *         fixture exists for a mixed grouped/ungrouped level … a guard
       *         author who makes this exact mistake gets zero test coverage of
       *         what happens to them."* the unit clamp binds a leaf in
       *         isolation; this binds the shape a real `.guard` carries
       *
       * 🔴 .note = it clamps the HAZARDOUS behavior, on purpose. the bound reads
       *            `concurrency: 1` and two lanes go aloft, so a traveler who
       *            lands F13's option D (require `group:` on every reviewer) or
       *            option G (advise at the pour) goes RED here and learns which
       *            disposition they changed. ⚠️ a gap no test describes is
       *            invisible to a silent fix
       *
       * .note = the APPEND mechanism is `[t4]`'s, reused rather than re-derived.
       *         a new fixture dir would have bought a second copy of
       *         `mock-window.sh`, which i005/r011 measured as a negative trade
       */
      const result = useThen(
        'the ungrouped lane pours past the bound',
        async () => {
          // every l1 lane approves, so l1 is terminal and level 3 opens
          // .why = [t2] left l1-c at a constraint and l1-d at a malfunction. both
          //        are terminal, so l3 would open either way — but a clean l1
          //        keeps this frame about the l3 pour alone
          await fs.rm(path.join(scene.tempDir, '.test', 'l1-c.constraint'));
          await fs.rm(path.join(scene.tempDir, '.test', 'l1-d.malfunction'));
          for (const slug of ['l1-c', 'l1-d', 'l1-e'])
            await fs.writeFile(
              path.join(scene.tempDir, '.test', `${slug}.pass`),
              '',
            );
          for (const slug of ['l3-a', 'l3-b', 'l3-c'])
            await fs.writeFile(
              path.join(scene.tempDir, '.test', `${slug}.pass`),
              '',
            );

          // 🔴 THE author mistake: a level-3 reviewer with NO `group:` key, beside
          //    three that declare `group: serial`. it is appended at the END, so
          //    every extant index holds (the `[t4]` argument, unchanged)
          const guardPath = path.join(scene.tempDir, '1.vision.guard');
          const guard = await fs.readFile(guardPath, 'utf-8');
          await fs.writeFile(
            guardPath,
            guard.replace(
              '  groups:',
              `    - slug: l3-x
      run: bash $route/.test/mock-window.sh l3-x
      budget: 5
      level: 3

  groups:`,
            ),
          );
          await fs.writeFile(
            path.join(scene.tempDir, '.test', 'l3-x.pass'),
            '',
          );

          // move the artifact hash, so no lane is served from a cache
          await fs.writeFile(
            path.join(scene.tempDir, 'src', 'feature.ts'),
            'export const feature = () => "v5";',
          );

          await clearReviewWindows({ cwd: scene.tempDir });
          await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

          return invokeRouteSkill({
            skill: 'route.stone.set',
            args: { stone: '1.vision', route: '.', as: 'passed' },
            cwd: scene.tempDir,
          });
        },
      );

      const observed = useThen('the windows are read', async () =>
        summarizeWindows(await readReviewWindows({ cwd: scene.tempDir })),
      );

      then('CLAMP: [case3] all four level-3 lanes ran', () => {
        // .why = the premise every clamp below rests on. an ungrouped lane that
        //        was starved, or a grouped one that never poured, would make the
        //        peak readings below true of a set nobody declared
        expect(observed.l3Count).toEqual(4);
        expect(observed.l3Slugs).toEqual('l3-a,l3-b,l3-c,l3-x');
      });

      then('CLAMP: [case3] the group STILL honors its own bound', () => {
        // .why = the valve is not broken — it governs exactly its members, and
        //        among them it holds. so the defect below is a SCOPE defect
        //        rather than a bound defect, and that distinction is what makes
        //        F13's option D and option G the live repairs
        expect(observed.l3GroupedPeak).toEqual(1);
      });

      then(
        'CLAMP: 🔴 the F13 hazard — level-3 in-flight EXCEEDS the declared 1',
        () => {
          // 🔴 .why = the author wrote `concurrency: 1` for a rate-limited
          //           resource and TWO lanes went aloft against it, because one
          //           reviewer carries no `group:` key. the valve reads as
          //           declared and the resource is hit twice over
          //
          // .note = a bound cannot be read off the tree, so this number is the
          //         only place a driver could ever see the leak — and it is
          //         exactly the number no acceptance fixture held until now
          expect(observed.l3Peak).toBeGreaterThan(1);
          expect(observed.l3Peak).toEqual(2);
        },
      );

      then('the ungrouped lane reports its own verdict', () => {
        // .why = it is not starved BY the group it does not belong to. the nest
        //        order in `runWithinConcurrencyBounds` buys exactly this, and
        //        that is why the hazard cannot be closed there without a trade
        expect(result.stdout).toMatch(/l3-x.*approved/s);
      });

      then('CLAMP: [case9] the appended l3 lane takes the NEXT index', () => {
        // .why = 9, its declared array position. the `[t4]` claim re-asserted
        //        across a SECOND append, so the index is stable under growth
        //        rather than under one lucky edit
        expect(result.stdout).toContain('r9: l3-x');
      });

      then(
        'CLAMP: 🔴 option G — the pour ADVISES the author of the leak',
        () => {
          // 🔴 .why = F13's landed repair, and the one clamp on the WIRE rather
          //           than on the detector. `getAllConcurrencyGroupLeaks` has
          //           nine unit clamps of its own; not one of them proves it is
          //           CONNECTED. cut the call in `runStoneGuardReviews` and
          //           every unit test stays green while the author is unwarned
          //           again — so this assertion is the whole teeth of option G
          //
          // .why STDERR = the advisory rides the stream the live frames already
          //        use, so it moves none of the frozen stdout oracles. the split
          //        is by purpose: stderr is what a human watches, stdout is what
          //        a test records
          expect(result.stderr).toContain(
            'level 3 mixes a bounded concurrency group with an unbounded lane',
          );

          // both halves of the leak are NAMED, never merely counted
          // .why = an author who reads "a leak at level 3" must then find it by
          //        hand across nine reviewers. the two lines below are what turn
          //        the advisory from a symptom into a fix
          expect(result.stderr).toContain('bounded: serial');
          expect(result.stderr).toContain('unbounded: l3-x');
        },
      );

      then('CLAMP: the advisory does NOT fire for an unmixed level', () => {
        // .why = level 1 holds four lanes and no `group:` at all, which is the
        //        default shape of every extant guard in the org. an advisory
        //        there would fire on every run and teach the author to ignore it
        expect(result.stderr).not.toContain('level 1 mixes');
      });

      then('the pour announce and advisory read as declared', () => {
        // .why = `toContain` proves each fragment is PRESENT; it cannot prove
        //        the full lines are well-formed or that no extra clause crept
        //        in. these lines are deterministic — level, group names, and
        //        the advisory text are all fixed by the fixture — so a snapshot
        //        is the right oracle. spinner/status lines are excluded so the
        //        snapshot is stable across runs
        //
        // .why the wider filter = `asConcurrencyGroupLeakAdvisory` emits 6 lines.
        //        the prior filter captured only the first and fourth, so the
        //        snapshot ended mid-sentence at "ratelimit". the filter now also
        //        matches the bounded/unbounded sub-lines and the two continuation
        //        lines, so the committed oracle pins the advisory's full shape
        //
        // 🔴 .why the advisory sits BELOW l1's announce and ABOVE l3's = it is
        //        emitted inside l3's own gated branch, never once up front. so
        //        this oracle also pins the ADJACENCY — an advisory that drifts
        //        back to the top of the run moves these lines and goes red here,
        //        which is what makes `[t6]`'s silence clamp a pair rather than a
        //        lone assertion. raised i028/r7
        const lines = result.stderr
          .split('\n')
          .filter(
            (l) =>
              l.includes('pours') ||
              l.match(/^\s+[├└]─ r\d+:/) ||
              l.includes('mixes a bounded') ||
              l.includes('├─ bounded:') ||
              l.includes('├─ unbounded:') ||
              l.includes('is exceeded even though') ||
              l.includes("each lane above a"),
          );

        // 🔴 the roster half of this filter, clamped against its own declaration
        // .why = this site cannot call `getAllPourAnnounceLines` — it needs the
        //        advisory lines interleaved in emit order, which a pour-only
        //        filter drops. so it keeps its own filter and borrows the check
        assertPourRostersComplete(lines);

        expect(lines).toMatchSnapshot();
      });

      then('stdout has good vibes', () => {
        // .why = 🔴 THE frame F13 lacked. it is what a guard author actually
        //        sees when their ratelimit valve leaks: nine lanes, every verdict
        //        clean, the bound declared at 1 — and no line of the TREE that
        //        says two lanes hit the resource together
        //
        // 🔴 .note = the tree's silence is deliberate and it is no longer the
        //         whole story. option G put the warn on STDERR, so the author IS
        //         told — and this oracle stays byte-identical, which is the
        //         property that made stderr the right stream. ⇒ read the pair
        //         together: stdout proves the tree did not move, and the clamp
        //         above proves the author was warned anyway
        expect(sanitizeTimeForSnapshot(result.stdout)).toMatchSnapshot();
      });
    });

  });

  // ===========================================================================
  // 🔴 the same leak, at a level the GATE never opens
  // ===========================================================================

  given('[case10] a leaking level 3 that the gate never opens', () => {
    /**
     * .what = the `[t5]` roster — three `group: serial` lanes beside one
     *         ungrouped `l3-x` — on a FRESH route where level 1 rejects. so the
     *         leak is present in the guard and level 3 never pours.
     *
     * 🔴 .why = the advisory's whole claim is *"this level is about to pour past
     *           a ratelimit"*. a level the gate holds shut pours past no bound at
     *           all, so an advisory for it warns of an event that did not occur.
     *           the cost is more than cosmetic: an author who reads an l3 leak
     *           line on EVERY l1-blocked run learns to ignore the line, which
     *           retires the F13 option-G valve by attrition. a valve you stop to
     *           read is a valve you do not have. raised i028/r7: *"the `[t5]`
     *           wire clamp only covers a post-unlock frame where the level did
     *           pour, so the unopened-level case is unclamped."*
     *
     * 🔴 .why a FRESH route and not a `[t7]` on the journey = level unlock is a
     *         LATCH (`define.invariant.review.peer.level-unlock-is-a-latch`).
     *         `[t5]` poured level 3, so every later step on that route finds it
     *         already open however level 1 then votes — measured, on the first
     *         draft of this clamp. the latch is correct; it simply means the
     *         never-opened state is unreachable once a route has reached it.
     *
     * 🔴 .why it needs BOTH halves — a real leak AND a shut gate = the journey's
     *         `[t0]` also leaves level 3 shut, and there `l3-x` does not exist,
     *         so no leak is DETECTED and the advisory stays silent under the
     *         defect too. only a case that holds both can part the two
     *         implementations.
     */
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDirForRhachet({
        slug: 'peer-concurrency-leak-shut',
        clone: ASSETS_DIR,
      });

      await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });
      await execAsync('chmod +x .test/mock-window.sh', { cwd: tempDir });

      // THE author mistake, authored into the guard before the first arrival:
      // a level-3 reviewer with no `group:` key, beside three that declare one
      const guardPath = path.join(tempDir, '1.vision.guard');
      const guard = await fs.readFile(guardPath, 'utf-8');
      await fs.writeFile(
        guardPath,
        guard.replace(
          '  groups:',
          `    - slug: l3-x
      run: bash $route/.test/mock-window.sh l3-x
      budget: 5
      level: 3

  groups:`,
        ),
      );

      return { tempDir };
    });

    when('[t0] the first arrival, with every l1 reviewer set to reject', () => {
      const outcome = useThen('the stone blocks at l1', async () => {
        await fs.mkdir(path.join(scene.tempDir, 'src'), { recursive: true });
        await fs.writeFile(
          path.join(scene.tempDir, 'src', 'feature.ts'),
          'export const feature = () => "v1";',
        );

        await clearReviewWindows({ cwd: scene.tempDir });
        await answerEveryPeerGiven({ cwd: scene.tempDir, stone: '1.vision' });

        const result = await invokeRouteSkill({
          skill: 'route.stone.set',
          args: { stone: '1.vision', route: '.', as: 'passed' },
          cwd: scene.tempDir,
        });

        // read the guard back in the SAME step, so the clamps below stay sync
        const guardAfter = await fs.readFile(
          path.join(scene.tempDir, '1.vision.guard'),
          'utf-8',
        );

        return { result, guard: guardAfter };
      });

      then('level 1 poured, and level 3 did not', () => {
        // .why = the premise every clamp below rests on. assert it rather than
        //        assume the fixture landed — a case that silently opened level 3
        //        would pass the silence clamp for the wrong reason
        expect(outcome.result.stderr).toContain('l1 pours');
        expect(outcome.result.stderr).not.toContain('l3 pours');
      });

      then('CLAMP: the leak IS present in the guard, not absent', () => {
        // .why = a clamp on an absent line passes trivially once the leak itself
        //        goes away. prove `l3-x` sits at level 3 beside `group: serial`,
        //        so the silence below is the GATE's doing rather than a fixture
        //        that never carried a leak at all
        expect(outcome.guard).toContain('slug: l3-x');
        expect(outcome.guard).toContain('group: serial');
      });

      then(
        'CLAMP: 🔴 the advisory stays SILENT for a level that never opened',
        () => {
          // 🔴 this is the teeth. revert the gate on the advisory emit in
          //    `runStoneGuardReviews` and this goes red while `[t5]` stays green
          expect(outcome.result.stderr).not.toContain(
            'level 3 mixes a bounded concurrency group',
          );
        },
      );

      then('CLAMP: level 1 is unmixed, so IT warns nobody either', () => {
        // .why = the pair that proves the silence above is about the GATE and
        //        never about a detector that simply stopped working. level 1
        //        pours and holds no group at all, so it is silent for its own
        //        reason — and if the advisory were broken outright, `[t5]` would
        //        be red rather than this
        expect(outcome.result.stderr).not.toContain('level 1 mixes');
      });

      then('stdout has good vibes', () => {
        // .why = `rule.require.snapshot-every-journey-step` — and this step was
        //        the ONE journey step in this file that carried no oracle.
        //        raised i020/r4 as a blocker, and the reviewer was right: every
        //        peer `[tn]` here and across the -default/-env/-solo/-refusals
        //        suites ends with this frame, so [case10] was the lone gap
        //
        // 🔴 .what makes THIS frame worth a snapshot rather than a formality =
        //        the four clamps above all assert an ABSENCE (`not.toContain`),
        //        and an absence clamp cannot describe the tree a driver actually
        //        reads. so the guard tree for a leaked-but-shut level had no
        //        committed render at all: `l3-x` sits in the roster, its level
        //        never opened, and how THAT renders was un-pinned
        expect(sanitizeTimeForSnapshot(outcome.result.stdout)).toMatchSnapshot();
      });
    });
  });
});

