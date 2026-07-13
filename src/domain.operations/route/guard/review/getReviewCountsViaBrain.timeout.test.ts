import type { BrainChoice, ContextBrain } from 'rhachet';
import { getError, given, then, when } from 'test-fns';

import type { ContextReviewBrainSupply } from '../../genReviewBrainSupply';
import { getReviewCountsViaBrain } from './getReviewCountsViaBrain';

/**
 * .what = proves the fallback sub-brain call is time-bounded — a hung ask() fails loud, never
 *         unbounds a bounded measurement and never swallows into a fake { detected: false }.
 * .why = runOneStoneGuardReview timeboxes the reviewer subprocess; the in-process sub-brain
 *        call must inherit an equivalent bound (blueprint r11 obs #5 / r12 obs #4). this is the
 *        ONLY test that exercises the FALLBACK_BRAIN_TIMEOUT path.
 *
 * .note = this is a UNIT test (`.test.ts`): it injects a FAKE brain whose ask() never settles,
 *         via dependency injection (a test double for an error path). it crosses NO remote
 *         boundary, so it is not a mock of a real service — the real model is covered in the
 *         sibling `.integration.test.ts`. a short env-override bounds the wait to milliseconds
 *         instead of the full PT21M default.
 */

// a brain whose choice.ask() never settles — simulates a hung fallback call.
// .note = documented test-double cast: a minimal fake ContextBrain shaped for the one field
//         getReviewCountsViaBrain reads (brain.choice.ask). not a real brain (that is the point).
const genHangingBrain = (): ContextBrain<BrainChoice> =>
  ({
    brain: {
      choice: {
        ask: () => new Promise(() => {}), // never settles — the hang under test
      },
    },
  }) as unknown as ContextBrain<BrainChoice>;

const genHangingSupply = (): ContextReviewBrainSupply => ({
  getReviewBrain: async () => genHangingBrain(),
});

describe('getReviewCountsViaBrain timeout', () => {
  given('a fallback brain that hangs past the timeout bound', () => {
    const priorEnv = process.env.RHACHET_FALLBACK_BRAIN_TIMEOUT_MS;

    beforeAll(() => {
      // bound the wait to 50ms so the hang fails fast instead of a full-PT21M wait
      process.env.RHACHET_FALLBACK_BRAIN_TIMEOUT_MS = '50';
    });

    afterAll(() => {
      if (priorEnv === undefined)
        delete process.env.RHACHET_FALLBACK_BRAIN_TIMEOUT_MS;
      else process.env.RHACHET_FALLBACK_BRAIN_TIMEOUT_MS = priorEnv;
    });

    when('[t0] the tally is attempted against the hung brain', () => {
      then(
        'it throws a timeout error, never swallowed into a fake no-verdict result',
        async () => {
          // getError captures the rejection; a { detected: false } here would be a
          // rule.forbid.failhide (a hang masquerades as "no verdict" and could pass).
          const error = await getError(
            getReviewCountsViaBrain(
              { content: 'a review whose verdict is only in prose' },
              genHangingSupply(),
            ),
          );

          // it fails loud with a real Error (never settles green)
          expect(error).toBeInstanceOf(Error);

          // the timeout text may live in the wrapped cause; flatten message + cause to assert.
          // .note = read `cause` via Reflect.get (cast-free) since the ts lib target predates the
          //         typed Error.cause property.
          const cause: unknown = Reflect.get(error, 'cause');
          const causeMessage = cause instanceof Error ? cause.message : '';
          expect(`${error.message} ${causeMessage}`).toContain('timed out');
        },
      );
    });
  });
});
