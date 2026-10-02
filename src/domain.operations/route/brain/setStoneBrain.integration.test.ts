import { given, then, useBeforeAll, when } from 'test-fns';

import {
  RouteStoneGuard,
  RouteStoneGuardReviewPeer,
} from '@src/domain.objects/Driver/RouteStoneGuard';

import { STONE_BRAIN_HALT_CAUSES } from './formatStoneBrainUndispatched';
import { type StoneBrainHaltCause, setStoneBrain } from './setStoneBrain';

/**
 * .what = builds a guard with only the fields this operation reads
 * .why = the other fields stay empty, so none implies this operation reads it
 *
 * .note = peers default to none; the `requested` arm reports them for case=9 [t4]
 */
const genGuard = (input: {
  brain?: string;
  effort?: string;
  peers?: { slug: string; run: string }[];
}): RouteStoneGuard =>
  new RouteStoneGuard({
    path: '/tmp/x.guard',
    artifacts: [],
    reviews: {
      self: [],
      peer: (input.peers ?? []).map(
        (peer) =>
          new RouteStoneGuardReviewPeer({
            slug: peer.slug,
            run: peer.run,
            budget: 3,
          }),
      ),
    },
    judges: [],
    protect: [],
    // .note = the key is ABSENT where neither axis was asked for, which is the shape the
    //         parser yields for a guard with no `brain:` at all. a `{ choice: null,
    //         effort: null }` would be a shape `finalizeBrain` never commits
    brain:
      input.brain === undefined && input.effort === undefined
        ? undefined
        : { choice: input.brain ?? null, effort: input.effort ?? null },
  });

describe('setStoneBrain', () => {
  given('[case1] a stone with NO guard at all', () => {
    when('[t0] the brain is applied', () => {
      const outcome = useBeforeAll(async () =>
        setStoneBrain({ guard: null, route: '.' }),
      );

      then('naught is dispatched', () => {
        expect(outcome).toEqual({ outcome: 'none' });
      });
    });
  });

  given('[case2] a guard that declares no brain', () => {
    when('[t0] the brain is applied', () => {
      const outcome = useBeforeAll(async () =>
        setStoneBrain({ guard: genGuard({}), route: '.' }),
      );

      then('naught is dispatched', () => {
        // .why = this is the branch EVERY extant guard in every repo takes, so it must
        //        return before the clone is probed and before the repo root is looked
        //        up — no subprocess, no output, no turn
        expect(outcome).toEqual({ outcome: 'none' });
      });
    });
  });

  given('[case3] a guard whose brain is an empty string', () => {
    when('[t0] the brain is applied', () => {
      const outcome = useBeforeAll(async () =>
        setStoneBrain({ guard: genGuard({ brain: '' }), route: '.' }),
      );

      then('naught is dispatched', () => {
        // .why = the parser already refuses to set an empty brain, so this is the
        //        SECOND guard on the same hazard: an empty value would otherwise
        //        dispatch `/model ` — a blank argument — into the live clone
        expect(outcome).toEqual({ outcome: 'none' });
      });
    });
  });

  given('[case4] a guard that declares a brain, and NO clone address', () => {
    // .why = case=2's precondition: a driver launched directly, never by `rhx enroll`,
    //        which is today's common case rather than an edge
    //
    // .note = the address reader is INJECTED: jest inherits the driver's
    //         RHACHET_CLONE_SERIAL, so the real reader would dispatch a REAL `/model`
    //         into the developer's live session
    when('[t0] the brain is applied', () => {
      const outcome = useBeforeAll(async () =>
        setStoneBrain(
          {
            guard: genGuard({ brain: 'claude-opus-5[1m]' }),
            route: '.',
          },
          { getAddress: async () => ({ address: null, cause: 'unenrolled' }) },
        ),
      );

      then('it reports UNDISPATCHED, never a quiet none', () => {
        // .why = the wish's bound is "fail loud, never a silent no-op, if the driver
        //        clone is unreachable". a `none` here would make a stone that ASKED
        //        for a brain read exactly like a stone that never asked — the one
        //        conflation case=8 [t2] forbids the record to make
        expect(outcome).toEqual({
          outcome: 'undispatched',
          brain: 'claude-opus-5[1m]',
          effort: null,
          guard: '/tmp/x.guard',
          cause: 'unenrolled',
        });
      });

      then('it carries the CAUSE, so the halt can name the right fix', () => {
        // .why = four conditions share one `null`; only the cause makes the halt's remedy
        //          correct rather than plausible (rule.require.errors-name-the-fix)
        expect(outcome).toHaveProperty('cause', 'unenrolled');
      });

      then('it carries the declared brain, so the halt can name it', () => {
        // .why = case=2 [t2] requires the message to state what was prescribed. an
        //        outcome that reported only the failure would force the caller to
        //        re-read the guard to render its own error
        expect(outcome).toHaveProperty('brain', 'claude-opus-5[1m]');
      });

      then(
        'it carries the guard PATH, so the halt can name what to edit',
        () => {
          // .why = case=2 [t2]'s fix names the guard path, known only where a brain was
          //        declared; it rides the outcome so the caller never re-derives it
          expect(outcome).toHaveProperty('guard', '/tmp/x.guard');
        },
      );
    });
  });

  given(
    '[case5] a guard that declares a brain, and a CONFIRMED address',
    () => {
      // .why = the feature's whole happy path, and case=5's critipath. it is reachable
      //        only through both seams: `getAddress` to confirm an address without a
      //        live clone, and `dispatch` to capture the submit without a real spawn
      when('[t0] the brain is applied', () => {
        const dispatched: {
          rhx: string;
          repoRoot: string;
          address: string;
          brain: string | null;
          effort: string | null;
        }[] = [];

        const outcome = useBeforeAll(async () =>
          setStoneBrain(
            {
              guard: genGuard({ brain: 'claude-sonnet-5[1m]' }),
              route: '.',
            },
            {
              getAddress: async () => ({ address: 'driver' }),
              // 🟡 SYNCHRONOUS on purpose: a plain return makes an await of the child's
              //    delivery a type error (`case=5`; see `dispatchBrainSwitch`'s header)
              dispatch: (submit) => {
                dispatched.push(submit);
                return { submitted: true };
              },
            },
          ),
        );

        then('it reports REQUESTED', () => {
          expect(outcome).toEqual({
            outcome: 'requested',
            brain: 'claude-sonnet-5[1m]',
            effort: null,
            guard: '/tmp/x.guard',
            reviewers: [],
          });
        });

        then('it dispatches EXACTLY ONE switch', () => {
          // .why = the applier is CONVERGENT (F14) — one unconditional dispatch per
          //        boundary, never a compare then maybe a dispatch. a second submit
          //        would mean a retry or a re-entry crept in
          expect(dispatched).toHaveLength(1);
        });

        then('it addresses the clone `whoami` confirmed, and no other', () => {
          // .why = the wish's "a switch applied to the wrong clone" is what the whoami
          //        step exists to prevent. this asserts the address flows from the
          //        confirmation through to the submit unchanged (case=1)
          expect(dispatched[0]?.address).toEqual('driver');
        });

        then(
          'it submits the declared brain VERBATIM, as a /model argument',
          () => {
            // .why = the F10 verdict: the value is the brain-cli's own `/model` argument,
            //        passed through unchanged rather than mapped from a rhachet brainslug.
            //        `claude-sonnet-5[1m]` carries brackets that any map would mangle, so
            //        an equality assert here is what proves the passthrough
            expect(dispatched[0]?.brain).toEqual('claude-sonnet-5[1m]');
          },
        );

        then(
          'it anchors rhx at the repo root, never at the inherited cwd',
          () => {
            // .why = rule.forbid.cwd-outside-gitroot. a relative './node_modules/...'
            //        resolves against whatever cwd the hook inherited, so a driver invoked
            //        from a subdirectory would get a spawn error — which this operation
            //        converts to a SILENT no-op, the exact failhide the wish's bound forbids
            expect(dispatched[0]?.rhx).toContain('node_modules');
            expect(dispatched[0]?.rhx.endsWith('rhx')).toEqual(true);
            expect(dispatched[0]?.rhx.startsWith('/')).toEqual(true);
          },
        );
      });
    },
  );

  given('[case5b] a guard that ALSO declares peer reviewers', () => {
    // .why = case=9 [t4] renders both scopes, so the reviewers must reach the OUTCOME
    //        rather than make the caller re-read the guard
    when('[t0] the brain is applied', () => {
      const outcome = useBeforeAll(async () =>
        setStoneBrain(
          {
            guard: genGuard({
              brain: 'claude-opus-5[1m]',
              peers: [
                {
                  slug: 'primo',
                  run: `rhx review --brain opus --diffs since-main`,
                },
                { slug: 'repo-rules', run: `rhx review --diffs since-main` },
                {
                  slug: 'obscured',
                  run: `rhx review --brain $(cat .brain) --diffs since-main`,
                },
              ],
            }),
            route: '.',
          },
          {
            getAddress: async () => ({ address: 'driver' }),
            dispatch: () => ({ submitted: true }),
          },
        ),
      );

      then(
        'each reviewer rides the outcome, with the brain its run declared',
        () => {
          expect(outcome).toEqual({
            outcome: 'requested',
            brain: 'claude-opus-5[1m]',
            effort: null,
            guard: '/tmp/x.guard',
            reviewers: [
              { slug: 'primo', brain: 'opus' },
              { slug: 'repo-rules', brain: null, cause: 'undeclared' },
              { slug: 'obscured', brain: null, cause: 'unreadable' },
            ],
          });
        },
      );

      then('a reviewer that declared none carries null, never a guess', () => {
        // .why = `undeclared` means NO BRAIN APPLIES, so the render prints the tool's own
        //        default rather than a slug this repo would have to invent. an outcome that
        //        defaulted here would put a wrong slug on the record, which is worse
        //        than an absent one (rule.forbid.failhide)
        expect(outcome).toHaveProperty('reviewers.1.brain', null);
        expect(outcome).toHaveProperty('reviewers.1.cause', 'undeclared');
      });

      then(
        'a reviewer whose declaration cannot be READ carries a cause',
        () => {
          // .why = both carry `brain: null`, yet `--brain $(cat .brain)` resolves to a REAL
          //        brain at run time; the CAUSE parts them, so it must reach the outcome
          expect(outcome).toHaveProperty('reviewers.2.brain', null);
          expect(outcome).toHaveProperty('reviewers.2.cause', 'unreadable');
        },
      );

      then('the driver brain is untouched by the reviewer brains', () => {
        // .why = F12's bound, asserted rather than assumed. `brain:` bounds the DRIVER;
        //        `--brain` bounds each reviewer, and neither reads the other
        expect(outcome).toHaveProperty('brain', 'claude-opus-5[1m]');
      });
    });
  });

  given(
    '[case6] a CONFIRMED address, and the dispatch child never launched',
    () => {
      // .why = a failed spawn must not read `requested`, which would claim a switch that
      //        never landed (`rule.forbid.failhide`)
      // .note = the cause is an absent `node_modules/.bin/rhx`; `child.pid` is undefined
      //         on a failed spawn, so this asserts with no await (case=5)
      when('[t0] the brain is applied', () => {
        const outcome = useBeforeAll(async () =>
          setStoneBrain(
            { guard: genGuard({ brain: 'claude-opus-5[1m]' }), route: '.' },
            {
              getAddress: async () => ({ address: 'driver' }),
              dispatch: () => ({ submitted: false }),
            },
          ),
        );

        then('it reports UNDISPATCHED, never requested', () => {
          expect(outcome).toEqual({
            outcome: 'undispatched',
            brain: 'claude-opus-5[1m]',
            effort: null,
            guard: '/tmp/x.guard',
            cause: 'spawn-failed',
          });
        });

        then('its cause parts it from an unreachable clone', () => {
          // .why = an address WAS confirmed here, so `unenrolled` would be false and its
          //        `rhx enroll` remedy would repair naught. the cause is what earns this
          //        arm its own fix
          expect(outcome).toHaveProperty('cause', 'spawn-failed');
        });

        then('the outcome TAG and the cause are two different words', () => {
          // .why = outcome and cause are two vocabularies; a cause of `undispatched`
          //        would fuse them (`rule.forbid.domain-term-ambiguity`)
          expect(outcome).toHaveProperty('outcome', 'undispatched');
          expect(outcome).not.toHaveProperty('cause', 'undispatched');
        });
      });
    },
  );

  given(
    '[case7] the address reader reports a cause other than unenrolled',
    () => {
      // .why = each cause names a DIFFERENT fix, so each must reach the outcome unchanged
      //
      // .note = the list is DERIVED from `STONE_BRAIN_HALT_CAUSES`, a
      //         `Record<StoneBrainHaltCause, …>` the compiler keeps complete, so a new
      //         cause enters this walk with no edit
      // .note = two exclusions, each pinned by its own case:
      //      - `unenrolled` — [case2], halt plus its `rhx enroll` fix
      //      - `spawn-failed` — [case6], a failed spawn this `getAddress` stub cannot drive
      const COVERED_BY_A_CASE_OF_ITS_OWN: StoneBrainHaltCause[] = [
        'unenrolled',
        'spawn-failed',
      ];
      const CAUSES = STONE_BRAIN_HALT_CAUSES.filter(
        (cause) => !COVERED_BY_A_CASE_OF_ITS_OWN.includes(cause),
      );

      CAUSES.forEach((cause) => {
        when(`[t0] the brain is applied, with cause=${cause}`, () => {
          const outcome = useBeforeAll(async () =>
            setStoneBrain(
              { guard: genGuard({ brain: 'claude-opus-5[1m]' }), route: '.' },
              { getAddress: async () => ({ address: null, cause }) },
            ),
          );

          then('the cause rides through to the outcome, unchanged', () => {
            expect(outcome).toEqual({
              outcome: 'undispatched',
              brain: 'claude-opus-5[1m]',
              effort: null,
              guard: '/tmp/x.guard',
              cause,
            });
          });
        });
      });
    },
  );

  /**
   * .what = the three DECLARED variants, at the dispatch boundary
   * .why = the parser suite proves each PARSES; this proves each reaches the wire, where
   *        `/model` and `/effort` are two separate commands
   *
   * .note = variant 3 (effort, no choice) is the one arm that dispatches NO `/model` say
   */

  given('[case8] each declared variant, on its way to the wire', () => {
    const genDispatchScene = (guard: RouteStoneGuard) => {
      const dispatched: {
        rhx: string;
        repoRoot: string;
        address: string;
        brain: string | null;
        effort: string | null;
      }[] = [];
      return {
        dispatched,
        run: async () =>
          setStoneBrain(
            { guard, route: '.' },
            {
              getAddress: async () => ({ address: 'driver' }),
              dispatch: (submit) => {
                dispatched.push(submit);
                return { submitted: true };
              },
            },
          ),
      };
    };

    when('[t0] the guard declares a CHOICE alone', () => {
      const scene = genDispatchScene(genGuard({ brain: 'opus[1m]' }));
      const outcome = useBeforeAll(async () => scene.run());

      then('both axes ride the outcome, and effort is null', () => {
        expect(outcome).toHaveProperty('brain', 'opus[1m]');
        expect(outcome).toHaveProperty('effort', null);
      });

      then('the submit carries the choice and a null effort', () => {
        // .why = the null is what tells `dispatchBrainSwitch` to send no `/effort` say.
        //        an omitted key and an explicit null read alike to a caller, so the
        //        assert is on the VALUE rather than on the key's presence
        expect(scene.dispatched).toHaveLength(1);
        expect(scene.dispatched[0]?.brain).toEqual('opus[1m]');
        expect(scene.dispatched[0]?.effort).toEqual(null);
      });
    });

    when('[t1] the guard declares BOTH axes', () => {
      const scene = genDispatchScene(
        genGuard({ brain: 'opus[1m]', effort: 'medium' }),
      );
      const outcome = useBeforeAll(async () => scene.run());

      then('both axes ride the outcome', () => {
        expect(outcome).toHaveProperty('brain', 'opus[1m]');
        expect(outcome).toHaveProperty('effort', 'medium');
      });

      then('ONE submit carries both, never two submits', () => {
        // 🔴 .why = the fan-out into two `/model` + `/effort` says lives BELOW this seam,
        //          in `dispatchBrainSwitch`. a second submit here would mean the fan-out
        //          leaked upward — and then the order of the two says would be decided
        //          by two processes rather than one (F29)
        expect(scene.dispatched).toHaveLength(1);
        expect(scene.dispatched[0]?.brain).toEqual('opus[1m]');
        expect(scene.dispatched[0]?.effort).toEqual('medium');
      });
    });

    when('[t2] the guard declares an EFFORT alone', () => {
      const scene = genDispatchScene(genGuard({ effort: 'medium' }));
      const outcome = useBeforeAll(async () => scene.run());

      then('it reports REQUESTED, with a null brain', () => {
        // 🔴 .why = "if they want to change effort but not choice, then they still
        //           explode it but omit the choice" — the wisher, verbatim. so a null
        //           choice past a declared key is the CONTRACT, never a defect state,
        //           and `requested` is the honest verdict: a say was sent
        expect(outcome).toHaveProperty('outcome', 'requested');
        expect(outcome).toHaveProperty('brain', null);
        expect(outcome).toHaveProperty('effort', 'medium');
      });

      then('the submit carries the effort and a null brain', () => {
        expect(scene.dispatched).toHaveLength(1);
        expect(scene.dispatched[0]?.brain).toEqual(null);
        expect(scene.dispatched[0]?.effort).toEqual('medium');
      });
    });

    when('[t3] the guard declares a key with NEITHER axis set', () => {
      const scene = genDispatchScene(
        new RouteStoneGuard({
          path: '/tmp/x.guard',
          artifacts: [],
          reviews: { self: [], peer: [] },
          judges: [],
          protect: [],
          brain: { choice: null, effort: null },
        }),
      );
      const outcome = useBeforeAll(async () => scene.run());

      then('it reports NONE, and dispatches naught', () => {
        // 🔴 .why = the failhide clamp. `Boolean(guard.brain)` is TRUE for this shape, so
        //          a presence test would report `requested` past a dispatch that sent no
        //          say at all — a verdict that claims an act nobody performed
        //          (`rule.forbid.failhide`). the gate tests the UNION of the axes instead
        expect(outcome).toEqual({ outcome: 'none' });
        expect(scene.dispatched).toEqual([]);
      });
    });
  });
});
