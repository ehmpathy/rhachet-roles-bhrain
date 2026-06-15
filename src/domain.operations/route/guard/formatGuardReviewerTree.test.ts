import { given, then, when } from 'test-fns';

import {
  computeReviewerVerdict,
  formatGuardReviewerTree,
  type ReviewerTreeState,
} from './formatGuardReviewerTree';

describe('formatGuardReviewerTree', () => {
  given('[case1] approved reviewer with 0 blockers, 0 nitpicks', () => {
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'self/reflect',
      level: 1,
      rounds: 1,
      budget: Infinity,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: 8.2,
        blockers: 0,
        nitpicks: 0,
        path: '.route/5.1.execution.guard.review.i1.abc123.r1.md',
        cached: false,
      },
    };

    when('[t0] formatted as last item', () => {
      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });

    when('[t1] formatted as intermediate item', () => {
      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: false });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case2] approved reviewer with 0 blockers, 2 nitpicks', () => {
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'self/reflect',
      level: 1,
      rounds: 1,
      budget: Infinity,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: 8.2,
        blockers: 0,
        nitpicks: 2,
        path: '.route/5.1.execution.guard.review.i1.abc123.r1.md',
        cached: false,
      },
    };

    when('[t0] formatted', () => {
      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case3] rejected reviewer with 3 blockers, 1 nitpick', () => {
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'self/reflect',
      level: 1,
      rounds: 1,
      budget: Infinity,
      state: {
        type: 'finished',
        verdict: 'rejected',
        durationSec: 5.1,
        blockers: 3,
        nitpicks: 1,
        path: '.route/5.1.execution.guard.review.i1.abc123.r1.md',
        cached: false,
      },
    };

    when('[t0] formatted', () => {
      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case4] exhausted reviewer with blockers', () => {
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'peer/budget-aware',
      level: 1,
      rounds: 2,
      budget: 2,
      state: {
        type: 'finished',
        verdict: 'exhausted',
        durationSec: null,
        blockers: 1,
        nitpicks: 0,
        path: '.route/5.1.execution.guard.review.i1.abc123.r1.md',
        cached: false,
      },
    };

    when('[t0] formatted', () => {
      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case5] inflight reviewer', () => {
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'self/reflect',
      level: 1,
      rounds: 0,
      budget: Infinity,
      state: {
        type: 'inflight',
        durationSec: 4.2,
      },
    };

    when('[t0] formatted', () => {
      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case6] awaits l1 terminal', () => {
    const reviewer: ReviewerTreeState = {
      index: 2,
      slug: 'peer/expensive',
      level: 2,
      rounds: 0,
      budget: 1,
      state: {
        type: 'awaits',
        level: 1,
      },
    };

    when('[t0] formatted', () => {
      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case7] queued reviewer', () => {
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'self/reflect',
      level: 1,
      rounds: 0,
      budget: Infinity,
      state: {
        type: 'queued',
      },
    };

    when('[t0] formatted', () => {
      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case8] cached approved reviewer', () => {
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'self/reflect',
      level: 1,
      rounds: 1,
      budget: Infinity,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: null,
        blockers: 0,
        nitpicks: 0,
        path: '.route/5.1.execution.guard.review.i1.abc123.r1.md',
        cached: true,
      },
    };

    when('[t0] formatted', () => {
      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case9] malfunction reviewer', () => {
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'self/reflect',
      level: 1,
      rounds: 0,
      budget: Infinity,
      state: {
        type: 'malfunction',
        path: '.route/5.1.execution.guard.review.i1.abc123.r1.md',
      },
    };

    when('[t0] formatted', () => {
      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case10] constraint reviewer', () => {
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'self/reflect',
      level: 1,
      rounds: 0,
      budget: Infinity,
      state: {
        type: 'constraint',
        path: '.route/5.1.execution.guard.review.i1.abc123.r1.md',
      },
    };

    when('[t0] formatted', () => {
      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case11] reviewer with finite budget', () => {
    const reviewer: ReviewerTreeState = {
      index: 2,
      slug: 'peer/budget-aware',
      level: 1,
      rounds: 1,
      budget: 3,
      state: {
        type: 'finished',
        verdict: 'rejected',
        durationSec: 5.0,
        blockers: 2,
        nitpicks: 0,
        path: '.route/5.1.execution.guard.review.i1.abc123.r2.md',
        cached: false,
      },
    };

    when('[t0] formatted', () => {
      then('output shows rounds/budget correctly', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines[0]).toContain('1/3');
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case12] base indent provided', () => {
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'self/reflect',
      level: 1,
      rounds: 1,
      budget: Infinity,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: 8.2,
        blockers: 0,
        nitpicks: 0,
        path: '.route/5.1.execution.guard.review.i1.abc123.r1.md',
        cached: false,
      },
    };

    when('[t0] formatted with base indent', () => {
      then('all lines have base indent', () => {
        const lines = formatGuardReviewerTree({
          reviewer,
          isLast: true,
          baseIndent: '      ',
        });
        for (const line of lines) {
          expect(line.startsWith('      ')).toBe(true);
        }
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });
});

describe('computeReviewerVerdict', () => {
  given('[case1] 0 blockers, 0 nitpicks with default thresholds', () => {
    when('[t0] verdict computed', () => {
      then('returns approved', () => {
        const verdict = computeReviewerVerdict({
          blockers: 0,
          nitpicks: 0,
          rounds: 1,
          budget: Infinity,
          allowBlockers: 0,
          allowNitpicks: 0,
        });
        expect(verdict).toBe('approved');
      });
    });
  });

  given('[case2] 1 blocker with allowBlockers=1', () => {
    when('[t0] verdict computed', () => {
      then('returns approved', () => {
        const verdict = computeReviewerVerdict({
          blockers: 1,
          nitpicks: 3,
          rounds: 1,
          budget: Infinity,
          allowBlockers: 1,
          allowNitpicks: 5,
        });
        expect(verdict).toBe('approved');
      });
    });
  });

  given('[case3] 2 blockers with allowBlockers=1', () => {
    when('[t0] verdict computed', () => {
      then('returns rejected', () => {
        const verdict = computeReviewerVerdict({
          blockers: 2,
          nitpicks: 0,
          rounds: 1,
          budget: Infinity,
          allowBlockers: 1,
          allowNitpicks: 5,
        });
        expect(verdict).toBe('rejected');
      });
    });
  });

  given('[case4] budget exhausted with blockers', () => {
    when('[t0] verdict computed', () => {
      then('returns exhausted', () => {
        const verdict = computeReviewerVerdict({
          blockers: 1,
          nitpicks: 0,
          rounds: 2,
          budget: 2,
          allowBlockers: 0,
          allowNitpicks: 0,
        });
        expect(verdict).toBe('exhausted');
      });
    });
  });

  given('[case5] nitpicks exceed threshold', () => {
    when('[t0] verdict computed', () => {
      then('returns rejected', () => {
        const verdict = computeReviewerVerdict({
          blockers: 0,
          nitpicks: 6,
          rounds: 1,
          budget: Infinity,
          allowBlockers: 0,
          allowNitpicks: 5,
        });
        expect(verdict).toBe('rejected');
      });
    });
  });
});
