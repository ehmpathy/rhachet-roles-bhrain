import { given, then, when } from 'test-fns';

import { FIXED_FALLBACK_BRAIN } from '../../genReviewBrainSupply';
import { TALLIED_FOOTER_PREFIX } from '../review/getReviewTacticFromContent';
import {
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
        tallier: 'deterministic',
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
        tallier: 'deterministic',
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
        tallier: 'deterministic',
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
        tallier: 'deterministic',
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
        tallier: 'deterministic',
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
      then(
        'renders the terminal narrative — malfunction is terminal-for-unlock, so it must not read as a ladder halt',
        () => {
          const out = formatGuardReviewerTree({ reviewer, isLast: true }).join(
            '\n',
          );
          expect(out).toContain('malfunction 💥');
          expect(out).toContain('terminal — does not block higher levels');
        },
      );

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
      then(
        'renders the terminal narrative — constraint is terminal-for-unlock, so it must not read as a ladder halt',
        () => {
          const out = formatGuardReviewerTree({ reviewer, isLast: true }).join(
            '\n',
          );
          expect(out).toContain('constraint ✋');
          expect(out).toContain('terminal — does not block higher levels');
        },
      );

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
        tallier: 'deterministic',
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

  given('[case13] finished PEER reviewer renders a paired taken line', () => {
    const pathGiven =
      '.reviews/peer/1.execute._.review.i001.a1b2c3.r001._.given.by_peer.architect.md';
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'architect',
      level: 1,
      rounds: 1,
      budget: 3,
      state: {
        type: 'finished',
        verdict: 'rejected',
        durationSec: 5.0,
        blockers: 2,
        nitpicks: 1,
        path: pathGiven,
        cached: false,
        tallier: 'deterministic',
      },
    };

    when('[t0] formatted', () => {
      then('renders given: next to a derived taken: line', () => {
        const out = formatGuardReviewerTree({ reviewer, isLast: true }).join(
          '\n',
        );
        expect(out).toContain(`given: ${pathGiven}`);
        expect(out).toContain(
          'taken: .reviews/peer/1.execute._.review.i001.a1b2c3.r001._.taken.by_self.architect.md',
        );
      });

      then('output matches snapshot', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).toMatchSnapshot();
      });
    });
  });

  given('[case14] a SELF reviewer path yields no taken line', () => {
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
        tallier: 'deterministic',
      },
    };

    when('[t0] formatted', () => {
      then(
        'does not render a taken line (self path has no given infix)',
        () => {
          const out = formatGuardReviewerTree({ reviewer, isLast: true }).join(
            '\n',
          );
          expect(out).not.toContain('taken:');
        },
      );
    });
  });

  given(
    '[case15] malfunction PEER reviewer renders a paired taken line',
    () => {
      const pathGiven =
        '.reviews/peer/1.execute._.review.i001.a1b2c3.r001._.given.by_peer.architect.md';
      const reviewer: ReviewerTreeState = {
        index: 1,
        slug: 'architect',
        level: 1,
        rounds: 0,
        budget: 3,
        state: {
          type: 'malfunction',
          path: pathGiven,
        },
      };

      when('[t0] formatted', () => {
        then('renders given: then a derived taken: line', () => {
          const out = formatGuardReviewerTree({ reviewer, isLast: true }).join(
            '\n',
          );
          expect(out).toContain('malfunction 💥');
          expect(out).toContain(`given: ${pathGiven}`);
          expect(out).toContain(
            'taken: .reviews/peer/1.execute._.review.i001.a1b2c3.r001._.taken.by_self.architect.md',
          );
        });
      });
    },
  );

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
        tallier: 'deterministic',
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

  given('[case13] probabilistic reviewer shows the tallied-by branch', () => {
    const reviewer: ReviewerTreeState = {
      index: 2,
      slug: 'peer/architect',
      level: 1,
      rounds: 1,
      budget: Infinity,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: 9.1,
        blockers: 0,
        nitpicks: 1,
        path: '.route/5.1.execution.guard.review.i1.abc123.r1.md',
        cached: false,
        tallier: 'probabilistic',
      },
    };

    when('[t0] formatted', () => {
      then(
        'output shows a tallied-by branch that names the fallback brain',
        () => {
          const lines = formatGuardReviewerTree({ reviewer, isLast: true });
          const joined = lines.join('\n');
          expect(joined).toContain(
            `${TALLIED_FOOTER_PREFIX}${FIXED_FALLBACK_BRAIN}`,
          );
          expect(joined).toMatchSnapshot();
        },
      );

      then(
        'the tallied-by branch sits between nitpicks and the path line',
        () => {
          const lines = formatGuardReviewerTree({ reviewer, isLast: true });
          const nitIdx = lines.findIndex((l) => l.includes('nitpick'));
          const tallyIdx = lines.findIndex((l) =>
            l.includes(TALLIED_FOOTER_PREFIX),
          );
          const pathIdx = lines.findIndex((l) => l.includes('given:'));
          expect(nitIdx).toBeGreaterThanOrEqual(0);
          expect(tallyIdx).toBeGreaterThan(nitIdx);
          expect(pathIdx).toBeGreaterThan(tallyIdx);
        },
      );
    });
  });

  given('[case14] deterministic reviewer shows NO tallied-by branch', () => {
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'peer/mechanic',
      level: 1,
      rounds: 1,
      budget: Infinity,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: 12.4,
        blockers: 0,
        nitpicks: 2,
        path: '.route/5.1.execution.guard.review.i1.abc123.r1.md',
        cached: false,
        tallier: 'deterministic',
      },
    };

    when('[t0] formatted', () => {
      then('output shows no tallied-by branch', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        expect(lines.join('\n')).not.toContain(TALLIED_FOOTER_PREFIX);
      });
    });
  });

  given(
    '[case15] tallied-by prefix is the shared drift-guarded constant',
    () => {
      when('[t0] the probabilistic branch is rendered', () => {
        then(
          'it uses the exact TALLIED_FOOTER_PREFIX constant, not a literal',
          () => {
            const reviewer: ReviewerTreeState = {
              index: 1,
              slug: 'peer/architect',
              level: 1,
              rounds: 1,
              budget: Infinity,
              state: {
                type: 'finished',
                verdict: 'approved',
                durationSec: 9.1,
                blockers: 0,
                nitpicks: 0,
                path: '.route/x.md',
                cached: false,
                tallier: 'probabilistic',
              },
            };
            const lines = formatGuardReviewerTree({ reviewer, isLast: true });
            // the writer (this render) and both cache-recovery parsers all reference
            // TALLIED_FOOTER_PREFIX; a copy tweak moves the parse contract in lockstep.
            const tallyLine = lines.find((l) =>
              l.includes(TALLIED_FOOTER_PREFIX),
            );
            expect(tallyLine).toBeDefined();
            expect(tallyLine).toContain(
              `${TALLIED_FOOTER_PREFIX}${FIXED_FALLBACK_BRAIN}`,
            );
          },
        );
      });
    },
  );
});