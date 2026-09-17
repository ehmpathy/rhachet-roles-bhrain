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
      overruled: false,
      skippedByDispute: false,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: 8.2,
        blockers: { disputed: 0, reported: 0 },
        nitpicks: { disputed: 0, reported: 0 },
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
      overruled: false,
      skippedByDispute: false,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: 8.2,
        blockers: { disputed: 0, reported: 0 },
        nitpicks: { disputed: 0, reported: 2 },
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
      overruled: false,
      skippedByDispute: false,
      state: {
        type: 'finished',
        verdict: 'rejected',
        durationSec: 5.1,
        blockers: { disputed: 0, reported: 3 },
        nitpicks: { disputed: 0, reported: 1 },
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
      overruled: false,
      skippedByDispute: false,
      state: {
        type: 'finished',
        verdict: 'exhausted',
        durationSec: null,
        blockers: { disputed: 0, reported: 1 },
        nitpicks: { disputed: 0, reported: 0 },
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
      overruled: false,
      skippedByDispute: false,
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
      overruled: false,
      skippedByDispute: false,
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
      overruled: false,
      skippedByDispute: false,
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
      overruled: false,
      skippedByDispute: false,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: null,
        blockers: { disputed: 0, reported: 0 },
        nitpicks: { disputed: 0, reported: 0 },
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
      overruled: false,
      skippedByDispute: false,
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
      overruled: false,
      skippedByDispute: false,
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
      overruled: false,
      skippedByDispute: false,
      state: {
        type: 'finished',
        verdict: 'rejected',
        durationSec: 5.0,
        blockers: { disputed: 0, reported: 2 },
        nitpicks: { disputed: 0, reported: 0 },
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
      overruled: false,
      skippedByDispute: false,
      state: {
        type: 'finished',
        verdict: 'rejected',
        durationSec: 5.0,
        blockers: { disputed: 0, reported: 2 },
        nitpicks: { disputed: 0, reported: 1 },
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
      overruled: false,
      skippedByDispute: false,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: 8.2,
        blockers: { disputed: 0, reported: 0 },
        nitpicks: { disputed: 0, reported: 0 },
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
        overruled: false,
        skippedByDispute: false,
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
      overruled: false,
      skippedByDispute: false,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: 8.2,
        blockers: { disputed: 0, reported: 0 },
        nitpicks: { disputed: 0, reported: 0 },
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
      overruled: false,
      skippedByDispute: false,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: 9.1,
        blockers: { disputed: 0, reported: 0 },
        nitpicks: { disputed: 0, reported: 1 },
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
      overruled: false,
      skippedByDispute: false,
      state: {
        type: 'finished',
        verdict: 'approved',
        durationSec: 12.4,
        blockers: { disputed: 0, reported: 0 },
        nitpicks: { disputed: 0, reported: 2 },
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
              overruled: false,
              skippedByDispute: false,
              state: {
                type: 'finished',
                verdict: 'approved',
                durationSec: 9.1,
                blockers: { disputed: 0, reported: 0 },
                nitpicks: { disputed: 0, reported: 0 },
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

  given(
    '[case16] an OVERRULED reviewer whose raw verdict is still rejected',
    () => {
      const reviewer: ReviewerTreeState = {
        index: 1,
        slug: 'peer/basic-checker',
        level: 1,
        rounds: 1,
        budget: 3,
        overruled: true,
        skippedByDispute: false,
        state: {
          type: 'finished',
          verdict: 'rejected',
          durationSec: 4.1,
          blockers: { disputed: 0, reported: 3 },
          nitpicks: { disputed: 0, reported: 0 },
          path: '.route/1.plan.guard.review.i1.abc123.r1.md',
          cached: false,
          tallier: 'deterministic',
        },
      };

      when('[t0] formatted', () => {
        const lines = formatGuardReviewerTree({ reviewer, isLast: true });
        const output = lines.join('\n');

        then('shows the raw rejected verdict AND the forgiven marker', () => {
          expect(output).toContain('rejected');
          expect(output).toContain('overruled ✓ — forgiven by human');
        });

        then(
          'still shows the blocker count (forgiveness is not erasure)',
          () => {
            expect(output).toContain('3 blockers 🔴');
          },
        );

        then('matches snapshot', () => {
          expect(lines).toMatchSnapshot();
        });
      });
    },
  );

  /**
   * .what = the lane a DISPUTE took out of this generation's round
   * .why = the skip is otherwise invisible. the row is built from the lane's CACHED artifact, so
   *        its verdict, counts, and `given:` render exactly as a lane that ran — and a driver
   *        reads a stale rejection as a fresh one (`case=4`, *"the lane that goes quiet"*).
   */
  given('[case17] a lane QUIETED by a dispute', () => {
    // typed to the FINISHED variant alone, so [t2]/[t3] below can override `blockers`
    // by spread with no TS fallback to the full state union (every other variant —
    // inflight/awaits/queued/malfunction/constraint — carries no `blockers` at all)
    const finishedState: Extract<
      ReviewerTreeState['state'],
      { type: 'finished' }
    > = {
      type: 'finished',
      verdict: 'rejected',
      durationSec: null,
      // this lane's one blocker IS what was disputed — the case that motivated the
      // arithmetic render below: a bare `1 blocker 🔴` beside `disputed 🌙` read as
      // "the road still holds here", though the driver's dispute already shed it
      blockers: { disputed: 1, reported: 1 },
      nitpicks: { disputed: 0, reported: 0 },
      path: '.reviews/peer/given.5.1.execution.r2.architect.md',
      cached: true,
      tallier: 'deterministic',
    };
    const reviewer: ReviewerTreeState = {
      index: 1,
      slug: 'architect',
      level: 1,
      rounds: 2,
      budget: 4,
      overruled: false,
      skippedByDispute: true,
      state: finishedState,
    };

    when('[t0] formatted', () => {
      const output = formatGuardReviewerTree({ reviewer, isLast: true }).join(
        '\n',
      );

      then('the skip is NAMED — a silent absence would be the defect', () => {
        expect(output).toContain('disputed');
        expect(output).toContain('skipped this generation');
      });

      // the reported/disputed/tallied arithmetic renders inline, so a reader never has to
      // hold the narrative line above and the raw count in mind and do the subtraction
      then('the blocker count shows the arithmetic, tallied to zero', () => {
        expect(output).toContain('1 blocker, 1 disputed → 0 tallied ✓');
      });

      then(
        'a clean count still renders plainly — no arithmetic to show',
        () => {
          expect(output).toContain('0 nitpicks ✓');
          expect(output).not.toContain('nitpicks, 0 disputed');
        },
      );

      // 🔴 `case=4`: "`disputed` and `exhausted` must not share a rendered word". they look
      //    identical on the meter — a lane that did not run — and differ in the one respect a
      //    driver acts on: a top-up reverses an exhaustion and buys a disputed lane naught
      then(
        'it NEVER says exhausted — the word is the whole distinction',
        () => {
          expect(output).not.toContain('exhausted');
        },
      );

      // acceptance #2 — "the disagreement consumes no budget". the meter is the proof, so it
      // must still read the rounds the lane spent BEFORE the stance, never one more
      then('the meter shows no round spent on the skip', () => {
        expect(output).toContain('architect (l1, 2/4)');
        expect(output).toContain('no round spent');
      });

      // forgiveness is not erasure, and neither is a stance. the prior given still sits on
      // disk and the council reads it beside the driver's argument
      then('the prior verdict and its tally still render', () => {
        expect(output).toContain('rejected');
        expect(output).toContain('1 blocker, 1 disputed → 0 tallied ✓');
        expect(output).toContain(
          'given: .reviews/peer/given.5.1.execution.r2.architect.md',
        );
      });

      then('the bytes a driver reads are pinned', () => {
        expect(output).toMatchSnapshot();
      });
    });

    // 🔴 `case=4` `[t3]` — a forgive is the HUMAN's word and a dispute is the DRIVER's. they are
    //    independent, they compose, and neither undoes the other. a union member could not hold
    //    the pair; two flags can, which is the whole argument for the shape
    when('[t1] a human ALSO overrules the level', () => {
      const output = formatGuardReviewerTree({
        reviewer: { ...reviewer, overruled: true },
        isLast: true,
      }).join('\n');

      then('both markers render — the skip survives the forgive', () => {
        expect(output).toContain('skipped this generation');
        expect(output).toContain('overruled ✓ — forgiven by human');
      });

      // the skip explains why the verdict above it is STALE, and a reader must hold that
      // before the forgiveness of that verdict can mean aught
      then('the skip is named BEFORE the forgive', () => {
        expect(output.indexOf('skipped this generation')).toBeLessThan(
          output.indexOf('overruled ✓'),
        );
      });
    });

    // ⚠️ the flag means SKIPPED, never "has a dispute on record". a lane whose residual tally
    //    still clears the threshold RUNS with its disputes unresolved, and to claim a skip
    //    there would be a `rule.forbid.surprises` blocker
    when('[t2] the lane is NOT quieted, and carries no dispute at all', () => {
      const output = formatGuardReviewerTree({
        reviewer: {
          ...reviewer,
          skippedByDispute: false,
          state: {
            ...finishedState,
            blockers: { disputed: 0, reported: 1 },
          },
        },
        isLast: true,
      }).join('\n');

      then('no skip is claimed, and the count renders plainly', () => {
        expect(output).not.toContain('disputed');
        expect(output).not.toContain('skipped this generation');
        expect(output).toContain('1 blocker 🔴');
      });
    });

    // 🔴 case=4's F024: a PARTIAL dispute — the lane's residual still holds the road, so it
    //    RUNS (skippedByDispute: false) even though a real dispute stands against one of its
    //    concerns. this is the exact combination the arithmetic render exists for: the driver
    //    disputed one concern, the lane still speaks, and the count must say both are true
    when('[t3] the lane RUNS with a partial, un-cleared dispute', () => {
      const output = formatGuardReviewerTree({
        reviewer: {
          ...reviewer,
          skippedByDispute: false,
          state: {
            ...finishedState,
            blockers: { disputed: 1, reported: 3 },
          },
        },
        isLast: true,
      }).join('\n');

      then('no SKIP narrative renders — the lane ran this round', () => {
        expect(output).not.toContain('skipped this generation');
      });

      then('the arithmetic still shows what the dispute shed', () => {
        expect(output).toContain('3 blockers, 1 disputed → 2 tallied 🔴');
      });
    });
  });
});
