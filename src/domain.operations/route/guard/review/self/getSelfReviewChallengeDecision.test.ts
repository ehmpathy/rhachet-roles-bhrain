import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import { isPathFound } from '../../../isPathFound';
import { getSelfReviewArticulationPath } from './getSelfReviewArticulationPath';
import {
  getSelfReviewChallengeDecision,
  SELF_REVIEW_HASTE_WINDOW_MS,
} from './getSelfReviewChallengeDecision';
import { getSelfReviewTriggeredPaths } from './getSelfReviewTriggeredPaths';
import { getSelfReviewTriggeredReport } from './getSelfReviewTriggeredReport';
import { setSelfReviewTriggeredReport } from './setSelfReviewTriggeredReport';

/**
 * .what = a fresh route dir, one per case, so no case reads another's markers
 * .why = the key is (stone, slug) now. two cases that share a route dir would share a
 *        trigger report, and the cross-talk would read as a defect in the operation
 */
const genRouteDir = (slug: string): string =>
  path.join(
    os.tmpdir(),
    `test-challenge-${slug}-${Date.now()}-${Math.random()}`,
  );

/**
 * .what = writes an articulation at the owed path
 * .why = every verdict past `mismatch` needs a real file to read
 */
const setArticulation = async (input: {
  route: string;
  stone: string;
  slug: string;
  body?: string;
}): Promise<string> => {
  const articulationPath = getSelfReviewArticulationPath(input);
  await fs.mkdir(path.dirname(articulationPath), { recursive: true });
  await fs.writeFile(articulationPath, input.body ?? '# self-review\n');
  return articulationPath;
};

/**
 * .what = writes the stone's DELIVERABLE — the artifact the review is about
 * .why = 🔴 this is the write that used to reset the clock, and it is NOT the articulation.
 *        `getAllStoneArtifacts` globs `$route/$stone.yield*` and `$route/$stone*.md`, so the
 *        hashed set is the deliverable alone. a review file under `review/self/` was never
 *        in it.
 *
 * .note = a test whose "repair" writes only the articulation proves naught about this round:
 *         that write did not move the hash under the OLD design either, so the case would
 *         have passed before the change and after it. the clamp must write THIS file to bite.
 */
const setDeliverable = async (input: {
  route: string;
  stone: string;
  body: string;
}): Promise<void> => {
  const deliverablePath = path.join(input.route, `${input.stone}.yield.md`);
  await fs.mkdir(path.dirname(deliverablePath), { recursive: true });
  await fs.writeFile(deliverablePath, input.body);
};

/**
 * .what = back-dates the ask, so elapsed-since-the-ask reads as older than the window
 * .why = the haste cue measures against the TRIGGER's mtime. a test that waits 30s in real
 *        time would be slow and flaky; a test that moves the marker's mtime is neither.
 */
const setAskMtimeTo = async (input: {
  route: string;
  stone: string;
  slug: string;
  agoMs: number;
}): Promise<void> => {
  const { sincePath } = getSelfReviewTriggeredPaths(input);
  const asOf = new Date(Date.now() - input.agoMs);
  await fs.utimes(sincePath, asOf, asOf);
};

describe('getSelfReviewChallengeDecision', () => {
  given('[case1] the thorough driver — a repair resets no clock', () => {
    const scene = useBeforeAll(async () => {
      const route = genRouteDir('thorough');
      await setSelfReviewTriggeredReport(
        { stone: '1.vision', slug: 'all-done', route },
        { sinceOnly: true },
      );
      return { route };
    });

    when('[t0] the ask is minted', () => {
      then('the attempt count is 0 — the ask burns none', async () => {
        const report = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.route,
        });
        expect(report?.attempts).toEqual(0);
      });

      then('the marker carries no artifact hash in its name', () => {
        const { sincePath } = getSelfReviewTriggeredPaths({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.route,
        });
        expect(path.basename(sincePath)).toEqual(
          '1.vision.guard.selfreview.all-done.triggered.since',
        );
      });
    });

    when(
      '[t1] the driver repairs the artifact, then promises 39min later',
      () => {
        /**
         * 🔴 the repair is a write to the DELIVERABLE, never to the articulation. under the
         *    hash key each of these three writes minted a fresh report with the clock at now,
         *    so the driver who obeyed the guard's own `for each found issue 🪘` block was
         *    refused — measured at six refusals across five reviews on one stone.
         *
         * .note = three writes, never one. a single write proves the key ignores ONE repair;
         *         the measured defect was that EVERY repair reset it, so the clamp repeats.
         */
        then('the decision is allowed, on the FIRST command', async () => {
          for (const found of ['first', 'second', 'third']) {
            await setDeliverable({
              route: scene.route,
              stone: '1.vision',
              body: `# the yield\n\nrepaired the ${found} defect\n`,
            });
          }

          const into = await setArticulation({
            route: scene.route,
            stone: '1.vision',
            slug: 'all-done',
          });
          await setAskMtimeTo({
            route: scene.route,
            stone: '1.vision',
            slug: 'all-done',
            agoMs: 39 * 60 * 1000,
          });

          const result = await getSelfReviewChallengeDecision({
            stone: '1.vision',
            slug: 'all-done',
            route: scene.route,
            into,
          });

          expect(result.decision).toEqual('allowed');
        });

        then(
          'the ask it measures is the ORIGINAL — no repair re-minted it',
          async () => {
            const { sincePath } = getSelfReviewTriggeredPaths({
              stone: '1.vision',
              slug: 'all-done',
              route: scene.route,
            });
            const stat = await fs.stat(sincePath);

            // the back-date above set the ask to 39min ago. had any repair re-minted the
            // report, its mtime would read as now — the reset this round removes.
            expect(Date.now() - stat.mtime.getTime()).toBeGreaterThan(
              30 * 60 * 1000,
            );
          },
        );
      },
    );
  });

  given('[case2] the fast driver — confronted by words, not by a wait', () => {
    const scene = useBeforeAll(async () => {
      const route = genRouteDir('fast');
      await setSelfReviewTriggeredReport(
        { stone: '1.vision', slug: 'all-done', route },
        { sinceOnly: true },
      );
      const into = await setArticulation({
        route,
        stone: '1.vision',
        slug: 'all-done',
        body: 'looks good\n',
      });
      return { route, into };
    });

    when('[t0] the driver promises 8s after the ask', () => {
      const verdict = useThen('the guard adjudicates the promise', async () =>
        getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.route,
          into: scene.into,
        }),
      );

      then('the decision is challenge:rushed', () => {
        expect(verdict.decision).toEqual('challenge:rushed');
      });

      then(
        'the attempt count becomes 1 — the promise was adjudicated',
        async () => {
          const report = await getSelfReviewTriggeredReport({
            stone: '1.vision',
            slug: 'all-done',
            route: scene.route,
          });
          expect(report?.attempts).toEqual(1);
        },
      );

      then('it reports no elapsed duration as a reason to refuse', () => {
        expect(verdict).not.toHaveProperty('waitMs');
        expect(verdict).not.toHaveProperty('retryAfter');
      });
    });

    when('[t1] the driver rewrites the articulation and promises again', () => {
      /**
       * 🔴 .why = this is the END-TO-END clamp on "at most once per slug", and the gate operand
       *           is `firstAdjudication`, NEVER the attempt count. the two are easy to confuse
       *           because both rise on the same promise — and this then-block was titled
       *           "the count gates, and it is spent" until 2026-09-20, which named the wrong
       *           one. a reader who trusted that title would build the next gate on a counter
       *           that is a read-modify-write and undercounts under a same-slug fork.
       * .note = `setSelfReviewTriggeredReport [case7]` clamps the atomic half — exactly one of
       *         eight lanes that race wins the claim. this clamps the composition: the lane
       *         that did not win is ALLOWED, inside the window, on a second promise.
       */
      then(
        'the decision is allowed — the first-ness claim is spent, and only it gates',
        async () => {
          const result = await getSelfReviewChallengeDecision({
            stone: '1.vision',
            slug: 'all-done',
            route: scene.route,
            into: scene.into,
          });
          expect(result.decision).toEqual('allowed');
        },
      );

      /**
       * 🔴 .why = the D7 cell "one slug, two promises" had a VERDICT clamp above and no clamp on
       *           the counter, and the vision's inventory read "a re-promise is idempotent and
       *           burns no attempt" on the strength of that absence. the code says otherwise —
       *           `setSelfReviewTriggeredReport.ts:133` increments on EVERY adjudicated promise —
       *           so the doc claimed a property no test held it to.
       * 🔴 .what it pins = the counter is NOT idempotent, and that is SAFE rather than a defect,
       *           because the then-block above proves the gate does not read it. ⇒ the two
       *           assertions are owed together: drop either and the pair stops to say anything.
       * .note = the concurrent half of this cell is clamped at `setSelfReviewTriggeredReport
       *         [case7]` — eight lanes on one slug, exactly one wins the first-ness claim.
       */
      then(
        'the attempt count rises to 2 — a re-promise is NOT idempotent',
        async () => {
          const report = await getSelfReviewTriggeredReport({
            stone: '1.vision',
            slug: 'all-done',
            route: scene.route,
          });
          expect(report?.attempts).toEqual(2);
        },
      );
    });
  });

  given(
    '[case2b] the conceded bypass — a wait spent idle reads as thorough',
    () => {
      const scene = useBeforeAll(async () => {
        const route = genRouteDir('idle');
        await setSelfReviewTriggeredReport(
          { stone: '1.vision', slug: 'all-done', route },
          { sinceOnly: true },
        );
        const into = await setArticulation({
          route,
          stone: '1.vision',
          slug: 'all-done',
          body: 'ok\n',
        });
        await setAskMtimeTo({
          route,
          stone: '1.vision',
          slug: 'all-done',
          // 🔴 derived from the gate's own window, never re-typed. this read `31 * 1000` until
          //    2026-09-20, with naught that coupled it to the source. `F06` is OPEN and may
          //    move the window, and a hand-typed 31 would then sit INSIDE it — the assertion
          //    below would flip from "just past the boundary" to "well within it" and still
          //    pass, since a rushed promise is allowed either way. ⇒ the case would stop to
          //    grade the boundary and say naught about it
          agoMs: SELF_REVIEW_HASTE_WINDOW_MS + 1000,
        });
        return { route, into };
      });

      when(
        '[t0] the driver promises ONCE, 31s after the ask, with a garbage articulation',
        () => {
          then(
            'the decision is allowed, and the prompt never renders',
            async () => {
              // .note = S13's own residual, asserted rather than hidden. the clock decides whether
              //         a PARAGRAPH renders, never whether a promise passes — so what this driver
              //         evades is a message. the articulation gate is what still bounds them.
              const result = await getSelfReviewChallengeDecision({
                stone: '1.vision',
                slug: 'all-done',
                route: scene.route,
                into: scene.into,
              });
              expect(result.decision).toEqual('allowed');
            },
          );
        },
      );
    },
  );

  given('[case3] the misplaced articulation — a DIFF, never an absence', () => {
    const scene = useBeforeAll(async () => {
      const route = genRouteDir('misplaced');
      await setSelfReviewTriggeredReport(
        { stone: '1.vision', slug: 'all-done', route },
        { sinceOnly: true },
      );
      return { route, declared: `${route}/review/self/wrong-place.md` };
    });

    when('[t0] the driver names a path that is not the owed path', () => {
      const verdict = useThen('the guard adjudicates the promise', async () =>
        getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.route,
          into: scene.declared,
        }),
      );

      then('the decision is challenge:mismatch', () => {
        expect(verdict.decision).toEqual('challenge:mismatch');
      });

      then('BOTH operands are returned — that is what makes it a diff', () => {
        expect(verdict.declaredPath).toEqual(scene.declared);
        expect(verdict.articulationPath).toEqual(
          getSelfReviewArticulationPath({
            route: scene.route,
            stone: '1.vision',
            slug: 'all-done',
          }),
        );
      });

      then(
        'it burns NO attempt — a path defect must not spend the haste budget',
        async () => {
          // .why = D5. a driver who mistypes a path twice would otherwise exhaust the cue and
          //        never meet it, so a path verdict is not an adjudication of the review
          const report = await getSelfReviewTriggeredReport({
            stone: '1.vision',
            slug: 'all-done',
            route: scene.route,
          });
          expect(report?.attempts).toEqual(0);
        },
      );
    });

    when('[t1] the declared path differs only by a `./` prefix', () => {
      then(
        'the decision is NOT a mismatch — one location, two spellings',
        async () => {
          const owed = await setArticulation({
            route: scene.route,
            stone: '1.vision',
            slug: 'all-done',
          });
          const result = await getSelfReviewChallengeDecision({
            stone: '1.vision',
            slug: 'all-done',
            route: scene.route,
            into: `./${owed}`,
          });
          expect(result.decision).not.toEqual('challenge:mismatch');
        },
      );
    });

    /**
     * 🔴 .what = the F04/F05 scenario, pinned: the owed file is REAL and FRESH, and the
     *            driver mistypes `--into` anyway. the verdict is REFUSE, regardless.
     *
     * 🔴 .why = the shipped code already answers `F04`/`F05` in the refuse-always direction,
     *           and until this case landed no test in the tree constructed it. every other
     *           mismatch case leaves BOTH paths empty, so the suite could not tell
     *           "refuse, always" apart from "refuse, because no file was found either way".
     *           ⇒ so a fulcrum the council has not ruled had its answer set by code, silently
     *             and with no coverage. this case does not settle it — it makes the answer
     *             the code gives VISIBLE, so a verdict is cast on observed behavior rather
     *             than on a description of it. found by a peer lane at i013.
     *
     * 🔴 .what it does NOT pin = the ORDER of the two gates. this case was named
     *    "the path gate refuses first" until the revert-and-watch check falsified the claim:
     *    with the mismatch check moved BELOW the existence stat it stayed green, because the
     *    owed file is present, so the stat passes and the mismatch verdict is reached anyway.
     *    ⇒ what it pins is the VERDICT under a present owed file, which is the F04 question.
     *      the bite that reddens it is the other F04 direction — forgive the mismatch when
     *      the owed file exists — and under that disarm 3 of its 4 assertions fail.
     *    ⚠️ the lesson generalizes past this case: a clamp can name the right subject and
     *      pin a DIFFERENT property than its own prose claims, and only the bite check parts
     *      the two. the name was the thing that was wrong; the coverage was real.
     *
     * ⚠️ .note = the case is deliberately SELF-CONTAINED — its own route, its own ask — and
     *            does NOT lean on `[t1]`'s write to the shared scene. an assertion that reads
     *            a peer case's side effect passes or fails by execution order, which is the
     *            one property a coverage clamp must never have.
     */
    when(
      '[t2] the owed file IS present, and the driver mistypes --into',
      () => {
        const staged = useBeforeAll(async () => {
          const route = genRouteDir('misplaced-but-present');
          await setSelfReviewTriggeredReport(
            { stone: '1.vision', slug: 'all-done', route },
            { sinceOnly: true },
          );
          const owed = await setArticulation({
            route,
            stone: '1.vision',
            slug: 'all-done',
          });
          return { route, owed, declared: `${route}/review/self/typo.md` };
        });

        const verdict = useThen('the guard adjudicates the promise', async () =>
          getSelfReviewChallengeDecision({
            stone: '1.vision',
            slug: 'all-done',
            route: staged.route,
            into: staged.declared,
          }),
        );

        then(
          'the decision is challenge:mismatch — a present owed file forgives naught',
          () => {
            expect(verdict.decision).toEqual('challenge:mismatch');
          },
        );

        then(
          'the owed file really was on disk, so the refusal is not an absence',
          async () => {
            // .note = this one clamps the FIXTURE, never the code, so it is green by design.
            //         it refuses a later edit that drops the `setArticulation` call and thereby
            //         collapses this case back into `[t0]`, where both paths are empty
            const stat = await fs.stat(staged.owed);
            expect(stat.isFile()).toEqual(true);
          },
        );

        then(
          'BOTH operands are returned, so the emit can still render a diff',
          () => {
            expect(verdict.declaredPath).toEqual(staged.declared);
            expect(verdict.articulationPath).toEqual(staged.owed);
          },
        );

        then(
          'it burns NO attempt — a path verdict is not an adjudication',
          async () => {
            const report = await getSelfReviewTriggeredReport({
              stone: '1.vision',
              slug: 'all-done',
              route: staged.route,
            });
            expect(report?.attempts).toEqual(0);
          },
        );
      },
    );
  });

  given(
    '[case4] the absent articulation — it names the path it looked at',
    () => {
      const scene = useBeforeAll(async () => {
        const route = genRouteDir('absent');
        await setSelfReviewTriggeredReport(
          { stone: '1.vision', slug: 'all-done', route },
          { sinceOnly: true },
        );
        return {
          route,
          owed: getSelfReviewArticulationPath({
            route,
            stone: '1.vision',
            slug: 'all-done',
          }),
        };
      });

      when('[t0] the driver names the owed path, and no file is there', () => {
        const verdict = useThen('the guard adjudicates the promise', async () =>
          getSelfReviewChallengeDecision({
            stone: '1.vision',
            slug: 'all-done',
            route: scene.route,
            into: scene.owed,
          }),
        );

        then('the decision is challenge:absent', () => {
          expect(verdict.decision).toEqual('challenge:absent');
        });

        then('it returns the exact path the guard read', () => {
          expect(verdict.articulationPath).toEqual(scene.owed);
        });

        then('it burns no attempt', async () => {
          const report = await getSelfReviewTriggeredReport({
            stone: '1.vision',
            slug: 'all-done',
            route: scene.route,
          });
          expect(report?.attempts).toEqual(0);
        });
      });
    },
  );

  given('[case6] the stale articulation — it predates the ask', () => {
    const scene = useBeforeAll(async () => {
      const route = genRouteDir('stale');

      // a leftover from a prior round: written BEFORE the ask was minted
      const into = await setArticulation({
        route,
        stone: '1.vision',
        slug: 'all-done',
        body: '# a review of an artifact that has since moved on\n',
      });
      const longAgo = new Date(Date.now() - 60 * 60 * 1000);
      await fs.utimes(into, longAgo, longAgo);

      await setSelfReviewTriggeredReport(
        { stone: '1.vision', slug: 'all-done', route },
        { sinceOnly: true },
      );
      return { route, into };
    });

    when('[t0] the driver promises against the leftover file', () => {
      const verdict = useThen('the guard adjudicates the promise', async () =>
        getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.route,
          into: scene.into,
        }),
      );

      then('the decision is challenge:stale', () => {
        expect(verdict.decision).toEqual('challenge:stale');
      });

      then(
        'it names BOTH dates, so the driver knows which one is wrong',
        () => {
          expect(verdict.articulationMtime).toBeDefined();
          expect(verdict.askedAt).toBeDefined();
        },
      );

      then('the datum is the ASK, never the artifact', () => {
        // .why = the question is "was this written for the review we asked for?",
        //        and only the ask dates that
        expect(new Date(verdict.articulationMtime!).getTime()).toBeLessThan(
          new Date(verdict.askedAt!).getTime(),
        );
      });

      then('it burns no attempt', async () => {
        const report = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.route,
        });
        expect(report?.attempts).toEqual(0);
      });
    });
  });

  given('[case8] the forked driver — no lane depends on another', () => {
    const scene = useBeforeAll(async () => {
      const route = genRouteDir('forked');
      const slugs = ['lane-a', 'lane-b'];

      // the hand-out: every unpromised review is triggered together
      await Promise.all(
        slugs.map((slug) =>
          setSelfReviewTriggeredReport(
            { stone: '1.vision', slug, route },
            { sinceOnly: true },
          ),
        ),
      );
      return { route, slugs };
    });

    when('[t0] all lanes are handed out at once', () => {
      then('each lane has its own trigger, at attempts 0', async () => {
        for (const slug of scene.slugs) {
          const report = await getSelfReviewTriggeredReport({
            stone: '1.vision',
            slug,
            route: scene.route,
          });
          expect(report?.attempts).toEqual(0);
        }
      });
    });

    when('[t4] lane B repairs the artifact INSIDE lane A open window', () => {
      /**
       * 🔴 the INTERLEAVE. the one step a serial run cannot express: lane A is asked and has
       *    NOT yet promised when lane B's write lands. under the hash key, B's write re-keyed
       *    A's report, so A read `absent`, minted a fresh one, and was confronted for work it
       *    did not do. the assertion is byte-identity across B's write.
       *
       * .note = B repairs the DELIVERABLE, never its own articulation. the hashed set is
       *         `$route/$stone.yield*` + `$route/$stone*.md`, so a write under `review/self/`
       *         would not have moved the key under the old design either — a clamp aimed
       *         there proves the fork harmless against a write that never harmed it.
       */
      const readLaneAReport = async (): Promise<string> => {
        const { sincePath } = getSelfReviewTriggeredPaths({
          stone: '1.vision',
          slug: 'lane-a',
          route: scene.route,
        });
        const [body, stat] = await Promise.all([
          fs.readFile(sincePath, 'utf-8'),
          fs.stat(sincePath),
        ]);
        return `${body}::${stat.mtime.getTime()}`;
      };

      then('lane A report is byte-identical across B write', async () => {
        const before = await readLaneAReport();

        // lane B repairs the shared deliverable while lane A's window is still open
        await setDeliverable({
          route: scene.route,
          stone: '1.vision',
          body: '# the yield\n\nlane b repaired what it found\n',
        });
        await setArticulation({
          route: scene.route,
          stone: '1.vision',
          slug: 'lane-b',
        });

        const after = await readLaneAReport();
        expect(after).toEqual(before);
      });

      then('lane A attempt count is unchanged by B repair', async () => {
        const report = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'lane-a',
          route: scene.route,
        });
        expect(report?.attempts).toEqual(0);
      });

      then(
        'lane A verdict is what it would have been had B never run',
        async () => {
          const into = await setArticulation({
            route: scene.route,
            stone: '1.vision',
            slug: 'lane-a',
          });
          await setAskMtimeTo({
            route: scene.route,
            stone: '1.vision',
            slug: 'lane-a',
            agoMs: 10 * 60 * 1000,
          });

          const result = await getSelfReviewChallengeDecision({
            stone: '1.vision',
            slug: 'lane-a',
            route: scene.route,
            into,
          });
          expect(result.decision).toEqual('allowed');
        },
      );
    });
  });

  /**
   * 🔴 .what = a promise arrives with NO ask on record — the state a rewind leaves behind
   * .why = the rewind archives every `.since`/`.uptil` for a stone in one move, and the
   *        natural next act of a driver who holds the slug is to re-promise it. so this is
   *        reachable, never theoretical.
   *
   * 🔴 .note = the defect this clamps is a LAUNDERED ask, and it was silent in three ways
   *            at once, which is why no extant case saw it:
   *            1. the freshness bar was skipped outright — its guard read `report && …`, so
   *               a null ask made it not-fail rather than fail
   *            2. the haste cue read `askedAt: null` and went inert
   *            3. `setSelfReviewTriggeredReport` then MINTED a fresh `.since` dated now
   *            ⇒ a pre-rewind articulation read as fresh against a timestamp that postdates
   *              it — the exact defect the freshness bar exists to catch, from the other side
   */
  given('[case9] a promise with no ask on record', () => {
    const scene = useBeforeAll(async () => {
      const route = genRouteDir('unasked');

      // the articulation exists and sits at exactly the owed path. the ONLY absence is the ask
      const into = await setArticulation({
        route,
        stone: '1.vision',
        slug: 'all-done',
      });
      return { route, into };
    });

    when('[t0] the guard adjudicates it', () => {
      const verdict = useThen('the guard adjudicates the promise', async () =>
        getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.route,
          into: scene.into,
        }),
      );

      then('the verdict is challenge:unasked', () => {
        expect(verdict.decision).toEqual('challenge:unasked');
      });

      /**
       * 🔴 the sharpest operand, and the one the other assertion cannot reach: the verdict
       *    must return BEFORE any write. a `.since` on disk after an unasked promise is the
       *    laundered ask itself — and it would read as a real ask to every later gate
       */
      then('no ask was minted by the adjudication', async () => {
        const { sincePath } = getSelfReviewTriggeredPaths({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.route,
        });
        // the shared probe, never a bare `.catch(() => false)` — this assertion demands
        // ABSENCE, so a swallowed EACCES/EIO/ENOTDIR would go green for the wrong reason
        // (`rule.forbid.failhide`; `mech-failhides` blocker.1 at i017)
        expect(await isPathFound(sincePath)).toEqual(false);
      });

      then('no attempt was burned', async () => {
        const report = await getSelfReviewTriggeredReport({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.route,
        });
        expect(report).toBeNull();
      });
    });

    /**
     * .what = the state the driver reaches by the one move the emit names
     * .why = a verdict that names a next step owes a test that the step works. without it
     *        the clamp proves the refusal and leaves the recovery unproven
     */
    when('[t1] the ask is minted and the promise repeated', () => {
      then('the verdict clears', async () => {
        await setSelfReviewTriggeredReport(
          { stone: '1.vision', slug: 'all-done', route: scene.route },
          { sinceOnly: true },
        );
        await setAskMtimeTo({
          route: scene.route,
          stone: '1.vision',
          slug: 'all-done',
          agoMs: 10 * 60 * 1000,
        });

        // re-save the articulation, so it post-dates the back-dated ask
        const into = await setArticulation({
          route: scene.route,
          stone: '1.vision',
          slug: 'all-done',
        });

        const result = await getSelfReviewChallengeDecision({
          stone: '1.vision',
          slug: 'all-done',
          route: scene.route,
          into,
        });
        expect(result.decision).toEqual('allowed');
      });
    });
  });
});
