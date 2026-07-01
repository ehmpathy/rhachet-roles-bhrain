import { given, then, when } from 'test-fns';

import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';
import { isReviewPeerLevelUnlocked } from './isReviewPeerLevelUnlocked';

const asReviewer = (input: {
  level: number;
  verdict: ReviewPeerVerdict;
  rounds?: number;
  budget?: number;
}) => ({
  level: input.level,
  verdict: input.verdict,
  // default to budget left so verdict alone drives the settled check
  rounds: input.rounds ?? 0,
  budget: input.budget ?? 5,
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
            reviewers: [asReviewer({ level: 1, verdict: 'rejected' })],
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
            asReviewer({ level: 1, verdict: 'approved' }),
            asReviewer({ level: 1, verdict: 'approved' }),
            asReviewer({ level: 3, verdict: 'queued' }),
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
        const result = isReviewPeerLevelUnlocked({
          reviewers: [
            asReviewer({ level: 1, verdict: 'exhausted' }),
            asReviewer({ level: 1, verdict: 'exhausted' }),
            asReviewer({ level: 3, verdict: 'queued' }),
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
            asReviewer({ level: 1, verdict: 'approved' }),
            asReviewer({ level: 1, verdict: 'exhausted' }),
            asReviewer({ level: 3, verdict: 'queued' }),
          ],
          level: 3,
        });
        expect(result).toBe(true);
      });
    });
  });

  given('[case5] a lower reviewer rejected but still has budget', () => {
    when('[t0] one l1 reviewer rejected with rounds < budget', () => {
      then('l3 stays locked — the reviewer can still improve', () => {
        const result = isReviewPeerLevelUnlocked({
          reviewers: [
            asReviewer({ level: 1, verdict: 'approved' }),
            asReviewer({ level: 1, verdict: 'rejected', rounds: 2, budget: 5 }),
            asReviewer({ level: 3, verdict: 'queued' }),
          ],
          level: 3,
        });
        expect(result).toBe(false);
      });
    });

    when('[t1] one l1 reviewer still queued with budget', () => {
      then('l3 stays locked', () => {
        const result = isReviewPeerLevelUnlocked({
          reviewers: [
            asReviewer({ level: 1, verdict: 'exhausted' }),
            asReviewer({ level: 1, verdict: 'queued', rounds: 0, budget: 5 }),
            asReviewer({ level: 3, verdict: 'queued' }),
          ],
          level: 3,
        });
        expect(result).toBe(false);
      });
    });
  });

  given(
    '[case6] deadlock regression: lower reviewer rejected AND out of budget',
    () => {
      // .why = an l1 reviewer that rejected on the current hash and spent its last
      //        budget round stays 'rejected' (never relabeled 'exhausted'); it can
      //        never run again, so it must count as settled or l3 deadlocks forever
      when('[t0] an l1 reviewer rejected with rounds === budget', () => {
        then('l3 unlocks — a spent reviewer cannot improve', () => {
          const result = isReviewPeerLevelUnlocked({
            reviewers: [
              asReviewer({ level: 1, verdict: 'approved' }),
              asReviewer({
                level: 1,
                verdict: 'rejected',
                rounds: 7,
                budget: 7,
              }),
              asReviewer({ level: 3, verdict: 'queued' }),
            ],
            level: 3,
          });
          expect(result).toBe(true);
        });
      });

      when('[t1] an l1 reviewer malfunctioned with no budget left', () => {
        then('l3 unlocks — the spent reviewer cannot retry', () => {
          const result = isReviewPeerLevelUnlocked({
            reviewers: [
              asReviewer({ level: 1, verdict: 'approved' }),
              asReviewer({
                level: 1,
                verdict: 'malfunction',
                rounds: 5,
                budget: 5,
              }),
              asReviewer({ level: 3, verdict: 'queued' }),
            ],
            level: 3,
          });
          expect(result).toBe(true);
        });
      });
    },
  );

  given(
    '[case7] a middle level between the target and level 1 is not settled',
    () => {
      when(
        '[t0] l1 settled but l2 rejected with budget while target is l3',
        () => {
          then('l3 stays locked — every level below must settle', () => {
            const result = isReviewPeerLevelUnlocked({
              reviewers: [
                asReviewer({ level: 1, verdict: 'exhausted' }),
                asReviewer({
                  level: 2,
                  verdict: 'rejected',
                  rounds: 1,
                  budget: 5,
                }),
                asReviewer({ level: 3, verdict: 'queued' }),
              ],
              level: 3,
            });
            expect(result).toBe(false);
          });
        },
      );
    },
  );
});
