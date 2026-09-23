import { given, then, when } from 'test-fns';

import {
  genRouteGuardExhaustedReason,
  WARN_TEXT_CONCESSION_URGENT,
} from '../guard/review/peer/genRouteGuardExhaustedReason';
import type { GuardPeerMeterStatus } from '../guard/tree/formatGuardTree';
import { formatRouteDriveBudgetExhausted } from './formatRouteDriveBudgetExhausted';
import { formatRouteDriveMixedHalt } from './formatRouteDriveMixedHalt';

/**
 * .what = pins the two route.drive halt replays that carried no coverage at any runnable grain
 * .why = both surfaces render remedies, and both were rewritten to read them from the shared
 *        `computeBlockRemedyGroups`. their only extant pins live in blackbox acceptance snapshots,
 *        which sit behind a credential gate — so a change to either could ship unverified on any
 *        machine without brain keys. they are pure transformers with pure imports, so a unit test
 *        is both owed and sufficient (`rule.require.test-coverage-by-grain`).
 *
 * .note = each `when` carries BOTH: named structural assertions AND a full-body snapshot.
 *         `rule.require.snapshots` asks for both and says why — the assertions verify function,
 *         the snapshot gives a reviewer a visual spotcheck of the exact bytes a driver reads.
 *
 * 🔴 .why the snapshot is here and not left to acceptance = an earlier draft of this suite
 *    declined a full-body pin, on the ground that it would duplicate the blackbox acceptance
 *    baselines. that ground was wrong in the one way that matters: those baselines sit behind
 *    `jest.acceptance.env.ts`, which sources the keyrack in STRICT mode and demands five brain
 *    keys. so on any machine without them, a reword of this copy — the exact text a driver reads
 *    when their ladder is spent or a reviewer broke — ships green with no diff to see.
 *    ⇒ two pins of one render at two grains do not go stale against each other. if they diverge,
 *      one of them is stale, and that divergence is the signal, never the noise. this is the pin
 *      that runs everywhere.
 */

const meterExhausted: GuardPeerMeterStatus = {
  index: 1,
  slug: 'mech-rules',
  level: 1,
  rounds: 3,
  budget: 3,
  verdict: 'exhausted',
  awaits: false,
  blockers: 2,
  nitpicks: 0,
  overruled: false,
  skippedByDispute: false,
  disputed: { blockers: 0, nitpicks: 0 },
  path: '.reviews/peer/1.vision._.i003.r001._.given.by_peer.mech-rules.md',
};

describe('formatRouteDriveBudgetExhausted', () => {
  given('[case1] a spent ladder — every level terminal', () => {
    when('[t0] the halt is replayed with a reason that names a slug', () => {
      const output = formatRouteDriveBudgetExhausted({
        route: '.behavior/v2026_09_03.example',
        stone: '1.vision',
        reason: 'peer reviewer budget exhausted: mech-rules',
        meters: [meterExhausted],
      });

      then('the halt names its cause', () => {
        expect(output).toContain('halted, peer reviewer budget exhausted');
      });

      // 🔴 the header is the fix for the defect this surface carried in its sharpest form: it
      //    listed the budget top-up BENEATH `please ask a human to either`, which asserts that a
      //    lever the driver owns needs a foreman
      //    (`rule.always.spend-own-levers-before-escalation`).
      then(
        'the remedies are headed by the owner-sort, not by an escalation',
        () => {
          expect(output).toContain(
            'spend your own lever first, then ask a human',
          );
          expect(output).not.toContain('please ask a human to either');
        },
      );

      then("the driver's own lever leads, and is labelled as theirs", () => {
        const indexOwn = output.indexOf(
          'converge with the reviewer — yours to run',
        );
        const indexApprove = output.indexOf(
          'approve as-is — a human must grant',
        );
        expect(indexOwn).toBeGreaterThan(-1);
        expect(indexApprove).toBeGreaterThan(indexOwn);
      });

      // 🔴 this reason carries no concession mark, so no warrant stands and the gate would
      //    refuse a grant. the halt used to hand the driver that very command
      then('no top-up is offered — the grant would be refused', () => {
        expect(output).not.toContain('increase budget');
        expect(output).not.toContain('rhx route.guard.budget');
      });

      then('the lone exhausted slug is named on the converge command', () => {
        expect(output).toContain(
          'rhx route.stone.set --stone 1.vision --as absorbed --that mech-rules',
        );
      });

      // ⚠️ `once they approve` presumed the human branch for BOTH remedies, so a driver who
      //    topped up their own budget was told to wait on an approval never owed.
      // 🔴 and its repair named the HUMAN branch alone, so the driver-owned lever sorted first
      //    was left with no stated next step (i001/r009 n2). the tail names either remedy now,
      //    because both end at the same command.
      then(
        'the passage line completes EITHER remedy, not just the human one',
        () => {
          expect(output).toContain('once either remedy lands, run');
          expect(output).not.toContain('once a human grants the approval');
          expect(output).toContain(
            'rhx route.stone.set --stone 1.vision --as passed',
          );
        },
      );

      then('the term is `increase budget`, never a second word for it', () => {
        expect(output).not.toContain('extend budget');
      });

      then('the whole replay is pinned, byte for byte', () => {
        expect(output).toMatchSnapshot();
      });
    });

    when('[t1] the caller passes no reason', () => {
      const output = formatRouteDriveBudgetExhausted({
        route: '.behavior/v2026_09_03.example',
        stone: '1.vision',
        reason: null,
        meters: [meterExhausted],
      });

      // the surface is BY DEFINITION the budget-exhausted halt, so a null reason falls back to
      // the bare halt text — the shared builder still keys off it and the remedies stay on the
      // page, with no `--peer` since no slug was parsed.
      then('the remedies still render, with no named lane', () => {
        expect(output).toContain('converge with the reviewer — yours to run');
        expect(output).toContain('approve as-is — a human must grant');
        expect(output).not.toContain('--peer');
        expect(output).toContain('--that <reviewer>');
      });

      then('the whole replay is pinned, byte for byte', () => {
        expect(output).toMatchSnapshot();
      });
    });

    when('[t2] the meter set is empty', () => {
      const output = formatRouteDriveBudgetExhausted({
        route: '.behavior/v2026_09_03.example',
        stone: '1.vision',
        reason: 'peer reviewer budget exhausted',
        meters: [],
      });

      // ⚠️ the spacer belongs to the reviews section, so it goes when the section goes — two
      //    blank connectors in a row is the blemish this pins against.
      then('no doubled blank connector is left behind', () => {
        expect(output).not.toContain('      │\n      │');
      });

      then('the remedies survive the empty meter set', () => {
        expect(output).toContain('converge with the reviewer — yours to run');
      });

      then('the whole replay is pinned, byte for byte', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

  given('[case1b] a spent ladder where every skipped lane was CONCEDED', () => {
    when('[t0] the halt is replayed', () => {
      const output = formatRouteDriveBudgetExhausted({
        route: '.behavior/v2026_09_03.example',
        stone: '5.1.execution',
        reason:
          'concessions await the round that confirms them; peer reviewer budget exhausted: mech-rules',
        meters: [meterExhausted],
      });

      // 🔴 S12. the halt names the CONCESSIONS as the reason — it is not the spent-ladder halt
      //    under a friendlier label, it is a different halt with a different owner.
      // 🔴 what MOVED is the remedy it names: the header read `halted on more budget`, and a
      //    `better` grade earns no more budget past the meter (F04). the concession half of
      //    S12 stands; the budget half was the part the bound removed
      then('the halt names the concessions, never a bare exhaustion', () => {
        expect(output).toContain('halted on your concessions, to be fixed');
        expect(output).not.toContain('halted, peer reviewer budget exhausted');
      });

      then('and it promises no budget it cannot deliver', () => {
        expect(output).not.toContain('more budget');
        expect(output).not.toContain('rhx route.guard.budget');
      });

      // 🔴 the gap S12 closes. a driver that conceded, exhausted, and reached allTerminal
      //    was handed a human halt whose remedy is its OWN lever
      // ⚠️ the absent string must be the one the code can EMIT. it read
      //    `once a human grants the approval`, which no branch prints since i001/r009 n2 — so the
      //    assertion held whatever this halt rendered (`rule.forbid.failhide`)
      then('no human is summoned — the approve tail is gone', () => {
        expect(output).not.toContain('a human must grant');
        expect(output).not.toContain('once either remedy lands, run');
      });

      then('the header does not promise a human to ask', () => {
        expect(output).toContain('what to do — no human needed');
        expect(output).not.toContain(
          'spend your own lever first, then ask a human',
        );
      });

      // ⚠️ the owner rides the remedy LABEL, so the header no longer repeats it — `yours to
      //    run` twice, one line apart, is one claim a driver reads as two
      then('the owner is named once, on the remedy itself', () => {
        expect(output).toContain('fix what you conceded — yours to run');
        expect(output.split('yours to run').length - 1).toEqual(1);
      });

      // 🔴 the remedy IS the passage command now, so the halt's own tail would print it a
      //    second connector down. the block becomes the last branch and the tail is dropped
      then('the passage command appears exactly once', () => {
        const passCmd = 'rhx route.stone.set --stone 5.1.execution --as passed';
        expect(output).toContain(passCmd);
        expect(output.split(passCmd).length - 1).toEqual(1);
      });

      // S11 fixes the order at concede → fix → re-arrive, and the re-arrival is what the one
      // remedy names — no grant, and no wait, stands between them
      then('the re-arrival is the whole of what follows the fix', () => {
        expect(output).not.toContain('once either remedy lands, run');
      });

      then('the whole replay is pinned, byte for byte', () => {
        expect(output).toMatchSnapshot();
      });
    });

    when('[t1] one lane was NOT conceded, so the mark is absent', () => {
      // the builder omits the mark unless EVERY skipped lane conceded — a lane the driver
      // never conceded still awaits a human, and a concession-worded halt would lie
      const output = formatRouteDriveBudgetExhausted({
        route: '.behavior/v2026_09_03.example',
        stone: '5.1.execution',
        reason: 'peer reviewer budget exhausted: mech-rules',
        meters: [meterExhausted],
      });

      then('the ordinary human halt is rendered, unchanged', () => {
        expect(output).toContain('halted, peer reviewer budget exhausted');
        expect(output).toContain('approve as-is — a human must grant');
      });
    });
  });

  // 🔴 nitpick.3 (r010): the urgent-concession warn line is the surface F028/S14 exists to
  //    make real, and it had NO pin at any runnable grain — its only cover was a
  //    credential-gated acceptance snapshot, so a drop of the `if (isUrgent)` branch shipped
  //    green on any machine without brain keys (rule.forbid.failhide). the reasons here are
  //    built through the ONE builder `genRouteGuardExhaustedReason`, so this pins the mark's
  //    write and the surface's read as one contract.
  given(
    '[case1c] a spent ladder where ≥1 conceded lane is URGENT (F028/S14)',
    () => {
      when('[t0] the urgent halt is replayed', () => {
        const output = formatRouteDriveBudgetExhausted({
          route: '.behavior/v2026_09_03.example',
          stone: '5.1.execution',
          reason: genRouteGuardExhaustedReason({
            slugs: ['mech-rules'],
            concession: 'urgent',
          }),
          meters: [meterExhausted],
        });

        // 🔴 the clamp: drop the `if (isUrgent)` branch in the render and this goes red. an
        //    urgent concession ships nameable harm, so the human must be told the round is owed.
        then('the urgent warn line is on the page', () => {
          expect(output).toContain(WARN_TEXT_CONCESSION_URGENT);
        });

        // an urgent concession sheds NONE of the human's part — it rides the ordinary human
        // wait and adds a reason for it, so the approve tail stays (unlike a `better` concede).
        then('it renders the human wait, never the driver-own tail', () => {
          expect(output).toContain('approve as-is — a human must grant');
          expect(output).not.toContain(
            'what to do — yours to run, no human needed',
          );
        });

        then('the whole replay is pinned, byte for byte', () => {
          expect(output).toMatchSnapshot();
        });
      });

      when('[t1] the concession is `better`, so no urgent warn is owed', () => {
        const output = formatRouteDriveBudgetExhausted({
          route: '.behavior/v2026_09_03.example',
          stone: '5.1.execution',
          reason: genRouteGuardExhaustedReason({
            slugs: ['mech-rules'],
            concession: 'better',
          }),
          meters: [meterExhausted],
        });

        // 🔴 the disjoint half: a `better` concession is the driver's own, no human, no warn.
        //    the marks share no phrase, so the urgent line must NOT bleed onto a better halt.
        then('the urgent warn line is absent', () => {
          expect(output).not.toContain(WARN_TEXT_CONCESSION_URGENT);
        });

        then('the driver-own tail is rendered, never the human wait', () => {
          expect(output).toContain('what to do — no human needed');
          expect(output).not.toContain('a human must grant');
        });
      });

      when('[t2] an ordinary exhaustion carries no concession at all', () => {
        const output = formatRouteDriveBudgetExhausted({
          route: '.behavior/v2026_09_03.example',
          stone: '5.1.execution',
          reason: genRouteGuardExhaustedReason({
            slugs: ['mech-rules'],
            concession: 'none',
          }),
          meters: [meterExhausted],
        });

        then('the urgent warn line is absent', () => {
          expect(output).not.toContain(WARN_TEXT_CONCESSION_URGENT);
        });
      });
    },
  );

  given(
    '[case2] a lower level is spent but a HIGHER level is live again',
    () => {
      when('[t0] the halt is replayed', () => {
        const output = formatRouteDriveBudgetExhausted({
          route: '.behavior/v2026_09_03.example',
          stone: '1.vision',
          reason: 'peer reviewer budget exhausted: mech-rules',
          meters: [
            meterExhausted,
            // ⚠️ `rejected` is what makes l2 the LIVE gate. a terminal verdict here (approved /
            //    exhausted / malfunction / constraint) clears every level, so `liveLevel` is null
            //    and there is no unlock to render — the ladder is simply spent.
            // 🔴 `index` and `path` must BOTH be overridden with the rest. every field this
            //    spread carries over is one ergo-rules never declared, and the two IDENTITY
            //    fields are the ones that reach the render:
            //      - a carried `path` renders `r2: ergo-rules` with `by_peer.mech-rules.md`
            //        beneath it — one row that quotes another reviewer's artifacts
            //      - a carried `index` renders `r1: ergo-rules` — mech-rules' own rung, so
            //        two reviewers claim one identity
            //    either way a driver reads two names for one identity
            //    (`rule.forbid.snapshot-visual-blemishes`). the snapshot on this suite is
            //    what surfaced both; the structural assertions could see neither.
            {
              ...meterExhausted,
              index: 2,
              slug: 'ergo-rules',
              level: 2,
              rounds: 1,
              verdict: 'rejected',
              blockers: 1,
              path: '.reviews/peer/1.vision._.i003.r002._.given.by_peer.ergo-rules.md',
            },
          ],
        });

        // 🔴 a false halt. "ask a human" here would contradict the footer's "a human is only needed
        //    once every level is terminal" — two opposite reads in one stdout.
        then('no halt text is rendered — the path continues', () => {
          expect(output).not.toContain(
            'halted, peer reviewer budget exhausted',
          );
        });

        then('no human remedy is offered, since no human is needed yet', () => {
          expect(output).not.toContain('a human must grant');
        });

        then('the whole replay is pinned, byte for byte', () => {
          expect(output).toMatchSnapshot();
        });
      });
    },
  );
});

describe('formatRouteDriveMixedHalt', () => {
  given(
    '[case1] a malfunction that broke in the same pass a level spent',
    () => {
      when('[t0] the halt is replayed', () => {
        const output = formatRouteDriveMixedHalt({
          route: '.behavior/v2026_09_03.example',
          stone: '1.vision',
          reason:
            'reviewer or judge malfunctioned; peer reviewer budget exhausted: mech-rules',
          meters: [meterExhausted],
        });

        then('the replay names EVERY reason, never just the escalation', () => {
          expect(output).toContain('reviewer or judge malfunctioned');
          expect(output).toContain('peer reviewer budget exhausted');
        });

        // 🔴 the whole point of the surface: collapse it to the bare "guard malfunction, tell a
        //    human" escalation and the also-present exhaustion's remedies vanish, so the human
        //    walks a path that hits a SECOND, unwarned block.
        // ⇒ the driver's slot holds CONVERGE here: this reason carries no concession mark, so
        //   no warrant stands and the gate would refuse a grant. the SLOT is what this case
        //   pins — that a mixed halt hides no gate's remedy — and the slot is unchanged
        then('every remedy is offered at once', () => {
          expect(output).toContain('converge with the reviewer — yours to run');
          expect(output).toContain(
            'overrule the malfunction — a human must grant',
          );
          expect(output).toContain('approve as-is — a human must grant');
        });

        then(
          "the order is BY OWNER — the driver's lever before either human one",
          () => {
            const indexOwn = output.indexOf('converge with the reviewer');
            const indexOverrule = output.indexOf('overrule the malfunction');
            const indexApprove = output.indexOf('approve as-is');
            expect(indexOwn).toBeGreaterThan(-1);
            expect(indexOverrule).toBeGreaterThan(indexOwn);
            expect(indexApprove).toBeGreaterThan(indexOverrule);
          },
        );

        then(
          'the remedies are headed by the owner-sort, not by an escalation',
          () => {
            expect(output).toContain(
              'spend your own lever first, then ask a human',
            );
            expect(output).not.toContain('please ask a human to either');
          },
        );

        then('the whole replay is pinned, byte for byte', () => {
          expect(output).toMatchSnapshot();
        });
      });

      when(
        '[t1] the reason names a constraint rather than a malfunction',
        () => {
          const output = formatRouteDriveMixedHalt({
            route: '.behavior/v2026_09_03.example',
            stone: '1.vision',
            reason:
              'a reviewer hit a constraint; peer reviewer budget exhausted: mech-rules',
            meters: [meterExhausted],
          });

          then('the overrule noun follows the reason', () => {
            expect(output).toContain(
              'overrule the constraint — a human must grant',
            );
            expect(output).not.toContain('overrule the malfunction');
          });

          then('the whole replay is pinned, byte for byte', () => {
            expect(output).toMatchSnapshot();
          });
        },
      );

      when('[t2] the meter set is empty', () => {
        const output = formatRouteDriveMixedHalt({
          route: '.behavior/v2026_09_03.example',
          stone: '1.vision',
          reason:
            'reviewer or judge malfunctioned; peer reviewer budget exhausted',
          meters: [],
        });

        then('no doubled blank connector is left behind', () => {
          expect(output).not.toContain('      │\n      │');
        });

        then('the whole replay is pinned, byte for byte', () => {
          expect(output).toMatchSnapshot();
        });
      });
    },
  );
});
