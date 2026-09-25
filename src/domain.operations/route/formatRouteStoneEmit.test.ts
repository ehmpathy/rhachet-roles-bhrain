import { given, then, when } from 'test-fns';

import { formatRouteStoneEmit } from './formatRouteStoneEmit';
import { JUDGE_LEVEL } from './guard/review/peer/meter/JUDGE_LEVEL';
import { getSelfReviewArticulationPath } from './guard/review/self/getSelfReviewArticulationPath';
import { formatGuidanceForHumanOnlyCommand } from './stones/formatGuidanceForHumanOnlyCommand';

describe('formatRouteStoneEmit', () => {
  given('[case1] challenge:absent action', () => {
    const route = '.behavior/v2026_03_08.feature';
    const stone = '3.1.blueprint';
    const slug = 'design';
    const articulationPath = getSelfReviewArticulationPath({
      route,
      stone,
      slug,
    });

    /**
     * .what = the guide the real call site always supplies
     * .why = every self-review confrontation closes with the guide, the owed path, and the
     *        run command. a fixture that omits it snapshots an output no driver ever sees —
     *        a refusal that names no fix — so a reviewer reads a regression that is not there.
     */
    const selfReview = {
      reviewSelf: { slug, say: 'have you grounded the design in reality?' },
      index: 1,
      total: 3,
    };

    when('[t0] formatRouteStoneEmit called with challenge:absent', () => {
      then('output contains what have you seen header', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone,
          action: 'challenge:absent',
          slug,
          route,
          articulationPath,
          selfReview,
        });
        expect(output).toContain('🍂 what have you seen?');
      });

      then('output contains articulation path', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone,
          action: 'challenge:absent',
          slug,
          route,
          articulationPath,
          selfReview,
        });
        expect(output).toContain(articulationPath);
      });

      /**
       * .note = this case once asserted `🗿 patience, friend` — the absent verdict used to
       *         append the haste reproach ("the pond barely rippled") to a driver whose
       *         file was simply not there. only `challenge:rushed` carries a haste message
       *         now. the case is re-aimed at the D5 invariant rather than deleted.
       */
      then('output does NOT reproach the driver for haste', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone,
          action: 'challenge:absent',
          slug,
          route,
          articulationPath,
          selfReview,
        });
        expect(output).not.toContain('🗿 patience, friend');
        expect(output).not.toContain('what is the rush');
        expect(output).not.toContain('pond barely rippled');
      });

      then('output still names the fix — the owed path and the command', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone,
          action: 'challenge:absent',
          slug,
          route,
          articulationPath,
          selfReview,
        });
        expect(output).toContain('articulate into');
        expect(output).toContain(`--as promised --that ${slug}`);
        expect(output).toContain(`--into ${articulationPath}`);
      });

      then('snapshot matches vision', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone,
          action: 'challenge:absent',
          slug,
          route,
          articulationPath,
          selfReview,
        });
        expect(output).toMatchSnapshot();
      });
    });

    /**
     * 🔴 .what = the precondition verdict — a promise with no ask on record
     * .why = it is the one self-review verdict that takes NO guide. the guide names the owed
     *        path and the promise command, and a driver with no ask must not promise again —
     *        they must ask. so a guide here would hand them the move that just failed.
     */
    when('[t1] formatRouteStoneEmit called with challenge:unasked', () => {
      const asUnaskedEmit = (): string =>
        formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone,
          action: 'challenge:unasked',
          slug,
          route,
          articulationPath,
          selfReview,
        });

      then('output names the absent ask and both its operands', () => {
        const output = asUnaskedEmit();
        expect(output).toContain('no ask on record');
        expect(output).toContain(`stone = ${stone}`);
        expect(output).toContain(`slug  = ${slug}`);
      });

      /**
       * 🔴 the operand that a per-formatter test cannot reach: the WIRE. a verdict added to
       *    the union but left out of this dispatch falls through to the generic tail, and
       *    the driver reads a message about a path when their defect is an absent ask.
       */
      then('output takes NO self-review guide', () => {
        const output = asUnaskedEmit();
        expect(output).not.toContain('articulate into');
        expect(output).not.toContain(`--as promised --that ${slug}`);
      });

      then('output names the ask command instead', () => {
        const output = asUnaskedEmit();
        expect(output).toContain(
          `rhx route.stone.set --stone ${stone} --as passed`,
        );
      });

      then('output reproaches no haste and names no wrong path', () => {
        const output = asUnaskedEmit();
        expect(output).not.toContain('🗿 patience, friend');
        expect(output).not.toContain('pond barely rippled');
        expect(output).not.toContain('it is owed at');
      });

      then('snapshot matches vision', () => {
        expect(asUnaskedEmit()).toMatchSnapshot();
      });
    });
  });

  given('[case2] unguarded stone, passage allowed', () => {
    when('[t0] format is called', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '1.vision',
        action: 'passed',
        passage: 'allowed',
        note: 'unguarded',
      });

      then('output contains reminder text', () => {
        expect(output).toContain('the way continues, run');
      });

      then('output contains route.drive command', () => {
        expect(output).toContain('rhx route.drive');
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case3] unguarded stone, passage blocked', () => {
    when('[t0] format is called', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '1.vision',
        action: 'passed',
        passage: 'blocked',
        reason: 'blockers exceed threshold',
      });

      then('output does NOT contain reminder', () => {
        expect(output).not.toContain('the way continues');
        expect(output).not.toContain('rhx route.drive');
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case4] guarded stone, passage allowed', () => {
    when('[t0] format is called', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '3.blueprint',
        action: 'passed',
        passage: 'allowed',
        guard: {
          artifactFiles: ['3.blueprint.md'],
          reviews: [
            {
              index: 1,
              cmd: 'review cmd',
              cached: false,
              durationSec: 1.5,
              blockers: 0,
              nitpicks: 0,
              path: 'review.md',
              exitClass: 'passed',
              tallier: 'deterministic',
            },
          ],
          judges: [
            {
              index: 1,
              cmd: 'judge cmd',
              cached: false,
              durationSec: 0.5,
              passed: true,
              reason: null,
              path: 'judge.md',
            },
          ],
        },
      });

      then('output contains reminder text', () => {
        expect(output).toContain('the way continues, run');
      });

      then('output contains route.drive command', () => {
        expect(output).toContain('rhx route.drive');
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case5] guarded stone, passage blocked', () => {
    when('[t0] format is called', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '3.blueprint',
        action: 'passed',
        passage: 'blocked',
        reason: 'blockers exceed threshold',
        guard: {
          artifactFiles: ['3.blueprint.md'],
          reviews: [
            {
              index: 1,
              cmd: 'review cmd',
              cached: false,
              durationSec: 1.5,
              blockers: 3,
              nitpicks: 1,
              path: 'review.md',
              exitClass: 'passed',
              tallier: 'deterministic',
            },
          ],
          judges: [
            {
              index: 1,
              cmd: 'judge cmd',
              cached: false,
              durationSec: 0.5,
              passed: false,
              reason: 'blockers exceed threshold',
              path: 'judge.md',
            },
          ],
        },
      });

      then('output does NOT contain reminder', () => {
        expect(output).not.toContain('the way continues');
        expect(output).not.toContain('rhx route.drive');
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given(
    '[case5b] guarded stone, a review tallied by the sub-brain fallback',
    () => {
      when('[t0] format is called with a probabilistic review', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: '3.blueprint',
          action: 'passed',
          passage: 'allowed',
          guard: {
            artifactFiles: ['3.blueprint.md'],
            reviews: [
              {
                index: 1,
                cmd: 'review cmd',
                cached: false,
                durationSec: 1.5,
                blockers: 0,
                nitpicks: 1,
                path: 'review.md',
                exitClass: 'passed',
                tallier: 'probabilistic',
              },
            ],
            judges: [
              {
                index: 1,
                cmd: 'judge cmd',
                cached: false,
                durationSec: 0.5,
                passed: true,
                reason: null,
                path: 'judge.md',
              },
            ],
          },
        });

        then('output shows the tallied-by branch on the pass path', () => {
          expect(output).toContain('tallied by reviewer@');
        });

        then('snapshot matches', () => {
          expect(output).toMatchSnapshot();
        });
      });
    },
  );

  given('[case6] blocked action (agent tried to approve)', () => {
    when('[t0] format is called with blocked action', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '1.vision',
        action: 'blocked',
        reason: 'only humans can approve',
        // 🔴 the REAL guidance, never a fixture copy of it — an inline copy here was a
        //    fourth twin of one list, and it would read as a pin on content it no longer
        //    matched (rule.require.single-source-of-truth-for-render)
        guidance: formatGuidanceForHumanOnlyCommand({ humanGrant: 'approved' }),
      });

      then('output contains owl header', () => {
        expect(output).toContain('🦉 the way speaks for itself');
      });

      then('output contains driver guidance', () => {
        expect(output).toContain('as a driver, you should:');
      });

      then('output names every signal a driver can send', () => {
        expect(output).toContain('--as passed');
        expect(output).toContain('--as arrived');
        expect(output).toContain('--as conceded');
        expect(output).toContain('--as disputed');
        expect(output).toContain('--as blocked');
      });

      then(
        'and it qualifies the wall, so no unanswered exit is offered',
        () => {
          // rule.forbid.unanswered-exits-from-a-blocker: the bare `to escalate if stuck`
          // this replaced pointed a driver at the one exit that rule forbids
          expect(output).toContain('not a wall');
          expect(output).not.toContain('to escalate if stuck');
        },
      );

      then('output contains human note', () => {
        expect(output).toContain(
          'the human will run `--as approved` when ready.',
        );
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case7] route.stone.add plan mode', () => {
    when('[t0] format is called with plan mode', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.add',
        mode: 'plan',
        stone: '3.1.6.research.custom',
        route: '.behavior/v2026_04_12.myroute',
        source: '@stdin',
        content:
          'investigate X:\n- what is X?\n- how does X relate to our wish?',
        path: '.behavior/v2026_04_12.myroute/3.1.6.research.custom.stone',
      });

      then('output contains owl header', () => {
        expect(output).toContain('🦉 another stone on the path');
      });

      then('output contains stone name', () => {
        expect(output).toContain('stone  = 3.1.6.research.custom');
      });

      then('output contains route', () => {
        expect(output).toContain('route  = .behavior/v2026_04_12.myroute');
      });

      then('output contains source', () => {
        expect(output).toContain('source = @stdin');
      });

      then('output contains preview with content', () => {
        expect(output).toContain('preview');
        expect(output).toContain('investigate X:');
      });

      then('output indicates no creation in plan mode', () => {
        expect(output).toContain('✋ created = false');
      });

      then('output contains rerun hint', () => {
        expect(output).toContain('rerun with --mode apply to execute');
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case8] route.stone.add apply mode', () => {
    when('[t0] format is called with apply mode', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.add',
        mode: 'apply',
        stone: '3.1.6.research.custom',
        route: '.behavior/v2026_04_12.myroute',
        source: '@stdin',
        content:
          'investigate X:\n- what is X?\n- how does X relate to our wish?',
        path: '.behavior/v2026_04_12.myroute/3.1.6.research.custom.stone',
      });

      then('output contains owl header', () => {
        expect(output).toContain('🦉 another stone on the path');
      });

      then('output contains created path', () => {
        expect(output).toContain(
          'created = .behavior/v2026_04_12.myroute/3.1.6.research.custom.stone',
        );
      });

      then('output contains reminder to drive', () => {
        expect(output).toContain('the way continues, run');
        expect(output).toContain('rhx route.drive');
      });

      then('output does not contain preview', () => {
        expect(output).not.toContain('preview');
        expect(output).not.toContain('source =');
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case-overrule-scoped] a level-scoped overrule', () => {
    when('[t0] format is called with a level and a ready-next level', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '1.plan',
        action: 'overruled',
        level: 1,
        readyLevel: 3,
      });

      then('it names the waved level and the newly-ready level', () => {
        expect(output).toContain('level 1, overruled');
        expect(output).toContain('level 3, ready');
      });

      then(
        'it carries NO stone-wide full-forgive alert (this is the safe, scoped case)',
        () => {
          expect(output).not.toContain('stone-wide');
        },
      );

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case-overrule-judge] an overrule of the judge rung', () => {
    when('[t0] format is called with level = JUDGE_LEVEL', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '1.plan',
        action: 'overruled',
        level: JUDGE_LEVEL,
      });

      then('it renders the judge rung, not the sentinel number', () => {
        // .why = the judge is the top rung; the human sees "judge, overruled", never the raw
        //        JUDGE_LEVEL sentinel value (define.review.human-forgiveness)
        expect(output).toContain('judge, overruled');
        expect(output).not.toContain(String(JUDGE_LEVEL));
      });

      then('it carries NO stone-wide full-forgive alert', () => {
        expect(output).not.toContain('stone-wide');
      });

      then('snapshot matches', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given(
    '[case-overrule-peer-judge-ready] an overrule of a peer level where the JUDGE becomes ready',
    () => {
      when('[t0] format is called with readyLevel = JUDGE_LEVEL', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: '1.plan',
          action: 'overruled',
          level: 3,
          readyLevel: JUDGE_LEVEL,
        });

        then(
          'the ready line reads "judge, ready", never the sentinel number',
          () => {
            // .why = an overrule of the topmost peer level makes the JUDGE the next live gate; the
            //        readyLevel render must honor the same JUDGE_LEVEL guard as the rung line,
            //        or a human sees "level 9007199254740991, ready" (the paired sentinel-leak bug)
            expect(output).toContain('level 3, overruled');
            expect(output).toContain('judge, ready');
            expect(output).not.toContain(String(JUDGE_LEVEL));
          },
        );

        then('snapshot matches', () => {
          expect(output).toMatchSnapshot();
        });
      });
    },
  );

  /**
   * 🔴 .why = `formatHashbarRetired` shipped written, tested, and with NO production caller —
   *           dead code that a reviewer reads as a delivered feature. its own unit tests could
   *           not catch that: they prove the message RENDERS, never that it is REACHABLE.
   * .note = so this case asserts the WIRE, and it belongs here rather than beside the
   *         formatter. the seam between a correct operation and an emit that never calls it
   *         is the one a per-operation test cannot see.
   */
  given(
    '[case-hashbar] a guard whose review.self still sets the retired key',
    () => {
      const selfReview = {
        reviewSelf: {
          slug: 'all-done',
          say: 'have you grounded it?',
          hashbar: 0,
        },
        route: '.behavior/v2026_03_08.feature',
        index: 1,
        total: 1,
      };

      when('[t0] the ask is emitted and the key is present', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: '1.vision',
          action: 'passed',
          passage: 'blocked',
          selfReview,
          hashbarFound: [{ stone: '1.vision', slug: 'all-done' }],
        });

        then('the retirement notice reaches the author', () => {
          expect(output).toContain('hashbar is retired');
          expect(output).toContain('found in 1.vision → review.self.all-done');
          expect(output).toContain('safe to delete the key');
        });

        /**
         * .why = the notice is a rider, never a replacement. an author who still gets the key
         *        wrong must not also lose the ask they came for.
         */
        then('the ask it rides is intact', () => {
          expect(output).toContain('lets reflect');
          expect(output).toContain('--as promised --that all-done');
        });
      });

      when('[t1] the key is absent — every guard in this repo', () => {
        const output = formatRouteStoneEmit({
          operation: 'route.stone.set',
          stone: '1.vision',
          action: 'passed',
          passage: 'blocked',
          selfReview: {
            ...selfReview,
            reviewSelf: { slug: 'all-done', say: 'x' },
          },
        });

        then('no retirement line is rendered, so it costs naught', () => {
          expect(output).not.toContain('hashbar');
        });
      });
    },
  );

  /**
   * 🔴 .why = the SERIAL CONTRACT, clamped at the one surface that could break it. the route
   *           is sealed — a driver cannot read the `.guard` file — so this emit is the only
   *           place the other slugs could ever be named. ⇒ while it names exactly one, slug
   *           N+1 is reachable only once slug N is promised, and the contract holds BY
   *           CONSTRUCTION rather than by a refusal branch somebody must remember to write.
   *
   * 🟡 .why it is a clamp and not a comment = this emit carried a roster of every other
   *           unpromised slug until the fork was withdrawn. that roster invited a fork the
   *           guide layer could not serve: a forked lane got a slug and a path and no GUIDE,
   *           because the guide renders only for the slug in hand and no read-only retrieval
   *           command exists. ⇒ a re-add would look like a feature and would restore the
   *           defect, so the absence is asserted rather than assumed.
   */
  given('[case-serial] a stone with several unpromised self reviews', () => {
    const selfReview = {
      reviewSelf: { slug: 'has-pruned-yagni', say: 'any extras?' },
      route: '.behavior/v2026_03_08.feature',
      index: 1,
      total: 3,
    };

    when('[t0] the ask is emitted while two other reviews remain', () => {
      const output = formatRouteStoneEmit({
        operation: 'route.stone.set',
        stone: '5.1.execute',
        action: 'passed',
        passage: 'blocked',
        selfReview,
      });

      /**
       * 🔴 .why the NEGATIVE bar holds the weight = the positive bars below would all still
       *        pass with a roster beside them. only this one goes red on a re-add.
       */
      then(
        'no other slug is named, so the hand-out stays one at a time',
        () => {
          expect(output).not.toContain('has-questioned-assumptions');
          expect(output).not.toContain('has-verified-claims');
          expect(output).not.toContain('the other lanes');
          expect(output).not.toContain('you may fork');
        },
      );

      then('the one review in hand is named, with its guide', () => {
        expect(output).toContain('lets reflect');
        expect(output).toContain('has-pruned-yagni');
        expect(output).toContain('any extras?');
      });

      /**
       * .why = the count still says THREE. the driver is told how many they owe; they are
       *        not told the names, and those are different facts. a serial hand-out that hid
       *        the total would leave them unable to tell a long ladder from a short one.
       */
      then(
        'the total is still disclosed, so the ladder is not a surprise',
        () => {
          expect(output).toContain('1/3');
        },
      );

      then('the promise command names that one slug', () => {
        expect(output).toContain('--as promised --that has-pruned-yagni');
      });
    });
  });
});
