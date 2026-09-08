import { given, then, when } from 'test-fns';

import {
  computeBlockRemedyGroups,
  formatBlockRemedyGroups,
} from './formatBlockRemedyGroups';

/**
 * .what = pins the remedy contract four halt surfaces now share
 * .why = the four surfaces used to derive these remedies independently, under comments that
 *        promised they stayed in lockstep. that promise had already broken on ORDER, and no test
 *        at any grain would have caught it — `formatRouteDriveMixedHalt` and
 *        `formatRouteDriveBudgetExhausted` carried zero coverage of their own, and the extant
 *        `formatGuardTree` snapshots pin no mixed halt. so the shared operation is pinned here at
 *        unit grain, where the owner-sort and the two unchanged branches are each checkable
 *        without a credential (`rule.require.test-coverage-by-grain` — a transformer owes a unit
 *        test).
 */
describe('computeBlockRemedyGroups', () => {
  given(
    '[case1] a MIXED halt — a malfunction beside an exhausted level',
    () => {
      when('[t0] the remedies are computed', () => {
        const groups = computeBlockRemedyGroups({
          stone: '1.vision',
          passage: 'malfunction',
          reason:
            'reviewer or judge malfunctioned; peer reviewer budget exhausted: mech-rules',
        });

        then('every gate is offered — neither remedy is hidden', () => {
          expect(groups).toHaveLength(3);
        });

        // 🔴 this is the assertion that would have caught the drift. before the extraction,
        //    `formatGuardTree` rendered overrule → budget → approve, which interleaves the owners
        //    (human, driver, human), and `formatRouteDriveMixedHalt` rendered budget first. one
        //    list, two orders. `rule.always.spend-own-levers-before-escalation` settles it:
        //    "sort by owner and spend yours first."
        then("the order is BY OWNER — the driver's own lever leads", () => {
          expect(groups.map((group) => group.label)).toEqual([
            'increase budget — yours to spend',
            'overrule the malfunction — a human must grant',
            'approve as-is — a human must grant',
          ]);
        });

        then(
          'each label names its owner, so no remedy reads as the wrong kind',
          () => {
            expect(groups[0]!.label).toContain('yours to spend');
            expect(groups[1]!.label).toContain('a human must grant');
            expect(groups[2]!.label).toContain('a human must grant');
          },
        );
      });
    },
  );

  given('[case2] a budget-only halt', () => {
    when('[t0] one reviewer is named as exhausted', () => {
      const groups = computeBlockRemedyGroups({
        stone: '5.3.verification',
        passage: 'blocked',
        reason: 'peer reviewer budget exhausted: mech-given-when-then',
      });

      then(
        'the branch is unchanged by the extraction — budget, then approve',
        () => {
          expect(groups.map((group) => group.label)).toEqual([
            'increase budget — yours to spend',
            'approve as-is — a human must grant',
          ]);
        },
      );

      then('a lone slug is named with --peer', () => {
        expect(groups[0]!.cmd).toEqual(
          'rhx route.guard.budget --for review --add N --peer mech-given-when-then --stone 5.3.verification',
        );
      });

      then('the approval command carries the stone', () => {
        expect(groups[1]!.cmd).toEqual(
          'rhx route.stone.set --stone 5.3.verification --as approved',
        );
      });
    });

    when('[t1] SEVERAL reviewers are named as exhausted', () => {
      const groups = computeBlockRemedyGroups({
        stone: '5.3.verification',
        passage: 'blocked',
        reason: 'peer reviewer budget exhausted: r-one, r-two, r-three',
      });

      // a top-up with no --peer extends every reviewer on the stone at once, which is what a
      // multi-slug exhaustion wants; to name one of three would under-serve the halt.
      then('no --peer is emitted — the top-up covers them all', () => {
        expect(groups[0]!.cmd).toEqual(
          'rhx route.guard.budget --for review --add N --stone 5.3.verification',
        );
      });
    });

    when('[t2] NO slug suffix follows the halt text', () => {
      const groups = computeBlockRemedyGroups({
        stone: '5.3.verification',
        passage: 'blocked',
        reason: 'peer reviewer budget exhausted',
      });

      // ⚠️ this is the shape `formatRouteDriveBudgetExhausted` falls back to when its caller
      //    passes `reason: null`. the parse yields no slug, so --peer is omitted — matching what
      //    the hand-rolled code did with a null reason.
      then('the remedies still render, with no --peer', () => {
        expect(groups.map((group) => group.label)).toEqual([
          'increase budget — yours to spend',
          'approve as-is — a human must grant',
        ]);
        expect(groups[0]!.cmd).not.toContain('--peer');
      });
    });
  });

  given('[case3] an overrule-only halt', () => {
    when('[t0] the passage is a malfunction', () => {
      const groups = computeBlockRemedyGroups({
        stone: '1.vision',
        passage: 'malfunction',
        reason: 'reviewer or judge malfunctioned',
      });

      then(
        'the branch is unchanged by the extraction — overrule, then the prose tail',
        () => {
          expect(groups.map((group) => group.label)).toEqual([
            'overrule the malfunction — a human must grant',
            'or fix the reviewer, then retry',
          ]);
        },
      );

      then('no budget remedy is offered — none applies', () => {
        expect(groups.map((group) => group.label).join('\n')).not.toContain(
          'budget',
        );
      });

      then('the prose tail carries no command — it names no one act', () => {
        expect(groups[1]!.cmd).toEqual(null);
      });
    });

    when('[t1] the passage is blocked by a constraint', () => {
      const groups = computeBlockRemedyGroups({
        stone: '1.vision',
        passage: 'blocked',
        reason: 'a reviewer hit a constraint',
      });

      then(
        'the noun follows the passage — constraint, never malfunction',
        () => {
          expect(groups[0]!.label).toEqual(
            'overrule the constraint — a human must grant',
          );
        },
      );
    });
  });

  given('[case4] a halt that earns no remedy at all', () => {
    when(
      '[t0] the reason names neither exhaustion nor a terminal failure',
      () => {
        const groups = computeBlockRemedyGroups({
          stone: '1.vision',
          passage: 'blocked',
          reason: 'peer review found blockers',
        });

        then('no remedy is offered', () => {
          expect(groups).toEqual([]);
        });
      },
    );

    when('[t1] the stone was allowed through', () => {
      const groups = computeBlockRemedyGroups({
        stone: '1.vision',
        passage: 'allowed',
        reason: '',
      });

      then('no remedy is offered', () => {
        expect(groups).toEqual([]);
      });
    });
  });
});

describe('formatBlockRemedyGroups', () => {
  const groupsExample = [
    { label: 'increase budget — yours to spend', cmd: 'rhx budget --add N' },
    {
      label: 'approve as-is — a human must grant',
      cmd: 'rhx set --as approved',
    },
  ];

  given("[case1] several groups, rendered beneath a caller's branch", () => {
    when('[t0] rendered with no spacers', () => {
      const lines = formatBlockRemedyGroups({
        groups: groupsExample,
        baseIndent: '      ',
      });

      then("every line hangs off the caller's indent", () => {
        expect(lines.every((line) => line.startsWith('      '))).toEqual(true);
      });

      then('the last group closes the branch; the rest continue it', () => {
        expect(lines[0]!).toEqual('      ├─ increase budget — yours to spend');
        expect(lines[2]!).toEqual(
          '      └─ approve as-is — a human must grant',
        );
      });

      then('each command indents under its own label', () => {
        expect(lines[1]!).toEqual('      │  └─ rhx budget --add N');
        expect(lines[3]!).toEqual('         └─ rhx set --as approved');
      });

      then('no blank connector is emitted', () => {
        expect(lines.some((line) => line.trim() === '│')).toEqual(false);
      });
    });

    when('[t1] rendered WITH spacers', () => {
      const lines = formatBlockRemedyGroups({
        groups: groupsExample,
        baseIndent: '      ',
        spacers: true,
      });

      // the two route.drive halt surfaces breathe between groups; the two guard surfaces do not.
      then(
        'a bare connector breathes between groups, and none trails the last',
        () => {
          expect(lines.filter((line) => line.trim() === '│')).toHaveLength(1);
          expect(lines[lines.length - 1]!.trim()).not.toEqual('│');
        },
      );
    });
  });

  given('[case2] a group with no command — the prose tail', () => {
    when('[t0] rendered', () => {
      const lines = formatBlockRemedyGroups({
        groups: [
          {
            label: 'overrule the malfunction — a human must grant',
            cmd: 'rhx set --as overruled',
          },
          { label: 'or fix the reviewer, then retry', cmd: null },
        ],
        baseIndent: '   ',
      });

      then('the tail renders its label and no command line beneath it', () => {
        expect(lines).toEqual([
          '   ├─ overrule the malfunction — a human must grant',
          '   │  └─ rhx set --as overruled',
          '   └─ or fix the reviewer, then retry',
        ]);
      });
    });
  });

  given('[case3] no group at all', () => {
    when('[t0] rendered', () => {
      const lines = formatBlockRemedyGroups({ groups: [], baseIndent: '   ' });

      // ⚠️ callers push a header line before this and test `groups.length > 0` themselves, so an
      //    empty render must contribute no line rather than a stray connector.
      then('no line is emitted', () => {
        expect(lines).toEqual([]);
      });
    });
  });
});
