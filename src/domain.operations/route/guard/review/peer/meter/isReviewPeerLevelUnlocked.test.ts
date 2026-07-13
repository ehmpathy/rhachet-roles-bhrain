import { given, then, when } from 'test-fns';

import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { isReviewPeerLevelUnlocked } from './isReviewPeerLevelUnlocked';

const asReviewer = (level: number, verdict: ReviewPeerVerdict) => ({
  level,
  verdict,
});

describe('isReviewPeerLevelUnlocked', () => {
  given('[case1] level 1 (no lower levels)', () => {
    when('[t0] lower reviewers absent', () => {
      then('level 1 is always unlocked', () => {
        const result = isReviewPeerLevelUnlocked({ reviewers: [], level: 1 });
        expect(result).toBe(true);
      });
    });

    when('[t1] a level-1 reviewer is itself rejected', () => {
      then(
        'level 1 is still unlocked (its own verdict does not gate it)',
        () => {
          const result = isReviewPeerLevelUnlocked({
            reviewers: [asReviewer(1, 'rejected')],
            level: 1,
          });
          expect(result).toBe(true);
        },
      );
    });
  });

  given('[case2] all lower levels approved', () => {
    when('[t0] every l1 reviewer approved', () => {
      then('l3 is unlocked', () => {
        const result = isReviewPeerLevelUnlocked({
          reviewers: [
            asReviewer(1, 'approved'),
            asReviewer(1, 'approved'),
            asReviewer(3, 'queued'),
          ],
          level: 3,
        });
        expect(result).toBe(true);
      });
    });
  });

  given('[case3] all lower levels exhausted (skipped)', () => {
    when('[t0] every l1 reviewer was skipped for budget', () => {
      then('l3 is unlocked — exhausted is terminal', () => {
        // .why = l3 must proceed as soon as l1 clears; a skipped (exhausted)
        //        reviewer is terminal even if it rejected on a prior attempt
        const result = isReviewPeerLevelUnlocked({
          reviewers: [
            asReviewer(1, 'exhausted'),
            asReviewer(1, 'exhausted'),
            asReviewer(1, 'exhausted'),
            asReviewer(3, 'queued'),
          ],
          level: 3,
        });
        expect(result).toBe(true);
      });
    });
  });

  given('[case4] lower levels mix approved and exhausted', () => {
    when('[t0] some l1 approved, some exhausted', () => {
      then('l3 is unlocked — both verdicts are terminal', () => {
        const result = isReviewPeerLevelUnlocked({
          reviewers: [
            asReviewer(1, 'approved'),
            asReviewer(1, 'exhausted'),
            asReviewer(3, 'queued'),
          ],
          level: 3,
        });
        expect(result).toBe(true);
      });
    });
  });

  given('[case5] a lower reviewer rejected (ran, not skipped)', () => {
    when('[t0] one l1 reviewer rejected', () => {
      then(
        'l3 stays locked — rejected is not terminal, retry is expected',
        () => {
          // .why = per define.invariant.review.peer.exhausted, a review that
          //        RAN and rejected is not terminal even at budget; it turns
          //        terminal (exhausted) only once a later attempt SKIPS it
          const result = isReviewPeerLevelUnlocked({
            reviewers: [
              asReviewer(1, 'approved'),
              asReviewer(1, 'rejected'),
              asReviewer(3, 'queued'),
            ],
            level: 3,
          });
          expect(result).toBe(false);
        },
      );
    });

    when('[t1] one l1 reviewer still queued', () => {
      then('l3 stays locked', () => {
        const result = isReviewPeerLevelUnlocked({
          reviewers: [
            asReviewer(1, 'exhausted'),
            asReviewer(1, 'queued'),
            asReviewer(3, 'queued'),
          ],
          level: 3,
        });
        expect(result).toBe(false);
      });
    });
  });

  given(
    '[case6] a middle level between the target and level 1 not terminal',
    () => {
      when('[t0] l1 terminal but l2 rejected while target is l3', () => {
        then('l3 stays locked — every level below must clear', () => {
          const result = isReviewPeerLevelUnlocked({
            reviewers: [
              asReviewer(1, 'exhausted'),
              asReviewer(2, 'rejected'),
              asReviewer(3, 'queued'),
            ],
            level: 3,
          });
          expect(result).toBe(false);
        });
      });
    },
  );
});
