import { given, then, when } from 'test-fns';

import { formatRouteGuardReviewPeerAbsorptionAck } from './formatRouteGuardReviewPeerAbsorptionAck';

/**
 * .what = pins the ack a driver reads the instant a stance lands
 * .why = the ack is the ONE surface that teaches the sequence `concede → fix → budget →
 *        re-arrive` (S11), and the one that could quietly re-widen a top-up to every lane
 *        (S09). both are invisible to a type check — the order is a line ordinal and the
 *        scope is a flag in a string — so they are pinned here or they are pinned nowhere.
 */
describe('formatRouteGuardReviewPeerAbsorptionAck', () => {
  given('[case1] a CONCEDE on a lane with rounds left', () => {
    when('[t0] the ack is rendered', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'mechanic',
        concern: { kind: 'blocker', ordinal: 1 },
        why: null,
        severity: null,
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 0,
        concernsElsewhere: 0,
      });

      then(
        'the meter names the rounds LEFT, so the branch is checkable',
        () => {
          expect(stdout).toContain(
            `mechanic (l1), 2 rounds, 4 budget — 2 rounds left`,
          );
        },
      );

      // 🔴 F05 — the remedy is METER-DRIVEN. rounds remain, so the budget term elides
      //    entirely; to print it here would buy a round the lane does not need
      then(
        'NO budget ask appears — the lane can confirm the fix as it stands',
        () => {
          expect(stdout).not.toContain('route.guard.budget');
        },
      );

      then('the hold is named, and the next act is the re-arrival', () => {
        expect(stdout).toContain('the hold stands. fix, then re-arrive');
        expect(stdout).toContain(
          'rhx route.stone.set --stone 5.1.execution --as passed',
        );
      });

      then('a concede cites no fulcrum — it claims no judgment', () => {
        expect(stdout).not.toContain('why   =');
      });

      then('the last-concern tail says the lane is settled', () => {
        expect(stdout).toContain(
          'about = blocker.1 — the last concern this lane owed',
        );
      });
    });

    when('[t1] concerns remain undeclared on the lane', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'mechanic',
        concern: { kind: 'nitpick', ordinal: 2 },
        why: null,
        severity: null,
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 3,
        concernsElsewhere: 0,
      });

      then('the tail counts them, so the driver knows it is not done', () => {
        expect(stdout).toContain('about = nitpick.2 — 3 more on this lane');
      });
    });
  });

  given('[case2] a CONCEDE on a lane whose budget is spent', () => {
    when('[t0] the ack is rendered', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'ergonomist',
        concern: { kind: 'blocker', ordinal: 1 },
        why: null,
        severity: null,
        meter: { level: 1, rounds: 4, budget: 4 },
        concernsLeft: 0,
        concernsElsewhere: 0,
      });

      then('the meter says the budget is spent', () => {
        expect(stdout).toContain(
          `ergonomist (l1), 4 rounds, 4 budget — budget spent`,
        );
      });

      // 🔴 S11 — the wisher ruled the ORDER: "concede is to fix and run again … they want
      //    to ask for more budget AFTER hteir fixes". a grant led with sits unspent through
      //    the repair, and the meter then reads a round that may never be taken
      // ⚠️ the offsets are CHARACTER offsets over the whole body, never line ordinals. the
      //    two phrases share one line, so a line-ordinal compare reads them as equal and
      //    passes under an inversion — measured: it did (`rule.require.clamp-edge-cases`)
      then(
        'the FIX is named before the budget — the sequence, not merely the command',
        () => {
          const atFix = stdout.indexOf('fix the');
          const atBuy = stdout.indexOf('buy the round');
          const atCmd = stdout.indexOf('route.guard.budget');
          expect(atFix).toBeGreaterThan(-1);
          expect(atBuy).toBeGreaterThan(atFix);
          expect(atCmd).toBeGreaterThan(atBuy);
        },
      );

      // 🔴 S09 — "unless a level is explicitly rewound or budgetted, it should stay|become
      //    exhausted". the bare form re-arms every lane on the stone, l1 included
      then(
        'the top-up is SCOPED to the one lane — never the bare --add',
        () => {
          expect(stdout).toContain(
            'rhx route.guard.budget --for review --add 2 --peer ergonomist --stone 5.1.execution',
          );
        },
      );

      // 🔴 rule.always.spend-own-levers-before-escalation — "two remedies rendered side by
      //    side with no owner column read as two human remedies". after a stance the driver
      //    has already declared its judgment, so the human remedy has no subject
      then(
        "NO human is named — the block narrows to the driver's own lever",
        () => {
          expect(stdout).not.toContain('a human must grant');
          expect(stdout).not.toContain('--as approved');
          expect(stdout).not.toContain('--as overruled');
        },
      );
    });

    when('[t1] the conceded concern is a NITPICK', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'ergonomist',
        concern: { kind: 'nitpick', ordinal: 4 },
        why: null,
        severity: null,
        meter: { level: 2, rounds: 3, budget: 3 },
        concernsLeft: 0,
        concernsElsewhere: 0,
      });

      then(
        'the noun follows the concern — never a hard-coded "blocker"',
        () => {
          expect(stdout).toContain('fix the nitpick');
          expect(stdout).not.toContain('fix the blocker');
        },
      );
    });
  });

  given('[case3] a DISPUTE', () => {
    const stdout = formatRouteGuardReviewPeerAbsorptionAck({
      absorption: 'disputed',
      stone: '5.1.execution',
      slug: 'architect',
      concern: { kind: 'blocker', ordinal: 1 },
      why: '.fulcrums/inventory.of=fulcrums.case=F007-file-placement.md',
      severity: null,
      meter: { level: 1, rounds: 2, budget: 4 },
      concernsLeft: 0,
      concernsElsewhere: 0,
    });

    when('[t0] the ack is rendered', () => {
      then('it cites the fulcrum the council will read', () => {
        expect(stdout).toContain(
          'why   = .fulcrums/inventory.of=fulcrums.case=F007-file-placement.md',
        );
      });

      then('the road advances — the concern left the tally', () => {
        expect(stdout).toContain('the council will read it');
        expect(stdout).toContain('drive on');
        expect(stdout).toContain(
          'rhx route.stone.set --stone 5.1.execution --as passed',
        );
      });

      // 🔴 case=1 [t4b] — a disputed lane will not run again this generation, so a top-up
      //    buys it naught. to print one would sell a round that cannot be spent
      then('NO top-up is offered, though rounds remain', () => {
        expect(stdout).not.toContain('route.guard.budget');
      });
    });

    when('[t1] the disputed lane has spent its budget', () => {
      const stdoutSpent = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'disputed',
        stone: '5.1.execution',
        slug: 'architect',
        concern: { kind: 'blocker', ordinal: 1 },
        why: '.fulcrums/inventory.of=fulcrums.case=F007-file-placement.md',
        severity: null,
        meter: { level: 1, rounds: 4, budget: 4 },
        concernsLeft: 0,
        concernsElsewhere: 0,
      });

      // the meter branch is the CONCEDE's alone — a dispute reads the same on both sides,
      // because what it does to the road does not depend on rounds at all
      then('the ack is unchanged but for the meter line', () => {
        expect(stdoutSpent).toContain('the council will read it');
        expect(stdoutSpent).toContain('drive on');
        expect(stdoutSpent).not.toContain('route.guard.budget');
      });
    });

    // r10 b5 — the ack named the concerns still owed, then told the driver to
    // `--as passed` anyway, which halts at the absorb gate the ack just predicted.
    // a "drive on" is owed ONLY once the stone owes no absorption at all
    when('[t2] concerns remain on THIS lane', () => {
      const stdoutOwed = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'disputed',
        stone: '5.1.execution',
        slug: 'architect',
        concern: { kind: 'blocker', ordinal: 1 },
        why: '.fulcrums/inventory.of=fulcrums.case=F007-file-placement.md',
        severity: null,
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 2,
        concernsElsewhere: 0,
      });

      then('it names what is still owed, never a passage command', () => {
        expect(stdoutOwed).toContain('2 concerns still owed, then drive on');
        expect(stdoutOwed).not.toContain('--as passed');
      });
    });

    when('[t3] this lane is clear but OTHER lanes still owe', () => {
      const stdoutElsewhere = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'disputed',
        stone: '5.1.execution',
        slug: 'architect',
        concern: { kind: 'blocker', ordinal: 1 },
        why: '.fulcrums/inventory.of=fulcrums.case=F007-file-placement.md',
        severity: null,
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 0,
        concernsElsewhere: 3,
      });

      then('the "also" line and the close agree — no contradiction', () => {
        expect(stdoutElsewhere).toContain(
          '3 concerns on other lanes await absorption',
        );
        expect(stdoutElsewhere).toContain(
          '3 concerns still owed, then drive on',
        );
        expect(stdoutElsewhere).not.toContain('--as passed');
      });
    });

    when('[t4] exactly one concern is owed', () => {
      const stdoutOne = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'disputed',
        stone: '5.1.execution',
        slug: 'architect',
        concern: { kind: 'blocker', ordinal: 1 },
        why: '.fulcrums/inventory.of=fulcrums.case=F007-file-placement.md',
        severity: null,
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 1,
        concernsElsewhere: 0,
      });

      then('the noun is singular — never a hard-coded plural', () => {
        expect(stdoutOne).toContain('1 concern still owed, then drive on');
      });
    });
  });

  given('[case4] the rendered body, whole', () => {
    when('[t0] a concede lands on a spent lane', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'ergonomist',
        concern: { kind: 'blocker', ordinal: 1 },
        why: null,
        severity: null,
        meter: { level: 1, rounds: 4, budget: 4 },
        concernsLeft: 0,
        concernsElsewhere: 0,
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t1] a dispute lands', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'disputed',
        stone: '5.1.execution',
        slug: 'architect',
        concern: { kind: 'blocker', ordinal: 1 },
        why: '.fulcrums/inventory.of=fulcrums.case=F007-file-placement.md',
        severity: null,
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 2,
        concernsElsewhere: 0,
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  // 🔴 r9 n2 — a lane that clears its LAST concern reads as an all-clear, and a driver with a
  //    second lane still owed can take that for "the stance phase is done". the tail names the
  //    road ahead so the lane's all-clear is not read as the stone's.
  given('[case5] the lane is clear but the stone is not', () => {
    when('[t0] this lane owes naught, but other lanes do', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'mechanic',
        concern: { kind: 'blocker', ordinal: 1 },
        why: null,
        severity: null,
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 0,
        concernsElsewhere: 3,
      });

      // this line exists ONLY under the r9 n2 branch — it goes red if the branch is removed
      then('the tail names the concerns still owed elsewhere', () => {
        expect(stdout).toContain('3 concerns on other lanes await absorption');
      });

      then('the last-concern tail still marks THIS lane settled', () => {
        expect(stdout).toContain(
          'about = blocker.1 — the last concern this lane owed',
        );
      });
    });

    when('[t1] exactly one concern remains elsewhere', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'mechanic',
        concern: { kind: 'blocker', ordinal: 1 },
        why: null,
        severity: null,
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 0,
        concernsElsewhere: 1,
      });

      then('the noun is singular — never a hard-coded plural', () => {
        expect(stdout).toContain('1 concern on other lanes await absorption');
        expect(stdout).not.toContain('1 concerns on other lanes');
      });
    });

    when('[t2] THIS lane still owes concerns', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'mechanic',
        concern: { kind: 'blocker', ordinal: 1 },
        why: null,
        severity: null,
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 2,
        concernsElsewhere: 3,
      });

      // the tail already says "2 more on this lane" — to also name other lanes would double
      // the count and confuse an unsettled lane for a settled one. the guard is concernsLeft===0
      then('the other-lanes line is withheld until THIS lane is clear', () => {
        expect(stdout).not.toContain('on other lanes await absorption');
        expect(stdout).toContain('about = blocker.1 — 2 more on this lane');
      });
    });

    when('[t3] the whole stone is clear', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'mechanic',
        concern: { kind: 'blocker', ordinal: 1 },
        why: null,
        severity: null,
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 0,
        concernsElsewhere: 0,
      });

      then('no other-lanes line appears — the all-clear is true', () => {
        expect(stdout).not.toContain('on other lanes await absorption');
      });
    });
  });

  // 🔴 S14 — a concede carries a graded harm. only an URGENT one warns a human, and the warn is
  //    the ONLY visible difference between the two grades. it is a lone line in a string, so it
  //    is pinned here or it drifts unseen (rule.require.clamp-edge-cases).
  given('[case6] a concede carries a severity grade', () => {
    when('[t0] the grade is URGENT', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'mechanic',
        concern: { kind: 'blocker', ordinal: 1 },
        why: null,
        severity: 'urgent',
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 0,
        concernsElsewhere: 0,
      });

      then('the ack warns a human owes a round at the close', () => {
        expect(stdout).toContain(
          'grade = urgent — ships harm; a human is warned to grant a round at the close',
        );
      });
    });

    when('[t1] the grade is BETTER', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'mechanic',
        concern: { kind: 'blocker', ordinal: 1 },
        why: null,
        severity: 'better',
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 0,
        concernsElsewhere: 0,
      });

      // 🔴 a better concession must NEVER earn a round — S14: "shouldnt weight us down". so the
      //    urgent warn is withheld, and no human is named on a better concede
      then('no urgent warn appears — a better concede adds no weight', () => {
        expect(stdout).not.toContain('grade = urgent');
        expect(stdout).not.toContain('a human is warned');
      });
    });

    when('[t2] a DISPUTE never carries a grade', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'disputed',
        stone: '5.1.execution',
        slug: 'architect',
        concern: { kind: 'blocker', ordinal: 1 },
        why: '.fulcrums/inventory.of=fulcrums.case=F007-file-placement.md',
        severity: null,
        meter: { level: 1, rounds: 2, budget: 4 },
        concernsLeft: 0,
        concernsElsewhere: 0,
      });

      then(
        'no grade line appears — severity is the concede taxonomy alone',
        () => {
          expect(stdout).not.toContain('grade =');
        },
      );
    });
  });

  // 🔴 the clamp for behavior-intent r010 blocker.1 — an unlimited budget never spends down, so
  //    the meter tail must read '∞ rounds left' and the budget cell '∞', never a subtraction of
  //    Infinity ('-Infinity' / 'Infinity rounds left'). the ack is the first surface a driver
  //    reads the instant a stance lands on an unlimited lane, and every finite-budget case above
  //    leaves this branch unpinned — so the guard ships untested unless this case bites.
  given('[case7] a stance lands on a lane with an UNLIMITED budget', () => {
    when('[t0] a concede on an ∞-budget lane', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'conceded',
        stone: '5.1.execution',
        slug: 'mechanic',
        concern: { kind: 'blocker', ordinal: 1 },
        why: null,
        severity: null,
        meter: { level: 1, rounds: 2, budget: Infinity },
        concernsLeft: 0,
        concernsElsewhere: 0,
      });

      then(
        'the tail reads ∞ rounds left, never a subtraction of Infinity',
        () => {
          expect(stdout).toContain('∞ rounds left');
          expect(stdout).not.toContain('Infinity rounds left');
          expect(stdout).not.toContain('-Infinity');
          expect(stdout).not.toContain('NaN');
        },
      );

      then('the budget cell reads ∞, never the literal Infinity', () => {
        expect(stdout).toContain('∞ budget');
        expect(stdout).not.toContain('Infinity budget');
      });

      // an ∞ budget is never spent, so the concede stays on the rounds-remain branch —
      // no top-up is bought for a lane that cannot exhaust
      then('the lane can confirm the fix as it stands — no top-up', () => {
        expect(stdout).toContain('the hold stands. fix, then re-arrive');
        expect(stdout).not.toContain('route.guard.budget');
      });
    });

    when('[t1] a dispute on an ∞-budget lane', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck({
        absorption: 'disputed',
        stone: '5.1.execution',
        slug: 'architect',
        concern: { kind: 'blocker', ordinal: 1 },
        why: '.fulcrums/inventory.of=fulcrums.case=F007-file-placement.md',
        severity: null,
        meter: { level: 1, rounds: 2, budget: Infinity },
        concernsLeft: 0,
        concernsElsewhere: 0,
      });

      then('the meter still reads ∞ on the dispute branch', () => {
        expect(stdout).toContain('∞ budget');
        expect(stdout).toContain('∞ rounds left');
        expect(stdout).not.toContain('Infinity');
      });
    });
  });
});
