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

  given('[case8] exitClass is malfunction', () => {
    when('[t0] review process failed', () => {
      then('verdict is malfunction (regardless of blockers)', () => {
        // .why = malfunction means review process itself failed
        // blockers/nitpicks are not meaningful in this case
        const verdict = computeReviewPeerVerdict({
          rounds: 1,
          budget: 3,
          blockers: 0, // even with no blockers, malfunction takes precedence
          exitClass: 'malfunction',
        });
        expect(verdict).toEqual('malfunction');
      });
    });

    when('[t1] malfunction with blockers', () => {
      then('verdict is malfunction (blockers ignored)', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 2,
          budget: 3,
          blockers: 5,
          exitClass: 'malfunction',
        });
        expect(verdict).toEqual('malfunction');
      });
    });
  });

  given('[case9] exitClass is constraint', () => {
    when('[t0] genuine constraint: exit 2 with no blockers', () => {
      then('verdict is constraint (terminal for tier escalation)', () => {
        // .why = a genuine constraint (e.g., absent api key, absent rule file) means
        //        the reviewer could not run a real review and cannot proceed without
        //        external action; this is terminal so l2/l3 can still run
        const verdict = computeReviewPeerVerdict({
          rounds: 1,
          budget: 3,
          blockers: 0,
          exitClass: 'constraint',
        });
        expect(verdict).toEqual('constraint');
      });
    });

    when('[t1] exit 2 with blockers: review ran and found issues', () => {
      then('verdict is rejected (not a genuine constraint)', () => {
        // .why = exit 2 WITH blockers means the reviewer ran and found issues,
        //        and used exit 2 as its rejection signal; this is a normal rejection
        //        (non-terminal), to match setStoneAsPassed constraint detection
        //        (exitClass === 'constraint' && blockers === 0)
        const verdict = computeReviewPeerVerdict({
          rounds: 1,
          budget: 3,
          blockers: 5,
          exitClass: 'constraint',
        });
        expect(verdict).toEqual('rejected');
      });
    });
  });
});
