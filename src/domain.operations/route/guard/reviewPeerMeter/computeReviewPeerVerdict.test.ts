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

  given('[case3] rounds >= budget and blockers > 0', () => {
    when('[t0] at budget limit with blockers', () => {
      then('verdict is exhausted', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 3,
          budget: 3,
          blockers: 2,
        });
        expect(verdict).toEqual('exhausted');
      });
    });

    when('[t1] over budget with blockers', () => {
      then('verdict is exhausted', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 5,
          budget: 3,
          blockers: 1,
        });
        expect(verdict).toEqual('exhausted');
      });
    });
  });

  given('[case4] rounds > 0, blockers > 0, rounds < budget', () => {
    when('[t0] has blockers but budget left', () => {
      then('verdict is concerned', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 1,
          budget: 3,
          blockers: 2,
        });
        expect(verdict).toEqual('rejected');
      });
    });

    when('[t1] near budget limit with blockers', () => {
      then('verdict is concerned', () => {
        const verdict = computeReviewPeerVerdict({
          rounds: 2,
          budget: 3,
          blockers: 1,
        });
        expect(verdict).toEqual('rejected');
      });
    });
  });
});
