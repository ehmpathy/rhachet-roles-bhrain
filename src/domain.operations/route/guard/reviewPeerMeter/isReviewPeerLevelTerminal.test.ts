import { given, then, when } from 'test-fns';

import {
  isReviewPeerLevelTerminal,
  isReviewPeerVerdictTerminal,
} from './isReviewPeerLevelTerminal';

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
});

describe('isReviewPeerLevelTerminal', () => {
  given('[case1] all reviewers at level are approved', () => {
    when('[t0] single reviewer approved', () => {
      then('returns true', () => {
        const result = isReviewPeerLevelTerminal({
          reviewers: [{ level: 2, verdict: 'approved' }],
          level: 2,
        });
        expect(result).toBe(true);
      });
    });

    when('[t1] multiple reviewers approved', () => {
      then('returns true', () => {
        const result = isReviewPeerLevelTerminal({
          reviewers: [
            { level: 2, verdict: 'approved' },
            { level: 2, verdict: 'approved' },
          ],
          level: 2,
        });
        expect(result).toBe(true);
      });
    });
  });

  given('[case2] all reviewers at level are exhausted', () => {
    when('[t0] single reviewer exhausted', () => {
      then('returns true', () => {
        const result = isReviewPeerLevelTerminal({
          reviewers: [{ level: 2, verdict: 'exhausted' }],
          level: 2,
        });
        expect(result).toBe(true);
      });
    });

    when('[t1] multiple reviewers exhausted', () => {
      then('returns true', () => {
        const result = isReviewPeerLevelTerminal({
          reviewers: [
            { level: 2, verdict: 'exhausted' },
            { level: 2, verdict: 'exhausted' },
          ],
          level: 2,
        });
        expect(result).toBe(true);
      });
    });
  });

  given('[case3] mix of approved and exhausted at level', () => {
    when('[t0] some approved, some exhausted', () => {
      then('returns true', () => {
        const result = isReviewPeerLevelTerminal({
          reviewers: [
            { level: 2, verdict: 'approved' },
            { level: 2, verdict: 'exhausted' },
          ],
          level: 2,
        });
        expect(result).toBe(true);
      });
    });
  });

  given('[case4] any reviewer at level is rejected', () => {
    when('[t0] one rejected among approved', () => {
      then('returns false', () => {
        const result = isReviewPeerLevelTerminal({
          reviewers: [
            { level: 2, verdict: 'approved' },
            { level: 2, verdict: 'rejected' },
          ],
          level: 2,
        });
        expect(result).toBe(false);
      });
    });

    when('[t1] all rejected', () => {
      then('returns false', () => {
        const result = isReviewPeerLevelTerminal({
          reviewers: [
            { level: 2, verdict: 'rejected' },
            { level: 2, verdict: 'rejected' },
          ],
          level: 2,
        });
        expect(result).toBe(false);
      });
    });
  });

  given('[case5] any reviewer at level is queued', () => {
    when('[t0] one queued among approved', () => {
      then('returns false', () => {
        const result = isReviewPeerLevelTerminal({
          reviewers: [
            { level: 2, verdict: 'approved' },
            { level: 2, verdict: 'queued' },
          ],
          level: 2,
        });
        expect(result).toBe(false);
      });
    });

    when('[t1] all queued', () => {
      then('returns false', () => {
        const result = isReviewPeerLevelTerminal({
          reviewers: [
            { level: 2, verdict: 'queued' },
            { level: 2, verdict: 'queued' },
          ],
          level: 2,
        });
        expect(result).toBe(false);
      });
    });
  });

  given('[case6] empty level (no reviewers at level)', () => {
    when('[t0] no reviewers at queried level', () => {
      then('returns true', () => {
        const result = isReviewPeerLevelTerminal({
          reviewers: [
            { level: 1, verdict: 'queued' },
            { level: 1, verdict: 'rejected' },
          ],
          level: 2,
        });
        expect(result).toBe(true);
      });
    });

    when('[t1] empty reviewers array', () => {
      then('returns true', () => {
        const result = isReviewPeerLevelTerminal({
          reviewers: [],
          level: 2,
        });
        expect(result).toBe(true);
      });
    });
  });

  given('[case7] multi-level reviewers', () => {
    when('[t0] level 2 terminal, level 1 not', () => {
      then('level 2 check returns true', () => {
        const reviewers = [
          { level: 2, verdict: 'approved' as const },
          { level: 1, verdict: 'queued' as const },
        ];
        expect(isReviewPeerLevelTerminal({ reviewers, level: 2 })).toBe(true);
      });

      then('level 1 check returns false', () => {
        const reviewers = [
          { level: 2, verdict: 'approved' as const },
          { level: 1, verdict: 'queued' as const },
        ];
        expect(isReviewPeerLevelTerminal({ reviewers, level: 1 })).toBe(false);
      });
    });
  });
});
