import { given, then, when } from 'test-fns';

import { formatArtifactFooters } from './formatArtifactFooters';

/**
 * .what = pins the peer markers of the two artifact footers, at every combination
 * .why = the dual-outcome case rendered TWO terminal `└─` branches at one level, and it
 *        survived because the composition had no runnable grain — the footers were built
 *        inline in `runOneStoneGuardReview`, whose only coverage is an integration suite
 *        behind a five-key credential gate. this is that missed grain
 *        (`.dream/v2026_09_04.fix.integration-harness-demands-five-brain-keys-from-every-suite.md`).
 *
 * ⚠️ [case3] is the regression clamp — it goes red under the pre-repair renderer, which
 *    hardcoded `└─` on both footers (`rule.require.clamp-edge-cases`).
 */
describe('formatArtifactFooters', () => {
  given(
    '[case1] a passage footer alone — a malfunction with no readable verdict',
    () => {
      when('[t0] the footers are formatted', () => {
        const lines = formatArtifactFooters({
          passage: {
            blockReason: 'blocked by malfunction',
            exitCode: 1,
            exitEmoji: '💥',
          },
          tally: null,
        });

        then('the passage footer closes the artifact', () => {
          expect(lines[0]).toEqual('└─ passage blocked');
        });

        then('its children take the terminal indent', () => {
          expect(lines[1]).toEqual('   ├─ blocked by malfunction');
          expect(lines[2]).toEqual('   └─ exit code: 1 💥');
        });

        then('exactly one terminal branch exists at the root', () => {
          expect(lines.filter((line) => line.startsWith('└─'))).toHaveLength(1);
        });
      });
    },
  );

  given('[case2] a tally alone — a clean review that exited zero', () => {
    when('[t0] the footers are formatted', () => {
      const lines = formatArtifactFooters({
        passage: null,
        tally: { blockers: 0, nitpicks: 2, talliedBy: null },
      });

      then('the tally closes the artifact', () => {
        expect(lines[0]).toEqual('└─ tallied');
      });

      then('a deterministic tally ends on the nitpicks row', () => {
        expect(lines[1]).toEqual('   ├─ 0 blockers');
        expect(lines[2]).toEqual('   └─ 2 nitpicks');
      });

      then('exactly one terminal branch exists at the root', () => {
        expect(lines.filter((line) => line.startsWith('└─'))).toHaveLength(1);
      });
    });
  });

  given(
    '[case3] BOTH footers — a non-zero exit whose verdict was still readable',
    () => {
      when('[t0] the footers are formatted', () => {
        const lines = formatArtifactFooters({
          passage: {
            blockReason: 'blocked by malfunction',
            exitCode: 1,
            exitEmoji: '💥',
          },
          tally: { blockers: 1, nitpicks: 0, talliedBy: null },
        });

        then(
          'the passage footer yields the terminal marker to the tally',
          () => {
            // 🔴 THE CLAMP. the pre-repair renderer pushed a hardcoded `└─` here, so this
            //    assertion goes red against it — which is what makes it a clamp rather than
            //    a restatement of the current behaviour.
            expect(lines[0]).toEqual('├─ passage blocked');
          },
        );

        then(
          'its children take the CONTINUED indent, not the terminal one',
          () => {
            // the indent moves with the marker; a `├─` parent whose children kept `   `
            // would orphan them from the trunk just as visibly as the double `└─` did.
            expect(lines[1]).toEqual('│  ├─ blocked by malfunction');
            expect(lines[2]).toEqual('│  └─ exit code: 1 💥');
          },
        );

        then('the tally closes the artifact', () => {
          expect(lines[3]).toEqual('└─ tallied');
          expect(lines[4]).toEqual('   ├─ 1 blocker');
          expect(lines[5]).toEqual('   └─ 0 nitpicks');
        });

        then('exactly ONE terminal branch exists at the root', () => {
          // the defect stated as an invariant rather than as a line number — this is the
          // assertion that would have caught it at any call site.
          expect(lines.filter((line) => line.startsWith('└─'))).toHaveLength(1);
        });
      });
    },
  );

  given('[case4] a probabilistic tally — a sub-brain read the prose', () => {
    when('[t0] the footers are formatted', () => {
      const lines = formatArtifactFooters({
        passage: null,
        tally: {
          blockers: 3,
          nitpicks: 1,
          talliedBy: 'fireworks/deepseek/v4-flash',
        },
      });

      then(
        'the nitpicks row becomes a mid-branch to admit the tallier line',
        () => {
          expect(lines[2]).toEqual('   ├─ 1 nitpick');
        },
      );

      then('the tallier line closes the tally', () => {
        expect(lines[3]).toEqual(
          '   └─ tallied by reviewer@fireworks/deepseek/v4-flash',
        );
      });

      then('the singular noun is used for a count of one', () => {
        expect(lines[1]).toEqual('   ├─ 3 blockers');
        expect(lines[2]).toContain('1 nitpick');
      });
    });
  });

  given(
    '[case5] neither footer — a clean review with no tally to persist',
    () => {
      when('[t0] the footers are formatted', () => {
        const lines = formatArtifactFooters({ passage: null, tally: null });

        then(
          'no lines are emitted, so the last stream bucket stays terminal',
          () => {
            expect(lines).toEqual([]);
          },
        );
      });
    },
  );
});
