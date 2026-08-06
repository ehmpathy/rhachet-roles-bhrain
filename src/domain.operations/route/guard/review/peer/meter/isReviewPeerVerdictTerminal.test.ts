import { given, then, when } from 'test-fns';

import { isReviewPeerVerdictTerminal } from './isReviewPeerVerdictTerminal';

describe('isReviewPeerVerdictTerminal', () => {
  given('[case1] terminal verdicts', () => {
    when('[t0] verdict is approved', () => {
      then('returns true', () => {
        expect(isReviewPeerVerdictTerminal('approved')).toBe(true);
      });
    });

    when('[t1] verdict is exhausted', () => {
      then('returns true', () => {
        expect(isReviewPeerVerdictTerminal('exhausted')).toBe(true);
      });
    });
  });

  given('[case2] non-terminal verdicts', () => {
    when('[t0] verdict is rejected', () => {
      then('returns false', () => {
        expect(isReviewPeerVerdictTerminal('rejected')).toBe(false);
      });
    });

    when('[t1] verdict is queued', () => {
      then('returns false', () => {
        expect(isReviewPeerVerdictTerminal('queued')).toBe(false);
      });
    });
  });

  given('[case3] malfunction verdict', () => {
    when('[t0] verdict is malfunction', () => {
      then('returns true (malfunction is terminal for tier escalation)', () => {
        // .why = broken reviewers should not block tier escalation
        // a malfunctioned reviewer cannot proceed without external intervention
        expect(isReviewPeerVerdictTerminal('malfunction')).toBe(true);
      });
    });
  });

  given('[case4] constraint verdict', () => {
    when('[t0] verdict is constraint', () => {
      then('returns true (constraint is terminal for tier escalation)', () => {
        // .why = constrained reviewers (exit 2) should not block tier escalation
        // a constrained reviewer cannot proceed without external intervention
        expect(isReviewPeerVerdictTerminal('constraint')).toBe(true);
      });
    });
  });
});
