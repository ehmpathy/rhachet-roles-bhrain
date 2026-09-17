import { BadRequestError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { assertAbsorptionIsAnswered } from './assertAbsorptionIsAnswered';
import type { RouteGuardReviewPeerFeedbackUnabsorbed } from './getRouteGuardReviewPeerFeedbackAbsorptionStatus';

/**
 * .what = unit cases for R1 — an absorption is refused while the lane's given stands unanswered
 * .why = the wish's boundary: a stance is a verdict on the disagreement; it does not discharge
 *        the duty to answer each point. so answer first, then take a stance on what you
 *        answered. the refusal must name the count AND the exact .taken path, so the driver
 *        copies it rather than derives it.
 */

const asOwed = (input: {
  slug: string;
  blockers: number;
  unreadable?: boolean;
}): RouteGuardReviewPeerFeedbackUnabsorbed =>
  ({
    slug: input.slug,
    tag: 'absent',
    blockers: input.blockers,
    unreadable: input.unreadable ?? false,
    pathGiven: `r3.${input.slug}.given.md`,
    pathTaken: `.reviews/peer/.taken.by_self.${input.slug}.md`,
  }) as RouteGuardReviewPeerFeedbackUnabsorbed;

describe('assertAbsorptionIsAnswered', () => {
  given('[case1] the lane owes no answer', () => {
    when('[t0] a stance is checked', () => {
      then('it passes — the slot is open', () => {
        expect(
          assertAbsorptionIsAnswered({
            stone: 'test-stone',
            slug: 'mech',
            feedbackUnabsorbed: [],
          }),
        ).toBeUndefined();
      });
    });
  });

  given('[case2] a DIFFERENT lane owes an answer', () => {
    const feedbackUnabsorbed = [asOwed({ slug: 'arch', blockers: 2 })];

    when('[t0] a stance on the answered lane is checked', () => {
      then('it passes — the debt is keyed to the reviewer', () => {
        expect(
          assertAbsorptionIsAnswered({
            stone: 'test-stone',
            slug: 'mech',
            feedbackUnabsorbed,
          }),
        ).toBeUndefined();
      });
    });
  });

  given('[case3] this lane owes an unanswered given', () => {
    const feedbackUnabsorbed = [asOwed({ slug: 'mech', blockers: 3 })];

    when('[t0] a stance is checked', () => {
      const error = getError(() =>
        assertAbsorptionIsAnswered({
          stone: 'test-stone',
          slug: 'mech',
          feedbackUnabsorbed,
        }),
      );

      then('it throws', () => {
        expect(error).toBeInstanceOf(BadRequestError);
      });
    });
  });

  // 🔴 r10 b3 (i005/i006/i008 — raised 3×, closed here) — case3's blocker-count, path,
  // dispose-step, and stone-name checks; case4's singular-count check; and case5's
  // unreadable-verdict check ALL lived here as bare `toContain` fragments, alongside the
  // whole-body snapshots below that already pin the exact same three scenarios. a bare
  // `toContain` passes on a reword that keeps the fragment and wrecks the shape around it
  // (the exact class that once shipped "1 blocker stand", a subject-verb-agreement bug,
  // undetected until a snapshot caught it) — so the fragile fragments were redundant AND
  // riskier than the snapshot they sat beside. removed; the snapshot is the single source.
  given('[case4] the rendered refusals, whole', () => {
    when('[t0] several blockers stand unanswered', () => {
      then('the bytes a driver reads are pinned', () => {
        const error = getError(() =>
          assertAbsorptionIsAnswered({
            stone: 'test-stone',
            slug: 'mech',
            feedbackUnabsorbed: [asOwed({ slug: 'mech', blockers: 3 })],
          }),
        );
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t1] exactly one blocker stands unanswered', () => {
      then('the bytes a driver reads are pinned', () => {
        const error = getError(() =>
          assertAbsorptionIsAnswered({
            stone: 'test-stone',
            slug: 'mech',
            feedbackUnabsorbed: [asOwed({ slug: 'mech', blockers: 1 })],
          }),
        );
        expect(error.message).toMatchSnapshot();
      });
    });

    when('[t2] the verdict was unreadable', () => {
      then('the bytes a driver reads are pinned', () => {
        const error = getError(() =>
          assertAbsorptionIsAnswered({
            stone: 'test-stone',
            slug: 'mech',
            feedbackUnabsorbed: [
              asOwed({ slug: 'mech', blockers: 1, unreadable: true }),
            ],
          }),
        );
        expect(error.message).toMatchSnapshot();
      });
    });
  });
});
