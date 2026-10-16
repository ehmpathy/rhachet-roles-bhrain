import { given, then, when } from 'test-fns';

import { formatRouteGuardReviewPeerAbsorptionAck } from './formatRouteGuardReviewPeerAbsorptionAck';

/**
 * .what = the shared input of every case below; each case overrides only what it varies
 * .why = the ack takes ten fields and a case varies two or three. a full literal per case
 *        buries the variable under the constant, and a reader cannot see what the case tests
 */
const asInput = (
  input: Partial<Parameters<typeof formatRouteGuardReviewPeerAbsorptionAck>[0]>,
): Parameters<typeof formatRouteGuardReviewPeerAbsorptionAck>[0] => ({
  absorption: 'conceded',
  stone: '5.1.execution',
  slug: 'mechanic',
  concern: { kind: 'blocker', ordinal: 1 },
  why: null,
  severity: null,
  meter: { level: 1, rounds: 2, budget: 4 },
  concernsLeft: 0,
  concernNextOnLane: null,
  concernsElsewhere: 0,
  concernNextElsewhere: null,
  ...input,
});

const FULCRUM = '.fulcrums/inventory.of=fulcrums.case=F007-file-placement.md';

/**
 * .what = pins the ack a driver reads the instant a stance lands
 * .why = the ack is the ONE surface that teaches what to run next after a stance: the rest of
 *        the lane's stances, the lane's `--as absorbed`, the other lanes, the top-up (S11, S09),
 *        then the re-arrival. each is a command in a string, invisible to a type check — so
 *        they are pinned here or they are pinned nowhere.
 */
describe('formatRouteGuardReviewPeerAbsorptionAck', () => {
  given('[case1] a CONCEDE on a lane with rounds left', () => {
    when('[t0] the last concern on the lane, the stone otherwise clear', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(asInput({}));

      then(
        'the meter names the rounds LEFT, so the branch is checkable',
        () => {
          expect(stdout).toContain(
            `mechanic (l1), 2 rounds, 4 budget — 2 rounds left`,
          );
        },
      );

      // 🔴 F05 — the remedy is METER-DRIVEN. rounds remain, so the budget term elides
      then('NO budget ask appears', () => {
        expect(stdout).not.toContain('route.guard.budget');
      });

      then('the hold is named', () => {
        expect(stdout).toContain('the hold stands. fix, then re-arrive');
      });

      // 🔴 the dogfood defect (2026-10-06): the ack said "re-arrive" above `--as passed`, and
      //    skipped the lane's `--as absorbed`, which the gate demands once every concern has a
      //    stance. the absorb comes FIRST, then the re-arrival, as `--as arrived`
      then(
        'the next acts are absorb THIS lane, then re-arrive via --as arrived',
        () => {
          const atAbsorb = stdout.indexOf(
            'rhx route.stone.set --stone 5.1.execution --as absorbed --that mechanic',
          );
          const atArrive = stdout.indexOf(
            'rhx route.stone.set --stone 5.1.execution --as arrived',
          );
          expect(atAbsorb).toBeGreaterThan(-1);
          expect(atArrive).toBeGreaterThan(atAbsorb);
          expect(stdout).not.toContain('--as passed');
        },
      );

      then('a concede cites no fulcrum — it claims no judgment', () => {
        expect(stdout).not.toContain('why   =');
      });

      then('the last-concern tail says the lane is settled', () => {
        expect(stdout).toContain(
          'about = blocker.1 — the last concern this lane owed',
        );
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toContain('--as absorbed --that mechanic');
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t1] concerns remain undeclared on the lane', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          concern: { kind: 'nitpick', ordinal: 2 },
          concernsLeft: 3,
          concernNextOnLane: 'nitpick.3',
        }),
      );

      then('the tail counts them, so the driver knows it is not done', () => {
        expect(stdout).toContain('about = nitpick.2 — 3 more on this lane');
      });

      then('the next act is the next concern on THIS lane, by name', () => {
        expect(stdout).toContain(
          'rhx route.stone.set --stone 5.1.execution --as conceded --with mechanic --about nitpick.3 --severity better|urgent',
        );
        expect(stdout).toContain(
          'rhx route.stone.set --stone 5.1.execution --as disputed --with mechanic --about nitpick.3 --why <fulcrum-path>',
        );
      });

      // the lane cannot be absorbed while it owes a stance, and the stone cannot re-arrive
      then('neither the absorb nor the re-arrival is offered yet', () => {
        expect(stdout).not.toContain('--as absorbed');
        expect(stdout).not.toContain('--as arrived');
        expect(stdout).not.toContain('--as passed');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toContain('about = nitpick.2 — 3 more on this lane');
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case2] a CONCEDE on a lane whose budget is spent', () => {
    // 🔴 the grade is part of the fixture, and it carries weight: past a spent meter only a
    //    nameable harm buys a round, so the buy sequence these [t0] assertions pin lives on the
    //    URGENT branch alone. an ungraded fixture would render a branch that has no buy at all.
    when('[t0] the ack is rendered, on an URGENT grade', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          slug: 'ergonomist',
          severity: 'urgent',
          meter: { level: 1, rounds: 4, budget: 4 },
        }),
      );

      then('the meter says the budget is spent', () => {
        expect(stdout).toContain(
          `ergonomist (l1), 4 rounds, 4 budget — budget spent`,
        );
      });

      // 🔴 S11 — fix, then budget, then re-arrive. CHARACTER offsets over the whole body,
      //    never line ordinals (rule.require.clamp-edge-cases)
      then(
        'the FIX is named before the budget — the sequence, not merely the command',
        () => {
          const atFix = stdout.indexOf('fix the');
          const atBuy = stdout.indexOf('buy the round');
          const atCmd = stdout.indexOf('route.guard.budget');
          const atArrive = stdout.indexOf('--as arrived');
          expect(atFix).toBeGreaterThan(-1);
          expect(atBuy).toBeGreaterThan(atFix);
          expect(atCmd).toBeGreaterThan(atBuy);
          expect(atArrive).toBeGreaterThan(atCmd);
        },
      );

      // 🔴 S09 — the bare form re-arms every lane on the stone, l1 included
      then(
        'the top-up is SCOPED to the one lane — never the bare --add',
        () => {
          expect(stdout).toContain(
            'rhx route.guard.budget --for review --add 2 --peer ergonomist --stone 5.1.execution',
          );
        },
      );

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
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          slug: 'ergonomist',
          concern: { kind: 'nitpick', ordinal: 4 },
          meter: { level: 2, rounds: 3, budget: 3 },
        }),
      );

      then(
        'the noun follows the concern — never a hard-coded "blocker"',
        () => {
          expect(stdout).toContain('fix the nitpick');
          expect(stdout).not.toContain('fix the blocker');
        },
      );

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toContain('fix the nitpick');
        expect(stdout).toMatchSnapshot();
      });
    });

    // 🔴 the MEASURED defect, clamped. twice observed and twice declined by hand: an approved
    //    lane with one `better` nitpick, and a peer driver's seven `better` concessions rendered
    //    the buy three times in one halt. the budget IS the allowance for taste, so past it a
    //    `better` grade earns no round — and the command must not appear in the sequence at all.
    when('[t2] the grade is BETTER and the budget is spent', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          stone: '1.vision',
          slug: 'experience-coverage',
          concern: { kind: 'nitpick', ordinal: 1 },
          severity: 'better',
          meter: { level: 1, rounds: 3, budget: 3 },
        }),
      );

      then('NO top-up is offered — the grade earned no round', () => {
        expect(stdout).not.toContain('route.guard.budget');
        expect(stdout).not.toContain('buy the round');
      });

      then(
        'the fix and the re-arrival stand — only the purchase is gone',
        () => {
          expect(stdout).toContain('fix the nitpick, then re-arrive');
          expect(stdout).toContain(
            'rhx route.stone.set --stone 1.vision --as arrived',
          );
        },
      );
    });

    // an UNgraded stance is a row written before the severity field existed. it falls to the
    // `better` branch, which is the safe direction: an unearned round is refused rather than
    // sold. a `!== 'better'` form reads as the same intent and would fail OPEN on every legacy row
    when('[t3] the grade is ABSENT and the budget is spent', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          stone: '1.vision',
          slug: 'experience-coverage',
          concern: { kind: 'nitpick', ordinal: 1 },
          severity: null,
          meter: { level: 1, rounds: 3, budget: 3 },
        }),
      );

      then('it fails closed — no top-up', () => {
        expect(stdout).not.toContain('route.guard.budget');
      });
    });
  });

  given('[case3] a DISPUTE', () => {
    const asDispute = (
      input: Partial<
        Parameters<typeof formatRouteGuardReviewPeerAbsorptionAck>[0]
      >,
    ): string =>
      formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          absorption: 'disputed',
          slug: 'architect',
          why: FULCRUM,
          ...input,
        }),
      );

    when('[t0] the last owed concern on the stone', () => {
      const stdout = asDispute({});

      then('it cites the fulcrum the council will read', () => {
        expect(stdout).toContain(`why   = ${FULCRUM}`);
      });

      then(
        'the next acts are absorb THIS lane, then re-arrive via --as arrived',
        () => {
          expect(stdout).toContain('the council will read it');
          const atAbsorb = stdout.indexOf(
            'rhx route.stone.set --stone 5.1.execution --as absorbed --that architect',
          );
          const atArrive = stdout.indexOf(
            'rhx route.stone.set --stone 5.1.execution --as arrived',
          );
          expect(atAbsorb).toBeGreaterThan(-1);
          expect(atArrive).toBeGreaterThan(atAbsorb);
          expect(stdout).not.toContain('--as passed');
        },
      );

      // 🔴 case=1 [t4b] — a disputed lane will not run again this generation, so a top-up
      //    buys it naught
      then('NO top-up is offered, though rounds remain', () => {
        expect(stdout).not.toContain('route.guard.budget');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toContain('the council will read it');
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t1] the disputed lane has spent its budget', () => {
      const stdoutSpent = asDispute({
        meter: { level: 1, rounds: 4, budget: 4 },
      });

      then('still no top-up — a dispute does not depend on rounds', () => {
        expect(stdoutSpent).toContain('the council will read it');
        expect(stdoutSpent).not.toContain('route.guard.budget');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdoutSpent).toContain('budget spent');
        expect(stdoutSpent).toMatchSnapshot();
      });
    });

    // r10 b5 — a passage command printed while a concern still stands sends the driver into
    // a halt the ack itself predicted
    when('[t2] concerns remain on THIS lane', () => {
      const stdoutOwed = asDispute({
        concernsLeft: 2,
        concernNextOnLane: 'blocker.2',
      });

      then('it names the next concern, never a passage command', () => {
        expect(stdoutOwed).toContain(
          'absorb blocker.2 — 2 still owed on this lane',
        );
        expect(stdoutOwed).not.toContain('--as arrived');
        expect(stdoutOwed).not.toContain('--as passed');
      });
    });

    when('[t3] this lane is clear but OTHER lanes still owe', () => {
      const stdoutElsewhere = asDispute({
        concernsElsewhere: 3,
        concernNextElsewhere: { slug: 'mechanic', about: 'nitpick.1' },
      });

      then('the "also" line and the steps agree — no contradiction', () => {
        expect(stdoutElsewhere).toContain(
          '3 concerns on other lanes await absorption',
        );
        expect(stdoutElsewhere).toContain(
          'absorb the 3 concerns on other lanes — next, mechanic nitpick.1',
        );
      });

      then('the next owed concern elsewhere is a runnable command', () => {
        expect(stdoutElsewhere).toContain(
          'rhx route.stone.set --stone 5.1.execution --as conceded --with mechanic --about nitpick.1 --severity better|urgent',
        );
      });

      then('this lane is absorbed BEFORE the other lanes are named', () => {
        const atAbsorb = stdoutElsewhere.indexOf(
          '--as absorbed --that architect',
        );
        const atOther = stdoutElsewhere.indexOf('--with mechanic');
        expect(atAbsorb).toBeGreaterThan(-1);
        expect(atOther).toBeGreaterThan(atAbsorb);
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdoutElsewhere).toContain('--with mechanic');
        expect(stdoutElsewhere).toMatchSnapshot();
      });
    });

    when('[t4] exactly one concern is owed elsewhere', () => {
      const stdoutOne = asDispute({
        concernsElsewhere: 1,
        concernNextElsewhere: { slug: 'mechanic', about: 'blocker.1' },
      });

      then('the noun is singular — never a hard-coded plural', () => {
        expect(stdoutOne).toContain('absorb the 1 concern on other lanes');
        expect(stdoutOne).not.toContain('1 concerns');
      });

      // r014 nitpick.1, i014 — the `also` line's verb agrees with the count, as its noun does
      then('the also line reads `1 concern … awaits`, never `await`', () => {
        expect(stdoutOne).toContain(
          '1 concern on other lanes awaits absorption',
        );
        expect(stdoutOne).not.toContain(
          '1 concern on other lanes await absorption',
        );
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdoutOne).toContain('absorb the 1 concern on other lanes');
        expect(stdoutOne).toMatchSnapshot();
      });
    });
  });

  // 🔴 every `[tn]` here pins the whole body AND asserts the shape that body must carry.
  //    the snapshot alone was the forbidden `toMatchSnapshot()`-with-no-assertions shape: a
  //    refactor that deleted a branch would be greeted by a `--ci` mismatch a resnap silences,
  //    and the structural claim would never have been written down
  //    (`rule.forbid.failhide` · `rule.require.snapshots`, raised i001/r002 n1).
  given('[case4] the rendered body, whole', () => {
    when('[t0] an URGENT concede lands on a spent lane', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          slug: 'ergonomist',
          severity: 'urgent',
          meter: { level: 1, rounds: 4, budget: 4 },
        }),
      );

      then('the grade rides the header, beside the stance it grades', () => {
        expect(stdout).toContain(
          '🗿 route.stone.set --as conceded --severity urgent',
        );
      });

      // 🔴 the header says what was declared; this row says what it obliges. the two carry
      //    different facts, so the row does not restate the word `urgent` the header holds
      then('the warn names the obligation, never the grade again', () => {
        expect(stdout).toContain('ships harm');
        expect(stdout).not.toContain('warn  = urgent');
      });

      // 🔴 the verb is imperative and the actor is the driver. no mechanism mails a human, so a
      //    passive `your human is warned` would read as a notice already sent — and a driver
      //    that trusts it writes naught (`rule.avoid.passive-voice`)
      //
      // 🟡 and the scope named is the stone, never a pull — budget is granted per stone, so a
      //    pull may hold many stones, or none of this one's rounds
      then(
        'the row asks the driver to write the why, never reports a send',
        () => {
          expect(stdout).toContain(
            'tell your human why this stone bought budget',
          );
          expect(stdout).not.toContain('is warned');
        },
      );

      // the whole of what parts [t0] from [t0b]: an urgent grade mints the warrant, so the
      // sequence the ack prints is fix → buy → re-arrive
      then('the top-up is sequenced, scoped to the one spent lane', () => {
        expect(stdout).toContain(
          'fix the blocker, buy the round, then re-arrive',
        );
        expect(stdout).toContain(
          'rhx route.guard.budget --for review --add 2 --peer ergonomist --stone 5.1.execution',
        );
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });
    });

    // the peer of [t0], and the one a driver meets far more often — the grade a concession
    // takes in nearly every round. pinned whole so the elision is visible in a diff rather
    // than asserted by absence
    when('[t0b] a BETTER concede lands on a spent lane', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          slug: 'ergonomist',
          severity: 'better',
          meter: { level: 1, rounds: 4, budget: 4 },
        }),
      );

      // 🔴 the whole repair, asserted rather than left to a byte diff: a `better` grade past a
      //    spent meter earns no round, so the purchase must not appear in the sequence at all
      then('the top-up is absent — a better grade earns no round', () => {
        expect(stdout).toContain('fix the blocker, then re-arrive');
        expect(stdout).not.toContain('buy the round');
        expect(stdout).not.toContain('rhx route.guard.budget');
      });

      // 🔴 a `better` grade is VISIBLE, and it was not before. the ack rendered naught at all
      //    for the grade a driver picks in nearly every round, so the one field the command
      //    REQUIRES came back unechoed — the driver could not read its own declaration
      then('the better grade rides the header, same as urgent', () => {
        expect(stdout).toContain(
          '🗿 route.stone.set --as conceded --severity better',
        );
      });

      then('no warn is printed where the grade ships no harm', () => {
        expect(stdout).not.toContain('warn  =');
        expect(stdout).not.toContain('ships harm');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t1] a dispute lands with concerns left on its lane', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          absorption: 'disputed',
          slug: 'architect',
          why: FULCRUM,
          concernsLeft: 2,
          concernNextOnLane: 'blocker.2',
        }),
      );

      // a dispute concedes naught, so it mints no warrant and carries no grade — the fulcrum it
      // cites is the argument, and the council is who reads it
      then('the fulcrum is cited and the council is named', () => {
        expect(stdout).toContain(
          'why   = .fulcrums/inventory.of=fulcrums.case=F007-file-placement.md',
        );
        expect(stdout).toContain('the council will read it');
      });

      // 🔴 and the header carries NO `--severity` term either. the flag is refused outright on a
      //    dispute (`--severity is not accepted for --as disputed`), so an echo of one would
      //    render an invocation the command would have rejected
      then('no grade and no top-up ride on a dispute', () => {
        expect(stdout).toContain('🗿 route.stone.set --as disputed\n');
        // .note = the next-concern prompt may name `--severity` on its CONCEDE command, which
        //         requires it; the dispute's own header and its own commands never do
        const header = stdout.split('the council will read it')[0]!;
        expect(header).not.toContain('--severity');
        expect(stdout).not.toContain('--as disputed --severity');
        expect(stdout).not.toContain('warn  =');
        expect(stdout).not.toContain('rhx route.guard.budget');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });
    });

    // the dogfood shape (2026-10-06): the lane's last concern, with concerns owed elsewhere
    when('[t2] a concede clears its lane while other lanes owe', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          slug: 'mech-decode-friction',
          concern: { kind: 'nitpick', ordinal: 3 },
          severity: 'better',
          meter: { level: 1, rounds: 7, budget: 9 },
          concernsElsewhere: 8,
          concernNextElsewhere: { slug: 'arch-boundaries', about: 'blocker.1' },
        }),
      );

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t3] a concede clears the last concern on the stone', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({ severity: 'better' }),
      );

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  // 🔴 r9 n2 — a lane that clears its LAST concern must not read as an all-clear on the stone
  given('[case5] the lane is clear but the stone is not', () => {
    when('[t0] this lane owes naught, but other lanes do', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          concernsElsewhere: 3,
          concernNextElsewhere: { slug: 'architect', about: 'blocker.2' },
        }),
      );

      then('the tail names the concerns still owed elsewhere', () => {
        expect(stdout).toContain('3 concerns on other lanes await absorption');
      });

      then('the last-concern tail still marks THIS lane settled', () => {
        expect(stdout).toContain(
          'about = blocker.1 — the last concern this lane owed',
        );
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toContain('3 concerns on other lanes await absorption');
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t1] exactly one concern remains elsewhere', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          concernsElsewhere: 1,
          concernNextElsewhere: { slug: 'architect', about: 'blocker.2' },
        }),
      );

      then('the noun is singular — never a hard-coded plural', () => {
        expect(stdout).toContain('1 concern on other lanes awaits absorption');
        expect(stdout).not.toContain('1 concerns on other lanes');
      });

      // r014 nitpick.1, i014 — the noun agreed and the verb did not: `1 concern … await`
      then('the verb agrees with the singular noun, too', () => {
        expect(stdout).not.toContain(
          '1 concern on other lanes await absorption',
        );
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toContain('1 concern on other lanes awaits absorption');
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t2] THIS lane still owes concerns', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          concernsLeft: 2,
          concernNextOnLane: 'blocker.2',
          concernsElsewhere: 3,
          concernNextElsewhere: { slug: 'architect', about: 'blocker.2' },
        }),
      );

      // the tail already says "2 more on this lane" — the guard is concernsLeft===0
      then('the other-lanes line is withheld until THIS lane is clear', () => {
        expect(stdout).not.toContain('on other lanes await absorption');
        expect(stdout).toContain('about = blocker.1 — 2 more on this lane');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).not.toContain('on other lanes await absorption');
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t3] the whole stone is clear', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(asInput({}));

      then('no other-lanes line appears — the all-clear is true', () => {
        expect(stdout).not.toContain('on other lanes await absorption');
      });
    });
  });

  // 🔴 S14 — a concede carries a graded harm, and the ack renders it on TWO rows that answer two
  //    different questions. both are lone lines in a string, so each is pinned here or it drifts
  //    unseen (rule.require.clamp-edge-cases).
  //
  //    | the row | answers | renders on |
  //    |---|---|---|
  //    | the header's `--severity` term | *what did i declare?* | EVERY concede, both grades |
  //    | the `warns` row | *what does it cost?* | an URGENT concede alone |
  //
  // ⚠️ .the header term is the half a driver meets most and the half that carried NOTHING.
  //    the warn alone was the whole render, so a `better` concede — the grade of nearly every
  //    round — got no echo of the one field the command REQUIRES. these clamp both halves, so a
  //    future edit cannot collapse them back into one.
  given('[case6] a concede carries a severity grade', () => {
    when('[t0] the grade is URGENT', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({ severity: 'urgent' }),
      );

      then('the header echoes the grade the driver declared', () => {
        expect(stdout).toContain(
          '🗿 route.stone.set --as conceded --severity urgent',
        );
      });

      then('the ack asks the driver to explain the spend to its human', () => {
        expect(stdout).toContain(
          'warn  = ships harm — tell your human why this stone bought budget',
        );
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toContain('warn  = ships harm');
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t1] the grade is BETTER', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({ severity: 'better' }),
      );

      // 🔴 the halves move INDEPENDENTLY, and this is the case that proves it: a `better` concede
      //    echoes its grade in full and warns no human at all
      then('the header echoes the grade the driver declared', () => {
        expect(stdout).toContain(
          '🗿 route.stone.set --as conceded --severity better',
        );
      });

      // 🔴 a better concession must NEVER earn a round — S14: "shouldnt weight us down". so the
      //    urgent warn is withheld, and no human is named on a better concede
      then('no urgent warn appears — a better concede adds no weight', () => {
        expect(stdout).not.toContain('--severity urgent');
        expect(stdout).not.toContain('warn  =');
        expect(stdout).not.toContain('tell your human');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).not.toContain('warn  =');
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t2] a DISPUTE never carries a grade', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({ absorption: 'disputed', slug: 'architect', why: FULCRUM }),
      );

      // 🔴 NEITHER half renders. a dispute grades naught, and `--severity` is refused outright on
      //    one (`--severity is not accepted for --as disputed`) — so a header that echoed a term
      //    here would print an invocation the command itself would have rejected
      then(
        'no grade rides either half — severity is the concede taxonomy alone',
        () => {
          expect(stdout).toContain('🗿 route.stone.set --as disputed\n');
          expect(stdout).not.toContain('--severity');
          expect(stdout).not.toContain('warn  =');
        },
      );
    });
  });

  // 🔴 behavior-intent r010 blocker.1 — an unlimited budget never spends down
  given('[case7] a stance lands on a lane with an UNLIMITED budget', () => {
    when('[t0] a concede on an ∞-budget lane', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({ meter: { level: 1, rounds: 2, budget: Infinity } }),
      );

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

      then('the lane can confirm the fix as it stands — no top-up', () => {
        expect(stdout).toContain('the hold stands. fix, then re-arrive');
        expect(stdout).not.toContain('route.guard.budget');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toContain('∞ rounds left');
        expect(stdout).toMatchSnapshot();
      });
    });

    when('[t1] a dispute on an ∞-budget lane', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({
          absorption: 'disputed',
          slug: 'architect',
          why: FULCRUM,
          meter: { level: 1, rounds: 2, budget: Infinity },
        }),
      );

      then('the meter still reads ∞ on the dispute branch', () => {
        expect(stdout).toContain('∞ budget');
        expect(stdout).toContain('∞ rounds left');
        expect(stdout).not.toContain('Infinity');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toContain(`why   = ${FULCRUM}`);
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  given('[case8] a stance lands with one round spent and one left', () => {
    when('[t0] a concede on a lane at rounds 1 of budget 2', () => {
      const stdout = formatRouteGuardReviewPeerAbsorptionAck(
        asInput({ meter: { level: 1, rounds: 1, budget: 2 } }),
      );

      then('the noun agrees with a count of one, on both sides', () => {
        expect(stdout).toContain(
          'mechanic (l1), 1 round, 2 budget — 1 round left',
        );
        expect(stdout).not.toContain('1 rounds');
      });
    });
  });
});
