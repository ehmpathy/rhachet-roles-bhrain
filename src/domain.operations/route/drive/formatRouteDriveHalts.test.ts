import { given, then, when } from 'test-fns';

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
  slug: 'mech-rules',
  level: 1,
  rounds: 3,
  budget: 3,
  verdict: 'exhausted',
  awaits: false,
  blockers: 2,
  nitpicks: 0,
  overruled: false,
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
        const indexBudget = output.indexOf('increase budget — yours to spend');
        const indexApprove = output.indexOf(
          'approve as-is — a human must grant',
        );
        expect(indexBudget).toBeGreaterThan(-1);
        expect(indexApprove).toBeGreaterThan(indexBudget);
      });

      then('the lone exhausted slug is named on the top-up command', () => {
        expect(output).toContain(
          'rhx route.guard.budget --for review --add N --peer mech-rules --stone 1.vision',
        );
      });

      // ⚠️ `once they approve` presumed the human branch for BOTH remedies, so a driver who
      //    topped up their own budget was told to wait on an approval never owed.
      then('the passage line follows a GRANT, never a top-up', () => {
        expect(output).toContain('once a human grants the approval, run');
        expect(output).toContain(
          'rhx route.stone.set --stone 1.vision --as passed',
        );
      });

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
      then('the remedies still render, with no --peer', () => {
        expect(output).toContain('increase budget — yours to spend');
        expect(output).toContain('approve as-is — a human must grant');
        expect(output).not.toContain('--peer');
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
        expect(output).toContain('increase budget — yours to spend');
      });

      then('the whole replay is pinned, byte for byte', () => {
        expect(output).toMatchSnapshot();
      });
    });
  });

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
            // 🔴 `path` must be overridden with the rest. a spread that carries
            //    meterExhausted's path renders `r2: ergo-rules` with `by_peer.mech-rules.md`
            //    beneath it — one reviewer row that quotes another reviewer's artifacts,
            //    which a driver reads as two names for one identity
            //    (`rule.forbid.snapshot-visual-blemishes`). the snapshot added to this suite
            //    is what surfaced it; the structural assertions could not see it.
            {
              ...meterExhausted,
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
        then('every remedy is offered at once', () => {
          expect(output).toContain('increase budget — yours to spend');
          expect(output).toContain(
            'overrule the malfunction — a human must grant',
          );
          expect(output).toContain('approve as-is — a human must grant');
        });

        then(
          "the order is BY OWNER — the driver's lever before either human one",
          () => {
            const indexBudget = output.indexOf('increase budget');
            const indexOverrule = output.indexOf('overrule the malfunction');
            const indexApprove = output.indexOf('approve as-is');
            expect(indexBudget).toBeGreaterThan(-1);
            expect(indexOverrule).toBeGreaterThan(indexBudget);
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
