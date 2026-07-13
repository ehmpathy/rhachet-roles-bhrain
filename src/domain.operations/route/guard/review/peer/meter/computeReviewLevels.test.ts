import { given, then, when } from 'test-fns';

import {
  computeReviewActiveLevel,
  computeReviewTerminalLevel,
} from './computeReviewLevels';
import type { ReviewPeerVerdict } from './computeReviewPeerVerdict';

describe('computeReviewTerminalLevel', () => {
  given('[case1] no reviewers', () => {
    when('[t0] empty array', () => {
      then('returns null', () => {
        expect(computeReviewTerminalLevel([])).toBe(null);
      });
    });
  });

  given('[case2] single level', () => {
    when('[t0] all at level 1', () => {
      then('terminal level is 1', () => {
        const reviewers = [{ level: 1 }, { level: 1 }];
        expect(computeReviewTerminalLevel(reviewers)).toBe(1);
      });
    });
  });

  given('[case3] multiple levels', () => {
    when('[t0] levels 1 and 3 present', () => {
      then('terminal level is the highest (3)', () => {
        const reviewers = [{ level: 1 }, { level: 1 }, { level: 3 }];
        expect(computeReviewTerminalLevel(reviewers)).toBe(3);
      });
    });
  });
});

describe('computeReviewActiveLevel', () => {
  given('[case1] l1 rejecting, l3 queued, no overrules', () => {
    const reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }> = [
      { level: 1, verdict: 'rejected' },
      { level: 3, verdict: 'queued' },
    ];

    when('[t0] no level overruled', () => {
      then('active level is l1 (lowest unresolved)', () => {
        const result = computeReviewActiveLevel({
          reviewers,
          overruledLevels: new Set(),
        });
        expect(result).toBe(1);
      });
    });

    when('[t1] l1 overruled', () => {
      then('active level advances to l3', () => {
        const result = computeReviewActiveLevel({
          reviewers,
          overruledLevels: new Set([1]),
        });
        expect(result).toBe(3);
      });
    });
  });

  given('[case2] l1 terminal (approved), l3 rejecting', () => {
    const reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }> = [
      { level: 1, verdict: 'approved' },
      { level: 3, verdict: 'rejected' },
    ];

    when('[t0] no level overruled', () => {
      then('active level is l3 (l1 already terminal)', () => {
        const result = computeReviewActiveLevel({
          reviewers,
          overruledLevels: new Set(),
        });
        expect(result).toBe(3);
      });
    });
  });

  given('[case3] all levels resolved', () => {
    when('[t0] every reviewer terminal', () => {
      then('active level is null (none left to overrule)', () => {
        const reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }> =
          [
            { level: 1, verdict: 'approved' },
            { level: 3, verdict: 'approved' },
          ];
        const result = computeReviewActiveLevel({
          reviewers,
          overruledLevels: new Set(),
        });
        expect(result).toBe(null);
      });
    });

    when('[t1] l1 approved and l3 overruled', () => {
      then('active level is null', () => {
        const reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }> =
          [
            { level: 1, verdict: 'approved' },
            { level: 3, verdict: 'rejected' },
          ];
        const result = computeReviewActiveLevel({
          reviewers,
          overruledLevels: new Set([3]),
        });
        expect(result).toBe(null);
      });
    });
  });

  given('[case4] malfunction blocks passage (overrule-able), post-#288', () => {
    when('[t0] l1 malfunction, l3 approved', () => {
      then('active level is l1 (malfunction still blocks passage)', () => {
        // .why = #288 makes malfunction terminal for tier escalation (l3 ran),
        //        but it still blocks final passage, so it is the active level
        //        a human overrules
        const reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }> =
          [
            { level: 1, verdict: 'malfunction' },
            { level: 3, verdict: 'approved' },
          ];
        const result = computeReviewActiveLevel({
          reviewers,
          overruledLevels: new Set(),
        });
        expect(result).toBe(1);
      });
    });

    when('[t1] l1 malfunction overruled, l3 approved', () => {
      then('active level is null (all levels clear)', () => {
        const reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }> =
          [
            { level: 1, verdict: 'malfunction' },
            { level: 3, verdict: 'approved' },
          ];
        const result = computeReviewActiveLevel({
          reviewers,
          overruledLevels: new Set([1]),
        });
        expect(result).toBe(null);
      });
    });
  });

  given('[case5] single-level guard (active == terminal)', () => {
    when('[t0] l1 rejecting only', () => {
      then('active level is l1 and terminal level is l1', () => {
        const reviewers: Array<{ level: number; verdict: ReviewPeerVerdict }> =
          [{ level: 1, verdict: 'rejected' }];
        const active = computeReviewActiveLevel({
          reviewers,
          overruledLevels: new Set(),
        });
        const terminal = computeReviewTerminalLevel(reviewers);
        expect(active).toBe(1);
        expect(terminal).toBe(1);
      });
    });
  });
});
