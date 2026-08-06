import { given, then, when } from 'test-fns';

import { isReviewPeerVerdictExhausted } from './isReviewPeerVerdictExhausted';

describe('isReviewPeerVerdictExhausted', () => {
  given('[case1] the exhausted verdict', () => {
    when('[t0] verdict is exhausted', () => {
      then('returns true', () => {
        expect(isReviewPeerVerdictExhausted('exhausted')).toBe(true);
      });
    });
  });

  given('[case2] every other verdict', () => {
    when('[t0] verdict is approved', () => {
      then('returns false', () => {
        expect(isReviewPeerVerdictExhausted('approved')).toBe(false);
      });
    });

    when('[t1] verdict is rejected', () => {
      then('returns false', () => {
        expect(isReviewPeerVerdictExhausted('rejected')).toBe(false);
      });
    });

    when('[t2] verdict is malfunction', () => {
      then('returns false', () => {
        expect(isReviewPeerVerdictExhausted('malfunction')).toBe(false);
      });
    });

    when('[t3] verdict is constraint', () => {
      then('returns false', () => {
        expect(isReviewPeerVerdictExhausted('constraint')).toBe(false);
      });
    });

    when('[t4] verdict is queued', () => {
      then('returns false', () => {
        expect(isReviewPeerVerdictExhausted('queued')).toBe(false);
      });
    });
  });
});
