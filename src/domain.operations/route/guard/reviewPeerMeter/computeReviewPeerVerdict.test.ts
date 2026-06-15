import { given, then, when } from 'test-fns';

import { computeReviewPeerVerdict } from './computeReviewPeerVerdict';

describe('computeReviewPeerVerdict', () => {
  given('[case1] rounds is zero and no cached review', () => {
    when('[t0] review not yet run', () => {
      then('verdict is queued', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 0,
          budget: 3,
          blockers: Infinity, // Infinity means no cached review exists
        });
        expect(verdict).toEqual('queued');
      });
    });

    when('[t1] cached review exists with no blockers', () => {
      then('verdict is approved', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 0,
          budget: 3,
          blockers: 0, // cached review found no blockers
        });
        expect(verdict).toEqual('approved');
      });
    });
  });

  given('[case2] rounds > 0 and no blockers', () => {
    when('[t0] review passed', () => {
      then('verdict is approved', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 1,
          budget: 3,
          blockers: 0,
        });
        expect(verdict).toEqual('approved');
      });
    });

    when('[t1] multiple rounds, no blockers', () => {
      then('verdict is approved', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 3,
          budget: 3,
          blockers: 0,
        });
        expect(verdict).toEqual('approved');
      });
    });
  });

  given('[case3] review was skipped due to budget exhaustion', () => {
    // invariant: 'exhausted' only when wasExhausted: true
    when('[t0] at budget limit, skipped', () => {
      then('verdict is exhausted', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 3,
          budget: 3,
          blockers: 2,
          wasExhausted: true,
        });
        expect(verdict).toEqual('exhausted');
      });
    });

    when('[t1] over budget, skipped', () => {
      then('verdict is exhausted', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 5,
          budget: 3,
          blockers: 1,
          wasExhausted: true,
        });
        expect(verdict).toEqual('exhausted');
      });
    });
  });

  given('[case3b] review ran and depleted budget', () => {
    // invariant: if review RAN, verdict is 'rejected', not 'exhausted'
    when('[t0] at budget limit, review ran', () => {
      then('verdict is rejected (not exhausted)', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 3,
          budget: 3,
          blockers: 2,
          wasExhausted: false,
        });
        expect(verdict).toEqual('rejected');
      });
    });

    when('[t1] wasExhausted not specified, review ran', () => {
      then('verdict is rejected (not exhausted)', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 3,
          budget: 3,
          blockers: 2,
          // wasExhausted: undefined = defaults to ran (not skipped)
        });
        expect(verdict).toEqual('rejected');
      });
    });
  });

  given('[case4] rounds > 0, blockers > 0, rounds < budget', () => {
    when('[t0] has blockers but budget left', () => {
      then('verdict is rejected', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 1,
          budget: 3,
          blockers: 2,
        });
        expect(verdict).toEqual('rejected');
      });
    });

    when('[t1] near budget limit with blockers', () => {
      then('verdict is rejected', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 2,
          budget: 3,
          blockers: 1,
        });
        expect(verdict).toEqual('rejected');
      });
    });
  });

  given('[case5] thresholds allow blockers', () => {
    when('[t0] blockers <= allowBlockers', () => {
      then('verdict is approved', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 1,
          budget: 3,
          blockers: 2,
          allowBlockers: 3,
        });
        expect(verdict).toEqual('approved');
      });
    });

    when('[t1] blockers > allowBlockers', () => {
      then('verdict is rejected', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 1,
          budget: 3,
          blockers: 4,
          allowBlockers: 3,
        });
        expect(verdict).toEqual('rejected');
      });
    });
  });

  given('[case6] thresholds allow nitpicks', () => {
    when('[t0] nitpicks <= allowNitpicks', () => {
      then('verdict is approved', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 1,
          budget: 3,
          blockers: 0,
          nitpicks: 5,
          allowNitpicks: 10,
        });
        expect(verdict).toEqual('approved');
      });
    });

    when('[t1] nitpicks > allowNitpicks', () => {
      then('verdict is rejected', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 1,
          budget: 3,
          blockers: 0,
          nitpicks: 15,
          allowNitpicks: 10,
        });
        expect(verdict).toEqual('rejected');
      });
    });
  });

  given('[case7] both thresholds with budget depleted', () => {
    when('[t0] thresholds exceeded, budget depleted, review ran', () => {
      then('verdict is rejected (not exhausted because review ran)', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 3,
          budget: 3,
          blockers: 5,
          nitpicks: 15,
          allowBlockers: 3,
          allowNitpicks: 10,
          // wasExhausted: false/undefined = review ran
        });
        expect(verdict).toEqual('rejected');
      });
    });

    when('[t1] thresholds exceeded, budget depleted, review skipped', () => {
      then('verdict is exhausted', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 3,
          budget: 3,
          blockers: 5,
          nitpicks: 15,
          allowBlockers: 3,
          allowNitpicks: 10,
          wasExhausted: true,
        });
        expect(verdict).toEqual('exhausted');
      });
    });

    when('[t2] thresholds met and budget depleted', () => {
      then('verdict is approved', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 3,
          budget: 3,
          blockers: 2,
          nitpicks: 8,
          allowBlockers: 3,
          allowNitpicks: 10,
        });
        expect(verdict).toEqual('approved');
      });
    });
  });
});
