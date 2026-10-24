import { given, then, when } from 'test-fns';

import { asRouteStoneSetCommandHead } from '../review/peer/asRouteStoneSetCommandHead';
import {
  computeBlockRemedyGroups,
  formatBlockRemedyGroups,
} from './formatBlockRemedyGroups';

/**
 * .what = pins the remedy contract four halt surfaces now share
 * .why = the four surfaces call one shared operation for these remedies, so they cannot drift
 *        apart on order or content. `formatRouteDriveMixedHalt` and
 *        `formatRouteDriveBudgetExhausted` carry zero coverage of their own, and the extant
 *        `formatGuardTree` snapshots pin no mixed halt — so the shared operation is pinned here
 *        at unit grain, where the owner-sort and the two unchanged branches are each checkable
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
          lever: null,
        });

        then('every gate is offered — neither remedy is hidden', () => {
          expect(groups).toHaveLength(3);
        });

        // 🔴 this is the assertion that would have caught the drift. before the extraction,
        //    `formatGuardTree` rendered overrule → budget → approve, which interleaves the owners
        //    (human, driver, human), and `formatRouteDriveMixedHalt` rendered budget first. one
        //    list, two orders. `rule.always.spend-own-levers-before-escalation` settles it:
        //    "sort by owner and spend yours first."
        // 🔴 slot 1 holds CONVERGE, not the top-up. this reason carries no concession mark, so
        //    no warrant stands and `route.guard.budget` would refuse the grant — a halt that
        //    printed the command anyway would advertise a refusal. the driver's lever at an
        //    un-conceded exhaustion is the answer itself (`rule.always.converge-to-terminal`)
        then("the order is BY OWNER — the driver's own lever leads", () => {
          expect(groups.map((group) => group.label)).toEqual([
            'converge with the reviewer — yours to run',
            'overrule the malfunction — a human must grant',
            'approve as-is — a human must grant',
          ]);
        });

        then(
          'each label names its owner, so no remedy reads as the wrong kind',
          () => {
            expect(groups[0]!.label).toContain('yours to run');
            expect(groups[1]!.label).toContain('a human must grant');
            expect(groups[2]!.label).toContain('a human must grant');
          },
        );

        then('the converge command names the exhausted lane', () => {
          expect(groups[0]!.cmd).toEqual(
            'rhx route.stone.set --stone 1.vision --as absorbed --that mech-rules',
          );
        });

        // the `route.stone.set` head has one home; both human remedies compose it, so a change
        // to the head (a path form, a flag order) lands on these commands too (i014 r003 b1)
        then('both human remedies compose the one route.stone.set head', () => {
          const head = asRouteStoneSetCommandHead({ stone: '1.vision' });
          expect(groups[1]!.cmd).toEqual(`${head} --as overruled`);
          expect(groups[2]!.cmd).toEqual(`${head} --as approved`);
        });
      });

      // the ORDER claim above is the one this case exists for, so it is pinned on both halt
      // kinds — a driver-owned slot that holds a different command must still hold the same slot
      when('[t1] the same mixed halt carries an URGENT concession', () => {
        const groups = computeBlockRemedyGroups({
          stone: '1.vision',
          passage: 'malfunction',
          reason:
            'reviewer or judge malfunctioned; an urgent concession earned a round; peer reviewer budget exhausted: mech-rules',
          lever: null,
        });

        then('the order is unchanged, and slot 1 is the top-up', () => {
          expect(groups.map((group) => group.label)).toEqual([
            'increase budget — yours to spend',
            'overrule the malfunction — a human must grant',
            'approve as-is — a human must grant',
          ]);
        });
      });
    },
  );

  /**
   * .what = the budget-only halt that STILL earns a top-up
   * .why = the top-up's shape — its `--peer` rule, its multi-slug rule, its null-reason fallback —
   *        is unchanged, and it is pinned here on the one halt kind that still offers it. the
   *        urgent mark is now part of each fixture rather than an added case, because the shape
   *        and the warrant are inseparable: there is no halt where a top-up renders without one.
   */
  given('[case2] a budget-only halt with an URGENT concession', () => {
    when('[t0] one reviewer is named as exhausted', () => {
      const groups = computeBlockRemedyGroups({
        stone: '5.3.verification',
        passage: 'blocked',
        reason:
          'an urgent concession earned a round; peer reviewer budget exhausted: mech-given-when-then',
        lever: null,
      });

      // 🔴 the approve tail STANDS beside the top-up, and that is the severity split: an urgent
      //    concession ships nameable harm, so it earns a human's glance as well as the round
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
        reason:
          'an urgent concession earned a round; peer reviewer budget exhausted: r-one, r-two, r-three',
        lever: null,
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
        reason:
          'an urgent concession earned a round; peer reviewer budget exhausted',
        lever: null,
      });

      // 🟡 this is the shape `formatRouteDriveBudgetExhausted` falls back to when its caller
      //    passes `reason: null`. the parse yields no slug, so --peer is omitted, which is what
      //    the hand-rolled code did with a null reason.
      then('the remedies still render, with no --peer', () => {
        expect(groups.map((group) => group.label)).toEqual([
          'increase budget — yours to spend',
          'approve as-is — a human must grant',
        ]);
        expect(groups[0]!.cmd).not.toContain('--peer');
      });
    });

    when(
      '[t3] the urgent mark names its lanes, and one of them sits below the latest level',
      () => {
        const groups = computeBlockRemedyGroups({
          stone: '1.vision',
          passage: 'blocked',
          reason:
            'an urgent concession earned a round (intent); peer reviewer budget exhausted: intent, friction',
          lever: null,
        });

        // 🔴 a bare `--add` lands on the latest level alone, so with intent at l1 it would pad
        //    friction and leave the urgent lane spent. the urgent lane is named, never the set
        then(
          'the top-up names the urgent lane with --peer, and only it',
          () => {
            expect(groups[0]!.cmd).toEqual([
              'rhx route.guard.budget --for review --add N --peer intent --stone 1.vision',
            ]);
          },
        );
      },
    );

    when('[t4] the urgent mark names two lanes', () => {
      const groups = computeBlockRemedyGroups({
        stone: '1.vision',
        passage: 'blocked',
        reason:
          'an urgent concession earned a round (intent, friction); peer reviewer budget exhausted: intent, friction',
        lever: null,
      });

      then('one --peer command per urgent lane, in the mark order', () => {
        expect(groups[0]!.cmd).toEqual([
          'rhx route.guard.budget --for review --add N --peer intent --stone 1.vision',
          'rhx route.guard.budget --for review --add N --peer friction --stone 1.vision',
        ]);
      });

      then(
        'each command renders as its own leaf, never a bare continuation',
        () => {
          const lines = formatBlockRemedyGroups({
            groups: [groups[0]!],
            baseIndent: '   ',
          });
          expect(lines).toEqual([
            '   └─ increase budget — yours to spend',
            '      ├─ rhx route.guard.budget --for review --add N --peer intent --stone 1.vision',
            '      └─ rhx route.guard.budget --for review --add N --peer friction --stone 1.vision',
          ]);
        },
      );
    });
  });

  /**
   * .what = the ordinary exhaustion — the driver conceded naught
   * .why = 🔴 the halt kind a driver meets most often, and the one that carried the defect. it
   *        printed `increase budget — yours to spend` while the gate would refuse the grant: no
   *        concession stands, so no warrant does. a halt must not hand over a command that fails.
   */
  given('[case2b] a budget-only halt with NO concession', () => {
    when('[t0] one reviewer is named as exhausted', () => {
      const groups = computeBlockRemedyGroups({
        stone: '5.3.verification',
        passage: 'blocked',
        reason: 'peer reviewer budget exhausted: mech-given-when-then',
        lever: null,
      });

      then('the top-up is NOT offered — no warrant stands', () => {
        expect(groups.map((group) => group.label).join('\n')).not.toContain(
          'increase budget',
        );
        expect(groups.map((group) => group.cmd).join('\n')).not.toContain(
          'route.guard.budget',
        );
      });

      // the debt outlives the meter, so the answer is the lever that stands
      then('converge leads, and the human tail follows it', () => {
        expect(groups.map((group) => group.label)).toEqual([
          'converge with the reviewer — yours to run',
          'approve as-is — a human must grant',
        ]);
      });

      then('a lone slug is named with --that', () => {
        expect(groups[0]!.cmd).toEqual(
          'rhx route.stone.set --stone 5.3.verification --as absorbed --that mech-given-when-then',
        );
      });
    });

    when('[t1] SEVERAL reviewers are named as exhausted', () => {
      const groups = computeBlockRemedyGroups({
        stone: '5.3.verification',
        passage: 'blocked',
        reason: 'peer reviewer budget exhausted: r-one, r-two, r-three',
        lever: null,
      });

      // ⚠️ `--as absorbed --that` takes ONE slug and there is no sweep form, so a multi-slug
      //    halt cannot name a lane — it names the shape instead, and the driver picks from the
      //    reviews section above. a guessed slug would be worse than a placeholder
      then('a placeholder stands in — no slug is guessed', () => {
        expect(groups[0]!.cmd).toEqual(
          'rhx route.stone.set --stone 5.3.verification --as absorbed --that <reviewer>',
        );
      });
    });

    when('[t2] NO slug suffix follows the halt text', () => {
      const groups = computeBlockRemedyGroups({
        stone: '5.3.verification',
        passage: 'blocked',
        reason: 'peer reviewer budget exhausted',
        lever: null,
      });

      then('the placeholder stands here too', () => {
        expect(groups[0]!.cmd).toContain('--that <reviewer>');
      });
    });
  });

  given('[case3] an overrule-only halt', () => {
    when('[t0] the passage is a malfunction', () => {
      const groups = computeBlockRemedyGroups({
        stone: '1.vision',
        passage: 'malfunction',
        reason: 'reviewer or judge malfunctioned',
        lever: null,
      });

      then(
        'the DRIVER leads — its own lever, then the human overrule, then two prose lines',
        () => {
          expect(groups.map((group) => group.label)).toEqual([
            'converge with the reviewer — yours to run, and the levels above stay unlocked',
            'overrule the malfunction — a human must grant',
            'or fix the reviewer, then retry',
            'a broken level never halts the drive — converge the level above it',
          ]);
        },
      );

      then('no budget remedy is offered — none applies', () => {
        expect(groups.map((group) => group.label).join('\n')).not.toContain(
          'budget',
        );
      });

      // 🔴 the regression clamp for S05.
      //    this branch used to open on `overrule … a human must grant`, so a malfunction-only halt
      //    offered the driver no lever at all and read as a wall — measured on this route at i004,
      //    where the driver halted while a poured level sat unconverged. slot 0 must be a lever the
      //    driver can run, with a command it can copy.
      then(
        'slot 0 is the DRIVER lever, and it carries a runnable command',
        () => {
          expect(groups[0]!.label).toContain('yours to run');
          expect(groups[0]!.cmd).toContain('--as absorbed');
        },
      );

      // ⚠️ the block's LAST word is a push rather than a permission: an overrule sat last, so the
      //    remedy list closed on an escalation. the latch says the drive goes on regardless.
      then('the last line pushes the drive on, and names no one act', () => {
        expect(groups.at(-1)!.label).toContain('never halts the drive');
        expect(groups.at(-1)!.cmd).toEqual(null);
      });

      then('the prose tail carries no command — it names no one act', () => {
        expect(groups[2]!.cmd).toEqual(null);
      });
    });

    when('[t1] the passage is blocked by a constraint', () => {
      const groups = computeBlockRemedyGroups({
        stone: '1.vision',
        passage: 'blocked',
        reason: 'a reviewer hit a constraint',
        lever: null,
      });

      then(
        'the noun follows the passage — constraint, never malfunction',
        () => {
          expect(groups.at(-1)!.label).toEqual(
            'overrule the constraint — a human must grant',
          );
        },
      );

      // 🔴 the surface read no .given, so it cannot know the refusal was an overflow. a
      //    partition cures only an overflow, so it is never offered on a guess — the driver
      //    is pointed at the .given, which names its own fix, ahead of any human
      then(
        '🔴 the driver lever leads and names no partition; the human overrule is last',
        () => {
          expect(groups.map((group) => group.label)).toEqual([
            'fix what its .given names, then re-arrive — yours to make',
            'overrule the constraint — a human must grant',
          ]);
          expect(
            groups.map((group) => group.cmd ?? '').join('\n'),
          ).not.toContain('route.guard.partition');
        },
      );
    });

    // 🔴 an unknown flag, an absent rubric, a bad glob — each is refused, and none is cured
    //    by a partition or a narrower bind. measured: every constraint halt once led with the
    //    partition template, whatever the refusal was
    when('[t1b] the refused .given was read, and was no overflow', () => {
      const groups = computeBlockRemedyGroups({
        stone: '1.vision',
        passage: 'blocked',
        reason: 'reviewer constraint',
        lever: { overflowed: false, partitions: [] },
      });

      then('🔴 it offers neither a partition nor a narrower bind', () => {
        expect(groups.map((group) => group.label)).toEqual([
          'fix what its .given names, then re-arrive — yours to make',
          'overrule the constraint — a human must grant',
        ]);
      });
    });

    when(
      '[t2] the refused .given proposed partitions — the lever it chose',
      () => {
        const groups = computeBlockRemedyGroups({
          stone: '1.vision',
          passage: 'blocked',
          reason: 'reviewer constraint',
          lever: {
            overflowed: true,
            partitions: [
              'beta=src/beta/**,.behavior/v2027_01_01.demo/**',
              'alpha=src/alpha/**,.behavior/v2027_01_01.demo/**',
            ],
          },
        });

        then(
          '🔴 the partition lever leads with the partitions the .given computed, never a template',
          () => {
            expect(groups[0]!.label).toEqual(
              'declare the partitions its .given proposes — yours to make',
            );
            expect(groups[0]!.cmd).toEqual(
              [
                'rhx route.guard.partition --for review --peer @all',
                "  --partition 'beta=src/beta/**,.behavior/v2027_01_01.demo/**'",
                "  --partition 'alpha=src/alpha/**,.behavior/v2027_01_01.demo/**'",
                '  --mode apply',
              ].join(' \\\n'),
            );
            expect(groups[0]!.cmd).not.toContain('<slug>');
          },
        );

        then(
          '🔴 each partition renders on its own line, hung under the command',
          () => {
            const lines = formatBlockRemedyGroups({
              groups,
              baseIndent: '   ',
            });
            const linesOfPartition = lines.filter((line) =>
              line.includes('--partition'),
            );
            expect(linesOfPartition).toHaveLength(2);
            expect(linesOfPartition[0]).toEqual(
              "   │       --partition 'beta=src/beta/**,.behavior/v2027_01_01.demo/**' \\",
            );
          },
        );

        then('the other lever follows as `or`, with no colon', () => {
          expect(groups[1]!.label).toEqual(
            'or narrow its bind — yours to make',
          );
        });

        then('the groups match the snapshot', () => {
          expect(
            formatBlockRemedyGroups({ groups, baseIndent: '   ' }).join('\n'),
          ).toMatchSnapshot();
        });
      },
    );

    when('[t3] the overflow proposed no partition', () => {
      const groups = computeBlockRemedyGroups({
        stone: '1.vision',
        passage: 'blocked',
        reason: 'reviewer constraint',
        lever: { overflowed: true, partitions: [] },
      });

      // an overflow that proposed no partition chose the bind (its mass was edited), so the
      // bind leads and the partition template follows as `or`
      then(
        '🔴 the bind leads, the partition template follows, the overrule is last',
        () => {
          expect(groups.map((group) => group.label)).toEqual([
            'narrow its bind — yours to make',
            'or declare partitions — yours to make',
            'overrule the constraint — a human must grant',
          ]);
          expect(groups[0]!.cmd).toContain('$route/1.vision.guard');
          expect(groups[1]!.cmd).toEqual(
            [
              'rhx route.guard.partition --for review --peer @all',
              "  --partition '<slug>=<globs>'",
              '  --mode apply',
            ].join(' \\\n'),
          );
        },
      );

      then('no group says to clear the cause and re-arrive', () => {
        expect(groups.map((group) => group.label).join('\n')).not.toContain(
          'clear the cause',
        );
      });
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
          lever: null,
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
        lever: null,
      });

      then('no remedy is offered', () => {
        expect(groups).toEqual([]);
      });
    });
  });

  given('[case6] a CONCESSION exhaustion — every skipped lane conceded', () => {
    when('[t0] the remedies are computed', () => {
      const groups = computeBlockRemedyGroups({
        stone: '5.1.execution',
        passage: 'blocked',
        reason:
          'concessions await the round that confirms them; peer reviewer budget exhausted: mech-rules',
        lever: null,
      });

      // 🔴 S12 — the driver declared the round warranted and fixed what it named, so the remedy
      //    is theirs. to print `approve as-is` here would summon a human the stance already made
      //    unnecessary. that half is unchanged
      then('one remedy only — no human is summoned', () => {
        expect(groups).toHaveLength(1);
        expect(groups[0]!.label).toContain('yours to run');
      });

      // 🔴 and the remedy is the FIX, never the top-up (F04). a `better` grade earns no round
      //    past the meter, so the lane will not re-read the fix — which is the design rather
      //    than a loss to route around. the halt that offered a top-up here offered a refusal
      then('the remedy is the fix, and the top-up is gone', () => {
        expect(groups[0]!.label).toEqual(
          'fix what you conceded — yours to run',
        );
        expect(groups[0]!.cmd).toEqual(
          'rhx route.stone.set --stone 5.1.execution --as passed',
        );
      });
    });

    when('[t1] a malfunction stands beside the concession', () => {
      const groups = computeBlockRemedyGroups({
        stone: '5.1.execution',
        passage: 'malfunction',
        reason:
          'reviewer or judge malfunctioned; concessions await the round that confirms them; peer reviewer budget exhausted: mech-rules',
        lever: null,
      });

      // a broken reviewer needs a human whatever the driver conceded — the concession
      // suppresses the APPROVAL tail only, never an overrule
      then('every remedy is offered, approve tail included', () => {
        expect(groups.map((group) => group.label)).toEqual([
          'fix what you conceded — yours to run',
          'overrule the malfunction — a human must grant',
          'approve as-is — a human must grant',
        ]);
      });
    });
  });

  given(
    '[case7] a PARTIAL concession — one skipped lane never conceded',
    () => {
      when('[t0] the halt was built without the mark', () => {
        // the builder omits the mark unless EVERY skipped lane conceded, so this surface
        // sees an ordinary exhaustion — and must render the human remedy it always did
        const groups = computeBlockRemedyGroups({
          stone: '5.1.execution',
          passage: 'blocked',
          reason: 'peer reviewer budget exhausted: mech-rules, arch-bounds',
          lever: null,
        });

        // ⇒ and the driver's slot holds CONVERGE, since an absent mark is an absent warrant.
        //   the two facts travel together by construction: the mark that suppresses the human
        //   tail is the same mark the gate reads, so a halt cannot offer a top-up it would refuse
        then('the approve tail stands — a human is still owed', () => {
          expect(groups.map((group) => group.label)).toEqual([
            'converge with the reviewer — yours to run',
            'approve as-is — a human must grant',
          ]);
        });
      });
    },
  );
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

      // 🟡 callers push a header line before this and test `groups.length > 0` themselves, so an
      //    empty render must contribute no line rather than a stray connector.
      then('no line is emitted', () => {
        expect(lines).toEqual([]);
      });
    });
  });
});
