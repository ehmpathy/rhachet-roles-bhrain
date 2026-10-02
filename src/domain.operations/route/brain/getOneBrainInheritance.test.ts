import { given, then, useBeforeAll, when } from 'test-fns';

import type { getDriveBlockerState } from '../drive/getDriveBlockerState';
import { getOneBrainInheritance } from './getOneBrainInheritance';

/**
 * .what = a `getState` stand-in that records whether it was called at all
 * .why = the widest guarantee in this feature is that case=10 does **no I/O**, and a test
 *        that only checked the RETURN would pass on an implementation that read first and
 *        discarded the answer. the call COUNT is the observation
 *        (`rule.require.clamp-edge-cases`)
 */
const genFakeGetState = (input: {
  brain: { slug: string; stone: string } | null;
}): { getState: typeof getDriveBlockerState; calls: () => number } => {
  let calls = 0;
  const getState = (async () => {
    calls += 1;
    return { count: 0, stone: null, brain: input.brain };
  }) as unknown as typeof getDriveBlockerState;
  return { getState, calls: () => calls };
};

describe('getOneBrainInheritance', () => {
  given('[case1] a route that NEVER opted in — vision case=10', () => {
    /**
     * .why = case=10's blast radius is every route that never opted in, so the route gate
     *        runs before any I/O
     *
     * ✅ .teeth = move the gate below `getState` and only `[t0]`'s call count goes red: the
     *   defect is a COST, which a return-value assert cannot see
     */
    when('[t0] a brainless stone is reached', () => {
      const scene = useBeforeAll(async () => {
        const fake = genFakeGetState({ brain: { slug: 'opus', stone: '1.x' } });
        const outcome = await getOneBrainInheritance(
          { route: '.behavior/never-opted-in', routeDeclaresBrain: false },
          { getState: fake.getState },
        );
        return { outcome, calls: fake.calls() };
      });

      then('it renders silence', () => {
        expect(scene.outcome).toEqual({ outcome: 'none' });
      });

      then('🔴 it performed NO read — the guarantee, not the answer', () => {
        // 🟡 the fake HOLDS an inheritable brain. so a read would have returned `inherited`,
        //    and the row above would go red rather than green — which is what makes this
        //    count assert the guarantee rather than restate its outcome
        expect(scene.calls).toEqual(0);
      });
    });
  });

  given('[case2] an opted-in route with a prior dispatch — case=7', () => {
    when('[t0] a brainless stone is reached', () => {
      const outcome = useBeforeAll(async () =>
        getOneBrainInheritance(
          { route: '.behavior/opted-in', routeDeclaresBrain: true },
          {
            getState: genFakeGetState({
              brain: { slug: 'claude-opus-4-6', stone: '3.blueprint' },
            }).getState,
          },
        ),
      );

      then('it attributes the brain to the stone that SET it', () => {
        // .why = keyed to the stone now read, it would name a stone that dispatched naught
        expect(outcome).toEqual({
          outcome: 'inherited',
          brain: 'claude-opus-4-6',
          stone: '3.blueprint',
        });
      });

      then('the brain slug is carried VERBATIM, never normalized', () => {
        // 🟡 the `F10` ruling: the value is the brain-cli's own `/model` argument, passed
        //    through unchanged. a normalizer here would speak rhachet's brainslug vocabulary
        //    at a surface that declared the cli's
        expect(
          (outcome as { outcome: 'inherited'; brain: string }).brain,
        ).toEqual('claude-opus-4-6');
      });
    });
  });

  given('[case3] an opted-in route where every switch HALTED', () => {
    /**
     * 🟡 .why absence returns `none` rather than a line = to render an attribution here
     *    would name a brain nobody submitted — the failhide shape one arm over, and the
     *    reason the record is written on the `requested` arm alone
     */
    when('[t0] a brainless stone is reached', () => {
      const scene = useBeforeAll(async () => {
        const fake = genFakeGetState({ brain: null });
        const outcome = await getOneBrainInheritance(
          { route: '.behavior/opted-in', routeDeclaresBrain: true },
          { getState: fake.getState },
        );
        return { outcome, calls: fake.calls() };
      });

      then('it renders silence rather than an unfounded attribution', () => {
        expect(scene.outcome).toEqual({ outcome: 'none' });
      });

      then('🟡 and it DID read — which is what parts this from case=10', () => {
        // ✅ the two silences are byte-identical to a driver and differ in cost. this row
        //    and `[case1] [t0]`'s second row pin both directions of that seam
        expect(scene.calls).toEqual(1);
      });
    });
  });
});
