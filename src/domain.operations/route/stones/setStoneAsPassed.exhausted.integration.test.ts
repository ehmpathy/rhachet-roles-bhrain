import { execSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

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

describe('setStoneAsPassed.exhausted', () => {
  given('[case1] peer reviewer exhaustion writes to passage.jsonl', () => {
    let tempDir: string;

    beforeAll(async () => {
      // create temp route directory
      tempDir = path.join(
        process.cwd(),
        '.tmp',
        `test-budgetlimit-passage-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });

      // 🔴 the scene MUST be its own git repo, or this snapshot clamps no property.
      //    `asGuardDisplayPath` relativizes against the repo root. with no root of its
      //    own the route resolves against the outer checkout, so the display form keeps
      //    a `.tmp/test-…/` prefix — which `asStableGuardEmit` swaps to `<route>`,
      //    exactly as it swaps the raw absolute route. relativized and un-relativized
      //    then stabilize to identical bytes, and the snapshot passes either way.
      //
      //    with its own root the cast yields a bare `.reviews/peer/…` that no swap
      //    touches, so the snapshot goes red if the cast is removed (r10 blocker, i005).
      //    the `afterAll` below removes the nested `.git` with the rest of the scene
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });

      // create stone file
      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');

      // create guard with budget: 2 reviewer that always finds blockers
      // .why = budget:2 means first attempt runs (rejected), second attempt runs (rejected),
      //        third attempt is SKIPPED (exhausted) because budget already spent
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  peer:',
          '    - slug: limited',
          '      run: echo "blockers: 1\\nnitpicks: 0\\ntest review"',
          '      budget: 2',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
        ].join('\n'),
      );

      // create artifact
      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] first attempt consumes budget', () => {
      const result = useThen('first attempt completes', async () =>
        setStoneAsPassed({ stone: '1.test', route: tempDir }, noopContext),
      );

      then('first attempt is blocked by review (not exhausted)', () => {
        expect(result.passed).toBe(false);
        expect(result.emit?.stdout).toContain('blocked');
        expect(result.emit?.stdout).toContain('rejected');
        // first attempt should NOT say exhausted
        expect(result.emit?.stdout).not.toContain('exhausted');
      });

      // 🔴 the `.toContain`s above pin four substrings and leave every other byte of
      //    this step free to regress — a reword of the blocked/rejected branches that
      //    kept those words would ship unseen. `rule.require.snapshot-every-journey-step`
      //    asks that a reviewer follow the whole journey from the snapshots alone, and
      //    this 3-step budget-depletion journey had none (r1 blocker.1, i006)
      then('matches snapshot — step 1, the round that consumed budget', () => {
        expect(
          asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
        ).toMatchSnapshot('exhausted journey - [t0] first attempt, rejected');
      });
    });

    when('[t1] second attempt depletes budget (but review still runs)', () => {
      // 🔴 setup belongs in the factory, never in a peer `then` (r4 nitpick.1, i011)
      const result = useThen(
        'the driver answers, repairs the artifact, and the attempt completes',
        async () => {
          // .note = the answer comes FIRST, and it is not optional. the entrance gate
          //         refuses a new round while a given that holds blockers is unanswered,
          //         so an edit alone can no longer buy re-entry
          await answerEveryPeerGiven({ route: tempDir, stone: '1.test' });

          // repair the artifact, which moves the hash
          await fs.writeFile(
            path.join(tempDir, '1.test.md'),
            '# Test artifact\n\nmodified for second attempt',
          );
          return setStoneAsPassed(
            { stone: '1.test', route: tempDir },
            noopContext,
          );
        },
      );

      then('verdict is rejected (not exhausted) because review RAN', () => {
        // round 2/2 runs, finds blockers → rejected
        // invariant: review that RAN cannot be exhausted
        expect(result.emit?.stdout).toContain('rejected');
        expect(result.emit?.stdout).not.toContain('exhausted');
      });

      then(
        'stdout shows actual blocker/nitpick counts from review (not zeros)',
        () => {
          expect(result.emit?.stdout).toContain('1 blocker');
          expect(result.emit?.stdout).not.toMatch(/0 blockers/i);
        },
      );

      then('matches snapshot — step 2, the round that depleted budget', () => {
        expect(
          asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
        ).toMatchSnapshot('exhausted journey - [t1] second attempt, rejected');
      });
    });

    when('[t2] third attempt hits exhaustion (review is SKIPPED)', () => {
      // 🔴 setup belongs in the factory, never in a peer `then` (r4 nitpick.1, i011)
      const result = useThen(
        'the driver answers again, repairs again, and the attempt completes',
        async () => {
          // round 2 raised its own critique; it is owed its own answer
          await answerEveryPeerGiven({ route: tempDir, stone: '1.test' });

          await fs.writeFile(
            path.join(tempDir, '1.test.md'),
            '# Test artifact\n\nmodified for third attempt',
          );
          return setStoneAsPassed(
            { stone: '1.test', route: tempDir },
            noopContext,
          );
        },
      );

      then('stdout contains exhausted', () => {
        // round 3/2 attempt → SKIPPED because budget already at 2/2 → exhausted
        expect(result.emit?.stdout).toContain('exhausted');
      });

      then(
        'stdout shows actual blocker/nitpick counts from prior review (not zeros)',
        () => {
          // even when exhausted, we show counts from the latest review that ran
          expect(result.emit?.stdout).toContain('1 blocker');
          expect(result.emit?.stdout).not.toMatch(/0 blockers/i);
        },
      );

      // the terminal step of the journey, and the one a driver most needs to read:
      // it carries the budget-exhausted options tree that names their two levers
      then('matches snapshot — step 3, exhaustion and its options tree', () => {
        expect(
          asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
        ).toMatchSnapshot('exhausted journey - [t2] third attempt, exhausted');
      });

      then(
        'passage.jsonl has an exhausted status entry (its own status, no blocker)',
        async () => {
          const passagePath = path.join(tempDir, '.route', 'passage.jsonl');
          const content = await fs.readFile(passagePath, 'utf-8');
          const lines = content.trim().split('\n');
          const exhaustedEntry = lines
            .map((line) => JSON.parse(line))
            .find((entry) => entry.status === 'exhausted');

          expect(exhaustedEntry).toBeDefined();
          expect(exhaustedEntry.blocker).toBeUndefined();
          expect(exhaustedEntry.reason).toContain('limited');
        },
      );
    });
  });

  /**
   * 🔴 .what = the driver's SOLE unilateral discharge once a reviewer is out of budget,
   *         on a FRESH given — one raised at the hash that is still current.
   *
   * .why = under F1 an exhausted reviewer's blocker persists rather than clears, so the
   *        driver keeps exactly two moves: answer it, or top up the budget (a human
   *        overrule is the third, and is not the driver's). lose the answer and this cell
   *        DEADLOCKS — the exact failure case=6 exists to prove has a valve.
   *
   * ⚠️ the `carried` twin is walked by case1 above, where the artifact moves between the
   *    given and the answer. this is the `fresh` half: the artifact is NEVER touched after
   *    the given is raised, so the given's hash is still the current one. the mechanics are
   *    identical and only the hash differs — which is precisely why it must be asserted
   *    rather than inferred: an engine keyed on (slug, hash) passes the carried case and
   *    fails this one, and an engine keyed on the current hash does the reverse.
   */
  given('[case2] a FRESH blocker answered after the reviewer exhausted', () => {
    let tempDir: string;

    beforeAll(async () => {
      tempDir = path.join(
        process.cwd(),
        '.tmp',
        `test-exhausted-fresh-answer-${Date.now()}`,
      );
      await fs.mkdir(tempDir, { recursive: true });

      // its own git root, so a printed path relativizes to a bare `.reviews/peer/…`
      // that no stabilizer swap can mask — see the note on [case1] (r10 blocker, i005)
      execSync('git init', { cwd: tempDir, stdio: 'ignore' });

      await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');

      // budget: 1 — one review runs, and every attempt after it is exhausted
      await fs.writeFile(
        path.join(tempDir, '1.test.guard'),
        [
          'artifacts:',
          '  - "$route/1.test*.md"',
          'reviews:',
          '  peer:',
          '    - slug: limited',
          '      run: echo "blockers: 1\\nnitpicks: 0\\ntest review"',
          '      budget: 1',
          '      level: 1',
          'judges:',
          '  - echo "passed: false\\nreason: blockers found"',
        ].join('\n'),
      );

      await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
    });

    afterAll(async () => {
      await fs.rm(tempDir, { recursive: true, force: true });
    });

    when('[t0] the only review runs and raises a blocker', () => {
      const result = useThen('first attempt completes', async () =>
        setStoneAsPassed({ stone: '1.test', route: tempDir }, noopContext),
      );

      then('it is blocked by the review, never by contemplation', () => {
        expect(result.passed).toBe(false);
        // no prior debt existed, so the entrance gate had none to hold
        expect(result.emit?.stdout).not.toContain('await your reply');
      });

      then('matches snapshot — the only round this budget allows', () => {
        expect(
          asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] a second attempt is made with the artifact UNTOUCHED', () => {
      const result = useThen('second attempt completes', async () =>
        setStoneAsPassed({ stone: '1.test', route: tempDir }, noopContext),
      );

      then('the entrance gate holds it on the unanswered fresh debt', () => {
        // the given from [t0] sits at the hash that is STILL current — no edit moved it.
        // P1 must halt here, and it must halt for contemplation rather than exhaustion
        expect(result.passed).toBe(false);
        expect(result.emit?.stdout).toContain('await your reply');
      });

      then(
        'matches snapshot — the FRESH-debt halt, distinct from the carried one',
        () => {
          // the neighbour cell to the contemplation journey's [t1]: there the debt was
          // carried across a hash move; here it sits at the hash that is still current.
          // the halt copy must read the same either way — a driver who is told "the
          // reviewer awaits" should not have to know which of the two they are in
          expect(
            asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
          ).toMatchSnapshot();
        },
      );
    });

    when('[t2] the driver answers, still with NO artifact edit', () => {
      // 🔴 the answer is setup, so it belongs in the factory — see the same repair in
      //    `[case3] [t2]` below (r4 nitpick.1, i011)
      const result = useThen(
        'the given is answered, and the third attempt completes',
        async () => {
          const pathsTaken = await answerEveryPeerGiven({
            route: tempDir,
            stone: '1.test',
          });
          // .note = the guard against a broken glob writing zero files, which would
          //         make `the debt is discharged` below pass for the wrong reason
          //         (rule.forbid.failhide)
          expect(pathsTaken).toHaveLength(1);
          return setStoneAsPassed(
            { stone: '1.test', route: tempDir },
            noopContext,
          );
        },
      );

      then('the debt is discharged — the contemplation halt is gone', () => {
        // this is the whole point of the cell: the answer alone cleared it, with no
        // artifact edit and no budget left for the reviewer to confirm anything
        expect(result.emit?.stdout).not.toContain('await your reply');
      });

      then('and the reviewer is now reported exhausted, not owed', () => {
        expect(result.emit?.stdout).toContain('exhausted');
      });

      then(
        'the stone still does not pass — the blocker outlived exhaustion',
        () => {
          // F1's behavior change: exhaustion no longer discharges a blocker for free.
          // the driver answered it; passage still waits on a human or a budget top-up
          expect(result.passed).toBe(false);
        },
      );

      then(
        'matches snapshot — an answered blocker beside an exhausted reviewer',
        () => {
          // the sharpest state F1 creates, and the one a driver is least equipped to
          // read: the debt is gone, the reviewer will never speak again, and the stone
          // still holds. the three assertions above pin three fragments; this pins the
          // tree that has to make that combination legible
          expect(
            asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
          ).toMatchSnapshot();
        },
      );
    });
  });

  /**
   * .what = the driver EDITS the artifact while an exhausted reviewer holds an unanswered
   *         blocker — and the debt survives the edit
   * .why = this is the wish's D2 in its sharpest form, and the one cell in the catalog that
   *        the escape hatch runs straight through.
   *
   *        under the OLD key `(slug, hash)`, this exact sequence discharged the debt for
   *        free: the edit moves the whole-artifact hash, the carried given no longer sits at
   *        `hashCurrent`, and the reviewer is exhausted so it can never write a new one. so
   *        the driver bought their way out of a critique they never answered, with one
   *        keystroke, and no surface said so.
   *
   * 🔴 .the defect this exists to catch = a regression that re-keys the debt to the hash.
   *    under it, `[t1]` below passes the entrance gate and the stone proceeds on an
   *    unanswered blocker — `rule.forbid.unanswered-exits-from-a-blocker`, restored through
   *    the door P2 was built to shut.
   *    ⚠️ **`[case2]` cannot catch this** — its `[t1]` re-enters with the artifact UNTOUCHED,
   *       so the hash never moves and the old key would hold there too. the edit is the
   *       whole variable, and it is what makes this cell distinct from its neighbour.
   *
   * 🔴 .the TWO cells this closes, and why one step could not close both:
   *
   *    | step  | cell                                         | the key it refutes          |
   *    |-------|----------------------------------------------|-----------------------------|
   *    | `[t1]`| `edit-code × fresh-unanswered × exhausted`    | `(slug, hashCurrent)`       |
   *    | `[t2]`| `edit-code × carried-unanswered × exhausted`  | `(slug, hashPrevious)`      |
   *
   *    ⚠️ **one edit cannot discriminate the two keys.** a debt keyed to *the previous
   *       hash* survives a single move and reads green at `[t1]`; only a SECOND move
   *       puts the given two hops back, where none but a reviewer-anchored key finds it.
   *       so `[t2]` is a distinct critipath rather than a repetition of `[t1]`.
   *
   * ✅ .all four steps carry a snapshot, and the note below records why they nearly did not:
   *
   *    the block was read as a CREDENTIAL gate for four rounds. it is not one.
   *    `jest.integration.env.ts:96` sources five `ehmpathy.test.*` brain keys `strict` for the
   *    WHOLE suite, so an absent key exits 2 before any test body runs — but **this case needs
   *    no brain at all.** its reviewer is `echo "blockers: 1"`, its judge is `echo`, and its
   *    context is `noopContext`. the gate is the harness's blanket demand, never this case's
   *    own need (`.dream/v2026_09_04.fix.integration-harness-demands-five-brain-keys-from-every-suite.md`).
   *
   *    🔴 the distinction that made the mint legitimate: a snapshot is forbidden when it would
   *    ASSERT OUTPUT NEVER OBSERVED. it is owed when the output can be observed. because this
   *    case reads no key on any path, output observed with the harness gate relaxed is
   *    byte-identical to output observed with the keys present — so these baselines are a real
   *    observation, never an authored guess.
   *
   *    ⚠️ **the mint was scoped to this one file, deliberately.** an unscoped run under a
   *       relaxed gate is what poisoned five acceptance baselines twice on this branch, with
   *       `malfunctioned 💥` recorded as `0 blockers / 0 nitpicks`
   *       (`.dream/v2026_09_04.fix.lenient-keyrack-flip-writes-fake-clean-snapshots.md`). that
   *       dream measured a scoped run at **0 files poisoned** and an unscoped one at **5**.
   *
   *    ⚠️ **an unminted `toMatchSnapshot()` is a RED BUILD, not a harmless gap** — which is why
   *       the assertion and its baseline are ATOMIC, and why they land together here.
   *       `package.json:63` appends `--ci` when `CI` is set; jest under `--ci` sets its update
   *       flag to `none`, and `jest-snapshot@30.2.0/build/index.js:401` writes a new snapshot
   *       only for `new` or `all`. `:1595` is the exact failure it emits instead — *"New
   *       snapshot was not written. The update flag must be explicitly passed to write a new
   *       snapshot."*
   *
   *    ⇒ the ten ACCEPTANCE steps caught at
   *      `.dream/v2026_09_05.fix.journey-steps-lack-snapshots-behind-a-credential-gate.md`
   *      are a separate matter and stay queued — those suites DO drive brains, so their
   *      baselines cannot be observed without the grant.
   *
   * .note = authored at 5.3 to close both cells, which the experience catalog carried as its
   *         weakest verification gaps and which no extant journey drove — `[case2] [t2]`
   *         answers with NO edit, `[case3] [t2]` answers FIRST and only then edits, so both
   *         leave the edit-before-answer path unproven (r5 blocker.1, i018).
   */
  given(
    '[case4] the artifact is EDITED while an exhausted reviewer holds an unanswered blocker',
    () => {
      let tempDir: string;

      beforeAll(async () => {
        tempDir = path.join(
          process.cwd(),
          '.tmp',
          `test-exhausted-edit-escape-${Date.now()}`,
        );
        await fs.mkdir(tempDir, { recursive: true });
        execSync('git init', { cwd: tempDir, stdio: 'ignore' });

        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');

        // budget: 1 — one round runs, raises a blocker, and is spent thereafter
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: limited',
            '      run: echo "blockers: 1\\nnitpicks: 0\\ntest review"',
            '      budget: 1',
            '      level: 1',
            'judges:',
            '  - echo "passed: false\\nreason: blockers found"',
          ].join('\n'),
        );

        await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');
      });

      afterAll(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      when('[t0] the one round the budget affords raises a blocker', () => {
        const result = useThen('first attempt completes', async () =>
          setStoneAsPassed({ stone: '1.test', route: tempDir }, noopContext),
        );

        then('the blocker lands, and no prior debt held the door', () => {
          expect(result.passed).toBe(false);
          expect(result.emit?.stdout).not.toContain('await your reply');
        });

        then('matches snapshot — the round that raised the blocker', () => {
          expect(
            asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
          ).toMatchSnapshot('edit-escape journey - [t0] blocker raised');
        });
      });

      when(
        '[t1] the driver EDITS the artifact instead of an answer, and re-enters',
        () => {
          const result = useThen(
            'the artifact is rewritten, and the next attempt completes',
            async () => {
              // the escape hatch itself: one keystroke moves the whole-artifact hash
              await fs.writeFile(
                path.join(tempDir, '1.test.md'),
                '# Test artifact\n\nedited, with the critique still unanswered',
              );
              return setStoneAsPassed(
                { stone: '1.test', route: tempDir },
                noopContext,
              );
            },
          );

          then('the debt SURVIVES the edit — the gate still holds', () => {
            // the whole wish, in one assertion. under `(slug, hash)` this read false:
            // the given sat at the prior hash, the reviewer was spent, and the door opened
            expect(result.emit?.stdout).toContain('await your reply');
            expect(result.passed).toBe(false);
          });

          then(
            'the guide names the CARRIED given, so the debt is payable',
            () => {
              // ⚠️ the anti-deadlock half. the taken path is derived from the given path, so a
              //    guide that named a CURRENT-hash file would send the driver to write one the
              //    matcher then refuses — a debt with no discharge
              expect(result.emit?.stdout).toContain('contemplate from');
              expect(result.emit?.stdout).toContain('articulate into');
              expect(result.emit?.stdout).toContain('limited');
            },
          );

          // 🔴 the four `.toContain`s above pin four substrings and leave every other
          //    byte free to regress. this step is the wish's central claim — the debt
          //    SURVIVES an edit — so a reword of the halt tree that kept those four
          //    words would ship unseen (`rule.require.snapshot-every-journey-step`)
          then('matches snapshot — the halt that survived the edit', () => {
            expect(
              asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
            ).toMatchSnapshot(
              'edit-escape journey - [t1] debt survives one edit',
            );
          });
        },
      );

      when(
        '[t2] the driver EDITS A SECOND TIME, over an ALREADY-CARRIED debt',
        () => {
          const result = useThen(
            'the artifact is rewritten again, and the next attempt completes',
            async () => {
              await fs.writeFile(
                path.join(tempDir, '1.test.md'),
                '# Test artifact\n\nedited twice, with the critique still unanswered',
              );
              return setStoneAsPassed(
                { stone: '1.test', route: tempDir },
                noopContext,
              );
            },
          );

          // 🔴 .why this step is NOT a repeat of [t1] = [t1] moves the hash ONCE, so a
          //    debt keyed to `the previous hash` would survive it and read green. this
          //    step moves it a SECOND time, which that wrong key cannot survive: the
          //    given now sits two hash-moves back, so only a key anchored to the
          //    REVIEWER — never to any hash, current or prior — still finds it.
          //    ⇒ the cell is `edit-code × carried-unanswered × exhausted`, and it is a
          //      distinct critipath from [t1]'s `edit-code × fresh-unanswered ×
          //      exhausted` precisely because one edit cannot discriminate the two keys
          //      (r5 blocker.1 item 1, i018).
          then('the debt survives a SECOND hash move', () => {
            expect(result.emit?.stdout).toContain('await your reply');
            expect(result.passed).toBe(false);
          });

          then(
            'the guide still points at the ORIGINAL given, two moves back',
            () => {
              // the budget was spent at [t0], so no new round ran and no new given was
              // written. the one payable file is still the one from the first hash —
              // and the anti-deadlock property demands the guide keep it named
              expect(result.emit?.stdout).toContain('articulate into');
              expect(result.emit?.stdout).toContain('limited');
            },
          );

          // 🔴 the pin that discriminates the two keys. a debt keyed to `the previous
          //    hash` survives [t1] and reads green; only a reviewer-anchored key
          //    survives TWO moves. the tree here must still name the ORIGINAL given,
          //    and only a byte-exact pin proves the guide did not drift to a current-
          //    hash path the matcher would then refuse
          then('matches snapshot — the halt after a SECOND hash move', () => {
            expect(
              asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
            ).toMatchSnapshot(
              'edit-escape journey - [t2] debt survives two edits',
            );
          });
        },
      );

      when('[t3] the driver answers the carried debt', () => {
        const result = useThen(
          'the carried given is answered, and the attempt completes',
          async () => {
            const pathsTaken = await answerEveryPeerGiven({
              route: tempDir,
              stone: '1.test',
            });
            // guard against a broken glob writes zero files, which would make the
            // discharge below pass for the wrong reason (`rule.forbid.failhide`)
            expect(pathsTaken).toHaveLength(1);
            return setStoneAsPassed(
              { stone: '1.test', route: tempDir },
              noopContext,
            );
          },
        );

        then('the contemplation halt is gone — the ANSWER cleared it', () => {
          // the pair to [t1]: the edit did not discharge the debt, and the answer did.
          // that asymmetry is the contract, and it is what makes the answer the one door
          expect(result.emit?.stdout).not.toContain('await your reply');
        });

        then('the stone still holds — a human or a top-up is owed', () => {
          expect(result.passed).toBe(false);
        });

        // 🔴 the journey's terminus, and the one step whose snapshot carries the
        //    ASYMMETRY: [t1] and [t2] pin a halt that an edit could not clear, and
        //    this pins its absence once an ANSWER landed. read as a set, the four
        //    baselines show the whole contract — the edit is not a door, the answer is
        then('matches snapshot — the answer cleared the halt', () => {
          expect(
            asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
          ).toMatchSnapshot(
            'edit-escape journey - [t3] answer discharges the debt',
          );
        });
      });
    },
  );

  /**
   * 🔴 .what = the ORDER of the driver's two levers — answer FIRST, then top up.
   *
   * .why = case=5's `[t2b]` is the step that stops `[t2]` from a wrong lesson. `[t2]` ends
   *        with the debt answered and the reviewer exhausted, which invites the read
   *        *"budget is not a real lever"*. it is — but it is a CONFIRMATION lever, never a
   *        DISCHARGE one, and those two readings differ in exactly one observable: whether
   *        a top-up with no answer opens the gate.
   *
   * 🔴 .the defect this exists to catch = a change that let the top-up clear the debt. under
   *    it, `[t1]` below would open the gate, the reviewer would re-run, and the driver would
   *    have bought their way out of a critique they never answered — `rule.forbid.
   *    unanswered-exits-from-a-blocker`, restored through the one door F1 left open.
   *    ⚠️ **every other case in this suite passes under that change.** they never top up.
   *
   * .note = this case was authored at 5.3 because the yield CLAIMED `[t2b]` was clamped and
   *         no test performed a top-up anywhere — no `route.guard.budget`, no `--add`, no
   *         meter reset. an unproven claim, caught by r4 at i011.
   *
   * .how = the top-up is a rewrite of the guard's `budget:` line, which is exactly what
   *        `rhx route.guard.budget --for review --add N` does to the same file:
   *        `updateGuardPeerBudgets` in `src/contract/cli/route.ts` locates the `budget:`
   *        line inside the peer section and writes back
   *        `` `${indent}budget: ${budgetBefore + addAmount}` `` — one line, same indent,
   *        same file. so this rewrite is not an approximation of the command; it is the
   *        command's own effect, produced directly.
   *
   * 🔴 .the seam this leaves, stated rather than hidden = what this suite does NOT drive is
   *    the command's own parse → locate → write-back → meter-recompute path. that path is a
   *    CLI contract, so it is covered where a CLI contract must be covered — blackbox
   *    acceptance, not here:
   *      - `blackbox/driver.route.peer-budget.acceptance.test.ts` `[t3]` invokes the real
   *        `route.guard.budget --for review --add 2 --peer … --stone …` and snapshots it
   *      - plus `peer-budget-bulk`, `peer-budget-multilevel`, `peer-budget-malfunction`,
   *        and `usage-errors`, which pin its bulk, multilevel, and rejection behaviours
   *    ⇒ the division is deliberate and follows `rule.require.test-coverage-by-grain`: the
   *      CLI is graded at the acceptance grain; this integration case grades the ENGINE
   *      invariant (a top-up buys a confirmation round, never a discharge), which the CLI
   *      cannot express and which no acceptance test asserts.
   */
  given(
    '[case3] a budget top-up does NOT discharge a debt — it only buys a confirmation round',
    () => {
      let tempDir: string;

      /**
       * .what = writes the guard with the given peer budget
       * .why = the journey rewrites this file mid-walk to perform the top-up, so the
       *        shape is declared once and the only variable is the number
       *
       * .note = the reviewer's verdict reads the ARTIFACT, so it can genuinely confirm a
       *         fix rather than parrot a constant. a static `echo "blockers: 1"` could
       *         never show a confirmation round, only a second rejection
       */
      const writeGuard = async (input: { budget: number }): Promise<void> => {
        await fs.writeFile(
          path.join(tempDir, '1.test.guard'),
          [
            'artifacts:',
            '  - "$route/1.test*.md"',
            'reviews:',
            '  peer:',
            '    - slug: limited',
            '      run: printf x >> "$route/runs.txt"; if grep -q FIXED "$route/1.test.md"; then echo "blockers: 0"; else echo "blockers: 1"; fi; echo "nitpicks: 0"',
            `      budget: ${input.budget}`,
            '      level: 1',
            'judges:',
            '  - echo "passed: false\\nreason: blockers found"',
          ].join('\n'),
        );
      };

      beforeAll(async () => {
        tempDir = path.join(
          process.cwd(),
          '.tmp',
          `test-exhausted-topup-order-${Date.now()}`,
        );
        await fs.mkdir(tempDir, { recursive: true });
        execSync('git init', { cwd: tempDir, stdio: 'ignore' });

        await fs.writeFile(path.join(tempDir, '1.test.stone'), '# Test stone');
        await fs.writeFile(path.join(tempDir, '1.test.md'), '# Test artifact');

        // budget: 1 — one round runs, and the reviewer is spent thereafter
        await writeGuard({ budget: 1 });
      });

      afterAll(async () => {
        await fs.rm(tempDir, { recursive: true, force: true });
      });

      when('[t0] the one round the budget affords raises a blocker', () => {
        const result = useThen('first attempt completes', async () =>
          setStoneAsPassed({ stone: '1.test', route: tempDir }, noopContext),
        );

        then('the round ran and the reviewer rejected', () => {
          expect(result.passed).toBe(false);
          expect(countReviewerRuns({ route: tempDir })).toEqual(1);
          // no prior debt existed, so the entrance gate had none to hold
          expect(result.emit?.stdout).not.toContain('await your reply');
        });

        then(
          'matches snapshot — step 1, the round that spent the budget',
          () => {
            expect(
              asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
            ).toMatchSnapshot();
          },
        );
      });

      when(
        '[t1] the driver tops the budget up and re-enters, with NO answer written',
        () => {
          // 🔴 the top-up is SETUP, and of the three in this suite it is the one whose
          //    order matters most. were it skipped, the budget would stay at 1, the
          //    reviewer would be exhausted, and `the gate STILL holds` below would go
          //    green — off exhaustion rather than off the debt. the assertion this whole
          //    case exists for would then pass while it proved the opposite of its title
          //    (rule.forbid.order-dependence; r4 nitpick.1, i011)
          const result = useThen(
            'the budget is topped up to three, and the attempt completes',
            async () => {
              await writeGuard({ budget: 3 });
              return setStoneAsPassed(
                { stone: '1.test', route: tempDir },
                noopContext,
              );
            },
          );

          then('the gate STILL holds — budget is not a discharge path', () => {
            // the assertion this whole case exists for. the reviewer now has budget
            // to spare, so exhaustion cannot be what stops it — the only cause left
            // is the unanswered debt, and it must still stop it
            expect(result.passed).toBe(false);
            expect(result.emit?.stdout).toContain('await your reply');
          });

          then(
            'and NO round was spawned — the halt precedes the fresh budget',
            () => {
              // the tally is what parts "halted at the entrance" from "ran and rejected
              // again". were the top-up to discharge the debt, the reviewer would have
              // run a second time here and this would read 2
              expect(countReviewerRuns({ route: tempDir })).toEqual(1);
            },
          );

          then(
            'matches snapshot — a topped-up reviewer, still held by the debt',
            () => {
              expect(
                asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
              ).toMatchSnapshot();
            },
          );
        },
      );

      when(
        '[t2] the driver answers and repairs, then re-enters on the topped-up budget',
        () => {
          // 🔴 the repair and the answer are SETUP, so they live in the factory rather
          //    than in a peer `then`. i first wrote them as a peer block — the exact
          //    shape r4 flagged — inside the fix for r4's own blocker, which is the tell
          //    for how natural the shape feels: it reads as a journey step because it IS
          //    one, and jest still owes it no order (r4 nitpick.1, i011)
          const result = useThen(
            'the repair lands, the given is answered, and the attempt completes',
            async () => {
              await fs.writeFile(
                path.join(tempDir, '1.test.md'),
                '# Test artifact\n\nFIXED — the critique was addressed',
              );
              const pathsTaken = await answerEveryPeerGiven({
                route: tempDir,
                stone: '1.test',
              });
              // .note = were the glob to break, the helper would write zero files and
              //         `the gate opens` below would go red for the wrong reason — or
              //         worse, a later refactor could make it pass for the wrong one
              //         (rule.forbid.failhide)
              expect(pathsTaken).toHaveLength(1);
              return setStoneAsPassed(
                { stone: '1.test', route: tempDir },
                noopContext,
              );
            },
          );

          then('the gate opens — the ANSWER is what discharged it', () => {
            expect(result.emit?.stdout).not.toContain('await your reply');
          });

          then(
            'and NOW the topped-up reviewer re-runs and confirms the fix',
            () => {
              // the second half of the lesson: the top-up was never wasted, it was simply
              // premature. spent AFTER the answer it buys exactly what the driver wanted —
              // a round in which the critic reads the repair and agrees
              expect(countReviewerRuns({ route: tempDir })).toEqual(2);
              expect(result.emit?.stdout).not.toContain('exhausted');
            },
          );

          then(
            'matches snapshot — the confirmation round the ordered levers bought',
            () => {
              expect(
                asStableEmit({ emit: result.emit?.stdout, route: tempDir }),
              ).toMatchSnapshot();
            },
          );
        },
      );
    },
  );
});
