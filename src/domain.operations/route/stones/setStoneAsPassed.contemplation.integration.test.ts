import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { answerEveryPeerGiven } from '../__test_assets__/answerEveryPeerGiven';
import { asStableGuardEmit } from '../__test_assets__/asStableGuardEmit';
import { countReviewerRuns } from '../__test_assets__/countReviewerRuns';
import { genContextReviewBrainSupplyDemo } from '../__test_assets__/genContextReviewBrainSupplyDemo';
import { setStoneAsPassed } from './setStoneAsPassed';

const noopContext = genContextReviewBrainSupplyDemo();

/**
 * .what = the shared run-token normalizer, aliased for the reads below
 * .why = three suites had drifted three copies of it, and one of those drifts hid a
 *        real cross-machine flake. the bound it keeps — swap the run tokens and no
 *        other byte — is now stated once, in `asStableGuardEmit` (r1 nitpick.1, i002)
 */
const asStableEmit = asStableGuardEmit;

describe('setStoneAsPassed.contemplation', () => {
  given(
    '[case1] a peer reviewer that always hands back a blocker, with budget to spare',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = path.join(
          os.tmpdir(),
          `test-set-passed-contemplation-${Date.now()}`,
        );
        await fs.mkdir(tempDir, { recursive: true });

        // 🔴 the scene MUST be a git repo, or this snapshot clamps no property.
        //    `asGuardDisplayPath` relativizes a printed path against the repo root; with
        //    no root to find, `getRepoRootWithFallback` falls back to `process.cwd()` and
        //    emits a `../../../../tmp/…` crawl. `asStableGuardEmit` swaps BOTH the crawl
        //    and the raw absolute route to the same `<route>` token, so the relativized
        //    output and the un-relativized output stabilize to identical bytes — the
        //    snapshot passes whether or not the cast runs at all.
        //
        //    with a root, the cast yields a bare `.reviews/peer/…` that no swap touches,
        //    so the snapshot goes red the moment the cast is removed (r10 blocker, i005)
        execSync('git init', { cwd: tempDir, stdio: 'ignore' });

        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');

        // .note = the reviewer appends one char per run, so the tally is a direct
        //         count of spawns. budget 5 keeps exhaustion far away, so a halt
        //         can only be the contemplation gate and never a spent budget
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: counter',
            '      run: printf x >> "$route/runs.txt"; echo "blockers: 1"; echo "nitpicks: 0"',
            '      budget: 5',
            '      level: 1',
            'judges:',
            '  - echo "passed: false\\nreason: blockers found"',
          ].join('\n'),
        );

        await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');

        return { tempDir };
      });

      afterAll(async () => {
        await fs.rm(scene.tempDir, { recursive: true, force: true });
      });

      when('[t0] the first round is entered, with no debt owed', () => {
        const result = useThen('the round completes', async () =>
          setStoneAsPassed(
            { stone: '1.test', route: scene.tempDir },
            noopContext,
          ),
        );

        then('the gate opens — there is no prior critique to answer', () => {
          expect(result.passed).toBe(false);
          // the halt is the judge's verdict on the blocker, not a contemplation halt
          expect(result.emit?.stdout).not.toContain('await your reply');
        });

        then('the reviewer ran exactly once', async () => {
          expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
        });

        then('matches snapshot — the round that was allowed to run', () => {
          expect(
            asStableEmit({ emit: result.emit?.stdout, route: scene.tempDir }),
          ).toMatchSnapshot();
        });

        then('a critique now sits unanswered', async () => {
          const givens = await fs.readdir(
            path.join(scene.tempDir, '.reviews', 'peer'),
          );
          expect(
            givens.filter((name) => name.includes('.given.by_peer.')),
          ).toHaveLength(1);
          expect(
            givens.filter((name) => name.includes('.taken.by_self.')),
          ).toHaveLength(0);
        });
      });

      when(
        '[t1] the driver edits the artifact and re-enters, with no answer written',
        () => {
          // 🔴 the edit lives INSIDE the factory, never in a peer `then`. a `then` that
          //    mutates is an assertion block that performs setup, and every step after it
          //    then leans on jest to have REGISTERED and RUN that block first — an order
          //    the framework never promised and a reader cannot see. one `--testNamePattern`
          //    that skips the mutation is all it takes: the re-entry would run against an
          //    UNEDITED artifact, and `[t1]`'s whole claim — that an edit no longer buys
          //    re-entry — would be tested against no edit at all, and pass
          //    (rule.forbid.order-dependence; r4 nitpick.1, i011)
          const result = useThen(
            'the artifact is repaired, and the re-entry completes',
            async () => {
              await fs.writeFile(
                path.join(scene.tempDir, '1.test.md'),
                '# Test artifact\n\nedited, but the reviewer was never answered',
              );
              return setStoneAsPassed(
                { stone: '1.test', route: scene.tempDir },
                noopContext,
              );
            },
          );

          then('the gate refuses at the door', () => {
            // the edit used to buy re-entry. it no longer does — this is the
            // whole outcome of the behavior, in one assertion
            expect(result.passed).toBe(false);
            expect(result.emit?.stdout).toContain('await your reply');
            expect(result.emit?.stdout).toContain('counter');
          });

          then(
            'no round was spawned — the halt precedes the subprocess',
            async () => {
              // P1's teeth. were the gate still on the EXIT, the round would have
              // run first and this tally would read 2. it is the only assertion
              // here that can tell an entrance gate from an exit gate
              expect(countReviewerRuns({ route: scene.tempDir })).toEqual(1);
            },
          );

          then(
            'the debt survived the edit — it is keyed to the reviewer',
            () => {
              // P2a's teeth, at this grain. were givens still read at the CURRENT
              // hash only, the edit would have left no given to find, the gate
              // would have seen no debt, and the round above would have run
              expect(result.emit?.stdout).toContain('await your reply');
            },
          );

          then(
            'matches snapshot — the carried-unanswered halt, rendered in full',
            () => {
              // the most important state in the whole journey, and the one the
              // assertions above cover least: they pin two fragments ('await your
              // reply', 'counter') and leave every other byte of the halt free to
              // regress. this pins the tree a driver actually reads
              // (rule.require.snapshot-every-journey-step; r1 i002)
              expect(
                asStableEmit({
                  emit: result.emit?.stdout,
                  route: scene.tempDir,
                }),
              ).toMatchSnapshot();
            },
          );

          then('the halt cites no reviews, since none ran', () => {
            expect(result.refs.reviews).toEqual([]);
            expect(result.refs.judges).toEqual([]);
          });
        },
      );

      when('[t2] the driver answers, then re-enters', () => {
        // 🔴 same reason as `[t1]` — the answer is setup, so it belongs in the factory.
        //    here the order dependence bites even harder: were the write skipped, the
        //    re-entry would meet an UNANSWERED debt, the gate would hold, and
        //    `the gate opens` below would go red over the standing debt rather than
        //    over the discharge it claims to test (r4 nitpick.1, i011)
        const result = useThen(
          'the driver answers, and the re-entry completes',
          async () => {
            const pathsTaken = await answerEveryPeerGiven({
              route: scene.tempDir,
              stone: '1.test',
            });
            // .note = not decoration — were the glob to break, the helper would
            //         silently write zero files and every assertion below would
            //         pass for the wrong reason (rule.forbid.failhide)
            expect(pathsTaken).toHaveLength(1);
            return setStoneAsPassed(
              { stone: '1.test', route: scene.tempDir },
              noopContext,
            );
          },
        );

        then('the gate opens — the debt was discharged by an answer', () => {
          expect(result.emit?.stdout).not.toContain('await your reply');
        });

        then('matches snapshot — the gate open again, after the answer', () => {
          expect(
            asStableEmit({ emit: result.emit?.stdout, route: scene.tempDir }),
          ).toMatchSnapshot();
        });

        then('a second round ran', async () => {
          expect(countReviewerRuns({ route: scene.tempDir })).toEqual(2);
        });

        then('the round reached the judges', () => {
          expect(result.refs.reviews.length).toBeGreaterThan(0);
        });
      });
    },
  );
});
