import { given, then, when } from 'test-fns';

import type { GuardUpgradeResult } from '@src/domain.operations/route/guard/upgrade/GuardUpgradeResult';

import { formatGuardUpgradeTree } from './formatGuardUpgradeTree';

const asResult = (over: Partial<GuardUpgradeResult>): GuardUpgradeResult => ({
  guardName: 'x.guard',
  guardPath: '/repo/.behavior/x/x.guard',
  decision: { decision: 'skipped' },
  from: null,
  next: null,
  diff: [],
  warnings: [],
  ...over,
});

describe('formatGuardUpgradeTree', () => {
  given('[case1] a plan with an upgrade, a kept, and a skip', () => {
    const results: GuardUpgradeResult[] = [
      asResult({
        guardName: '5.1.execution.guard',
        decision: { decision: 'upgrade' },
        from: 'templates/5.1.execution.guard',
        diff: [
          { kind: 'context', text: 'artifacts:' },
          { kind: 'remove', text: 'old line' },
          { kind: 'add', text: 'new line' },
        ],
      }),
      asResult({
        guardName: '2.kept.guard',
        decision: { decision: 'kept' },
        from: 'templates/2.kept.guard',
      }),
      asResult({
        guardName: '1.vision.guard',
        decision: { decision: 'skipped' },
      }),
    ];

    when('[t0] rendered in plan mode', () => {
      then('shows the upgrade-available decision + the diff body', () => {
        const out = formatGuardUpgradeTree({
          results,
          route: '.behavior/x',
          mode: 'plan',
        });
        expect(out).toContain('upgrade available');
        expect(out).toContain('- old line');
        expect(out).toContain('+ new line');
      });

      then('shows the kept + skipped decisions and the from= line', () => {
        const out = formatGuardUpgradeTree({
          results,
          route: '.behavior/x',
          mode: 'plan',
        });
        expect(out).toContain('kept, no change');
        expect(out).toContain('skipped, no provenance');
        expect(out).toContain('from = templates/2.kept.guard');
      });

      then(
        'draws the diff as a clean last-child bucket (no orphan bar)',
        () => {
          const out = formatGuardUpgradeTree({
            results,
            route: '.behavior/x',
            mode: 'plan',
          });
          // the diff is the guard's LAST child, so the bucket hangs off `└─ diff`
          // with a bar-free continuation column beneath it (`   │     ` not `   │     │`)
          expect(out).toContain(
            [
              '   │  └─ diff',
              '   │     ├─',
              '   │     │',
              '   │     │  - old line',
              '   │     │  + new line',
              '   │     │',
              '   │     └─',
            ].join('\n'),
          );
          // reject the prior mis-nested shape: an orphan bar under the `└─ diff` label
          expect(out).not.toContain('   │     │  ├─');
        },
      );

      then('shows the owl header, rollup, and to-apply hint', () => {
        const out = formatGuardUpgradeTree({
          results,
          route: '.behavior/x',
          mode: 'plan',
        });
        expect(out).toContain('the way reveals itself');
        // plan mode: upgrades read "available" (none written yet), not "upgraded"
        expect(out).toContain('summary = 1 available, 1 kept, 1 skipped');
        expect(out).toContain('to apply: rhx route.guard.upgrade --mode apply');
      });

      then('matches snapshot', () => {
        expect(
          formatGuardUpgradeTree({
            results,
            route: '.behavior/x',
            mode: 'plan',
          }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] rendered in apply mode', () => {
      then('shows the upgraded decision and the so-it-is header', () => {
        const out = formatGuardUpgradeTree({
          results,
          route: '.behavior/x',
          mode: 'apply',
        });
        expect(out).toContain('so it is');
        expect(out).toContain('upgraded, by provenance');
      });

      then('does NOT show the to-apply hint', () => {
        const out = formatGuardUpgradeTree({
          results,
          route: '.behavior/x',
          mode: 'apply',
        });
        expect(out).not.toContain('to apply:');
      });

      then('matches snapshot', () => {
        expect(
          formatGuardUpgradeTree({
            results,
            route: '.behavior/x',
            mode: 'apply',
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given(
    '[case2] the non-happy decisions (absent, invalid, unknown-var)',
    () => {
      const results: GuardUpgradeResult[] = [
        asResult({
          guardName: '9.broken.guard',
          decision: { decision: 'absent-source' },
        }),
        asResult({
          guardName: '6.invalidsource.guard',
          decision: { decision: 'invalid-source' },
        }),
        asResult({
          guardName: '4.unknownvar.guard',
          decision: { decision: 'unknown-var', vars: ['$FOO'] },
        }),
      ];

      when('[t0] rendered in plan mode', () => {
        then('shows each non-happy row and names the unknown var', () => {
          const out = formatGuardUpgradeTree({
            results,
            route: '.behavior/x',
            mode: 'plan',
          });
          expect(out).toContain('absent source');
          expect(out).toContain('invalid source');
          expect(out).toContain('unknown var: $FOO');
        });

        then('matches snapshot', () => {
          expect(
            formatGuardUpgradeTree({
              results,
              route: '.behavior/x',
              mode: 'plan',
            }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given('[case3] a warn annotation on a guard', () => {
    const results: GuardUpgradeResult[] = [
      asResult({
        guardName: '7.budgetgrant.guard',
        decision: { decision: 'upgrade' },
        from: 'templates/7.budgetgrant.guard',
        diff: [{ kind: 'remove', text: '      budget: 5' }],
        warnings: [
          {
            type: 'budget-clobber',
            slug: '7.budgetgrant',
            before: 5,
            after: 3,
          },
        ],
      }),
    ];

    when('[t0] rendered in plan mode', () => {
      then('surfaces the warn line', () => {
        const out = formatGuardUpgradeTree({
          results,
          route: '.behavior/x',
          mode: 'plan',
        });
        expect(out).toContain(
          '⚠ this upgrade reverts a budget grant on 7.budgetgrant',
        );
      });

      then('matches snapshot', () => {
        expect(
          formatGuardUpgradeTree({
            results,
            route: '.behavior/x',
            mode: 'plan',
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case4] an empty route (no guard files)', () => {
    when('[t0] rendered in plan mode', () => {
      then('renders a benign no-guards summary', () => {
        const out = formatGuardUpgradeTree({
          results: [],
          route: '.behavior/x',
          mode: 'plan',
        });
        expect(out).toContain('summary = no guards');
        expect(out).not.toContain('to apply:');
      });

      then('matches snapshot', () => {
        expect(
          formatGuardUpgradeTree({
            results: [],
            route: '.behavior/x',
            mode: 'plan',
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case5] passage-state advisories (already-passed + approved)', () => {
    // exercises BOTH passage-state warn render paths (already-passed AND
    // approved-not-passed) so no asWarningText branch is dead (r9 blocker)
    const results: GuardUpgradeResult[] = [
      asResult({
        guardName: '5.1.execution.guard',
        decision: { decision: 'upgrade' },
        from: 'templates/5.1.execution.guard',
        diff: [{ kind: 'remove', text: 'old line' }],
        warnings: [{ type: 'already-passed', stone: '5.1.execution' }],
      }),
      asResult({
        guardName: '5.2.review.guard',
        decision: { decision: 'upgrade' },
        from: 'templates/5.2.review.guard',
        diff: [{ kind: 'remove', text: 'old line' }],
        warnings: [{ type: 'approved-not-passed', stone: '5.2.review' }],
      }),
    ];

    when('[t0] rendered in plan mode', () => {
      then('surfaces the already-passed advisory prose', () => {
        const out = formatGuardUpgradeTree({
          results,
          route: '.behavior/x',
          mode: 'plan',
        });
        expect(out).toContain(
          '⚠ stone 5.1.execution already passed under the prior guard',
        );
      });

      then('surfaces the approved-not-passed advisory prose', () => {
        const out = formatGuardUpgradeTree({
          results,
          route: '.behavior/x',
          mode: 'plan',
        });
        expect(out).toContain(
          '⚠ stone 5.2.review is approved but not yet passed',
        );
      });

      then('matches snapshot', () => {
        expect(
          formatGuardUpgradeTree({
            results,
            route: '.behavior/x',
            mode: 'plan',
          }),
        ).toMatchSnapshot();
      });
    });
  });
});
