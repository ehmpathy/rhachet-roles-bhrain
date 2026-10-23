import { BadRequestError } from 'helpful-errors';
import type { BrainChoice, ContextBrain } from 'rhachet';
import { getError, given, then, when } from 'test-fns';

import type { ContextReviewBrainSupply } from '@src/domain.operations/brain/genReviewBrainSupply'; // brain/ is a declared shared subdomain (its .readme.md)

import {
  getOneReviewCountsViaBrain,
  ReviewTallyError,
} from './getOneReviewCountsViaBrain';

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
//         getOneReviewCountsViaBrain reads (brain.choice.ask). not a real brain (that is the point).
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

describe('getOneReviewCountsViaBrain.timeout', () => {
  given('[case1] a fallback brain that hangs past the timeout bound', () => {
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
            getOneReviewCountsViaBrain(
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

  // 🔴 i014 r006 nitpick.2 — the ask moved out of an inline closure into a named step. these
  //    two cases pin what the move must keep: a build fault still rides as the one tally error
  //    class, and an ask that answers inside the bound maps through to the tally
  given('[case2] a fallback brain whose build fails', () => {
    const genBrokenSupply = (): ContextReviewBrainSupply => ({
      getReviewBrain: async () => {
        throw new Error('keyrack locked');
      },
    });

    when('[t0] the tally is attempted', () => {
      then('the fault rides as a ReviewTallyError', async () => {
        const error = await getError(
          getOneReviewCountsViaBrain(
            { content: 'a review whose verdict is only in prose' },
            genBrokenSupply(),
          ),
        );
        expect(error).toBeInstanceOf(ReviewTallyError);
      });
    });
  });

  // 🔴 the env bound is a CALLER-must-fix input. read inside the tally-fault wrap, a typo'd
  //    override rode as a ReviewTallyError, and the seam rendered it as a generic "fallback
  //    failed" malfunction with the env var name and the declared value both hidden
  given(
    '[case4] a malformed RHACHET_FALLBACK_BRAIN_TIMEOUT_MS override',
    () => {
      const priorEnv = process.env.RHACHET_FALLBACK_BRAIN_TIMEOUT_MS;

      beforeAll(() => {
        process.env.RHACHET_FALLBACK_BRAIN_TIMEOUT_MS = 'abc';
      });

      afterAll(() => {
        if (priorEnv === undefined)
          delete process.env.RHACHET_FALLBACK_BRAIN_TIMEOUT_MS;
        else process.env.RHACHET_FALLBACK_BRAIN_TIMEOUT_MS = priorEnv;
      });

      when('[t0] the tally is attempted', () => {
        then(
          'it refuses as a constraint that names the env var, never as a tally fault',
          async () => {
            const error = await getError(
              getOneReviewCountsViaBrain(
                { content: 'a review whose verdict is only in prose' },
                {
                  // the refusal fires before any brain is built
                  getReviewBrain: async () => {
                    throw new Error('a brain was built before the env read');
                  },
                },
              ),
            );
            expect(error).toBeInstanceOf(BadRequestError);
            expect(error).not.toBeInstanceOf(ReviewTallyError);
            expect(error.message).toContain(
              'RHACHET_FALLBACK_BRAIN_TIMEOUT_MS',
            );
          },
        );
      });
    },
  );

  given('[case3] a fallback brain that answers inside the bound', () => {
    // .note = documented test-double cast, as the hung brain above
    const genPromptBrain = (): ContextBrain<BrainChoice> =>
      ({
        brain: {
          choice: {
            slug: 'fake/prompt-brain',
            ask: async () => ({
              output: {
                detected: true,
                blockers: 2,
                nitpicks: 1,
                evidence: '2 blockers, 1 nitpick',
              },
            }),
          },
        },
      }) as unknown as ContextBrain<BrainChoice>;

    when('[t0] the tally is attempted', () => {
      then('the answer maps to the tally, with the brain named', async () => {
        const counts = await getOneReviewCountsViaBrain(
          { content: 'two must-fix items, one suggestion' },
          { getReviewBrain: async () => genPromptBrain() },
        );
        expect(counts).toEqual({
          detected: true,
          blockers: 2,
          nitpicks: 1,
          talliedBy: 'fake/prompt-brain',
        });
      });
    });
  });
});
