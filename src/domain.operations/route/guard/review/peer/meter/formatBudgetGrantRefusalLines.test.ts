import { given, then, when } from 'test-fns';

import type { BudgetGrantMeter } from './computeBudgetGrantRefusal';
import { formatBudgetGrantRefusalLines } from './formatBudgetGrantRefusalLines';

// build a minimal meter (the renderer reads slug + rounds + budget; the default is a spent one,
// since every case here is a refusal and a refusal's common shape is a meter that ran out)
const asMeter = (input: Partial<BudgetGrantMeter>): BudgetGrantMeter => ({
  slug: 'mech-rules',
  level: 1,
  rounds: 18,
  budget: 18,
  ...input,
});

/**
 * .what = the refusal a driver reads instead of a grant
 * .why = req 5 — the refusal NAMES the sanctioned move. this is a cli contract surface, so the
 *        bytes are pinned whole: a driver reads them at the moment it is most likely to reach
 *        for the wrong lever, and a copy regression there is a defect nobody sees in a diff.
 */
describe('formatBudgetGrantRefusalLines', () => {
  given('[case1] no warrant stands', () => {
    const lines = formatBudgetGrantRefusalLines({
      refusal: { kind: 'no-warrant' },
      route: '.behavior/v2026_09_03.example',
      stone: '5.1.execution',
      add: 4,
      peer: 'mech-rules',
      level: null,
      meters: [asMeter({})],
    });
    const stdout = lines.join('\n');

    when('[t0] the refusal is rendered', () => {
      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });

      // the refusal keeps routeGuardBudget's SUCCESS skeleton, so a driver reads one shape
      // whether the grant lands or not
      then('it keeps the success header shape', () => {
        expect(stdout).toContain('🗿 route.guard.budget');
        expect(stdout).toContain('   ├─ route = .behavior/v2026_09_03.example');
        expect(stdout).toContain('   ├─ add = 4');
        expect(stdout).toContain('   ├─ peer = mech-rules');
      });

      // 🔴 rule.always.spend-own-levers-before-escalation — "two remedies side by side with no
      //    owner column read as two human remedies". the driver's lever here is convergence, so
      //    the block carries only levers the driver owns
      then('NO human is named', () => {
        expect(stdout).not.toContain('a human must grant');
        expect(stdout).not.toContain('--as approved');
        expect(stdout).not.toContain('--as overruled');
      });

      // 🔴 the wisher's directive — the tips are tree ROWS, never warn lines suspended beneath
      //    the command, and they carry no loud glyph. the refusal IS the warn
      then('the tips are branches, and carry no warn glyph', () => {
        expect(stdout).toContain(
          '         ├─ urgent = security · safety · monetary · reputation · behavioral',
        );
        expect(stdout).toContain(
          '         ├─ better = every other concern, and it earns no round',
        );
        expect(stdout).not.toContain('⚠️');
      });

      // rule.always.concede-with-a-severity — "bias to better". a refusal that nudges toward
      // urgent is a refusal that funds the loop it exists to stop
      then('both grades are named, never urgent alone', () => {
        expect(stdout).toContain('urgent =');
        expect(stdout).toContain('better =');
      });

      // 🔴 r3 — "grade it and this grant is yours" taught F10's residual as an invitation. the
      //    copy must make no claim about the SIZE a re-run will permit
      then('it promises no size — the header already carries add = 4', () => {
        expect(stdout).not.toContain('this grant is yours');
      });
    });

    when('[t1] no peer was named', () => {
      const bare = formatBudgetGrantRefusalLines({
        refusal: { kind: 'no-warrant' },
        route: '.behavior/v2026_09_03.example',
        stone: '5.1.execution',
        add: 2,
        peer: null,
        level: 2,
        meters: [asMeter({ slug: 'ergo-rules' })],
      }).join('\n');

      then('the remedy names a real reviewer from the scope', () => {
        expect(bare).toContain('--that ergo-rules');
        expect(bare).toContain('--with ergo-rules');
      });

      then('the level row appears where one was named', () => {
        expect(bare).toContain('   ├─ level = 2');
      });
    });

    when('[t2] no peer was named and no reviewer has run', () => {
      const empty = formatBudgetGrantRefusalLines({
        refusal: { kind: 'no-warrant' },
        route: '.behavior/v2026_09_03.example',
        stone: '5.1.execution',
        add: 2,
        peer: null,
        level: null,
        meters: [],
      }).join('\n');

      then('the remedy falls back to a placeholder, never a crash', () => {
        expect(empty).toContain('--that <reviewer>');
      });
    });

    // 🔴 a bare `--add N` scopes to the LATEST LEVEL, which may hold several reviewers at once. an
    //    earlier form read `meters[0]` and named an arbitrary one, so the driver copied a command
    //    that addressed the wrong reviewer. the extant twin at `formatBlockRemedyGroups.ts:156`
    //    had already refused that guess (`slugs.length === 1 ? slugs[0]! : '<reviewer>'`), and
    //    this clamps the same rule here — a placeholder a driver must fill beats a slug it must
    //    check. ⇒ delete the length test and this goes red on `mech-rules`
    when('[t3] no peer was named and the scope holds SEVERAL reviewers', () => {
      const many = formatBudgetGrantRefusalLines({
        refusal: { kind: 'no-warrant' },
        route: '.behavior/v2026_09_03.example',
        stone: '5.1.execution',
        add: 2,
        peer: null,
        level: null,
        meters: [
          asMeter({ slug: 'mech-rules' }),
          asMeter({ slug: 'ergo-rules' }),
        ],
      }).join('\n');

      then('it declines to guess, and names the placeholder', () => {
        expect(many).toContain('--that <reviewer>');
        expect(many).toContain('--with <reviewer>');
      });

      then(
        'it names NEITHER reviewer — an arbitrary pick is the defect',
        () => {
          expect(many).not.toContain('--that mech-rules');
          expect(many).not.toContain('--that ergo-rules');
        },
      );
    });

    // 🔴 the gate's order is scope → warrant → moment, so a WARRANT refusal never evaluated the
    //    moment. at a LIVE meter both conjuncts fail, and the urgent-grade remedy therefore does
    //    NOT unblock — a driver that follows it mints a harm claim with its own name on it and
    //    meets a second, different refusal (`rounds-remain`).
    //
    //    ⚠️ measured on this repo's own route at `5.3.verification`, every reviewer `0/3 — 3 left`:
    //       the warrant refusal rendered and its second remedy was the one that does not land.
    //       `rule.require.errors-name-the-fix` — a named fix that does not fix is the same defect
    //       one step out. ⇒ delete the conditional row and this case goes red.
    when('[t4] the warrant is absent AND the meter is still LIVE', () => {
      const live = formatBudgetGrantRefusalLines({
        refusal: { kind: 'no-warrant' },
        route: '.behavior/v2026_09_03.example',
        stone: '5.1.execution',
        add: 4,
        peer: 'mech-rules',
        level: null,
        meters: [asMeter({ rounds: 0, budget: 3 })],
      }).join('\n');

      then('the bytes a driver reads are pinned', () => {
        expect(live).toMatchSnapshot();
      });

      then('it warns that the urgent grade alone will not unblock', () => {
        expect(live).toContain(
          '         ├─ and spend the rounds in hand first — a grant needs a reviewer that has run dry',
        );
      });

      // 🟡 the DIAGNOSIS is unchanged — the head still names the conjunct the gate refused on.
      //    what is added is one row under the remedy that would mislead, never a second reason
      then('the head still names the WARRANT as the refusal reason', () => {
        expect(live).toContain(
          '   ├─ refused — a grant needs a live urgent concession on the last round',
        );
        expect(live).not.toContain('refused — rounds remain');
      });

      // the driver can check the branch rather than trust it
      then('the meter row shows the rounds that remain', () => {
        expect(live).toContain('mech-rules = 0/3 rounds spent — 3 left');
      });
    });

    // ✅ the complement — at a DRY meter the urgent grade DOES unblock, so the row must be absent.
    //    a row that always renders would teach every driver a condition that rarely applies
    when('[t5] the warrant is absent and the meter has run DRY', () => {
      const dry = formatBudgetGrantRefusalLines({
        refusal: { kind: 'no-warrant' },
        route: '.behavior/v2026_09_03.example',
        stone: '5.1.execution',
        add: 4,
        peer: 'mech-rules',
        level: null,
        meters: [asMeter({ rounds: 3, budget: 3 })],
      }).join('\n');

      then('it does NOT warn about rounds in hand', () => {
        expect(dry).not.toContain('spend the rounds in hand first');
      });
    });
  });

  given('[case2] rounds remain', () => {
    const stdout = formatBudgetGrantRefusalLines({
      refusal: {
        kind: 'rounds-remain',
        meters: [asMeter({ slug: 'ergonomist', rounds: 3, budget: 12 })],
      },
      route: '.behavior/v2026_09_03.example',
      stone: '5.1.execution',
      add: 20,
      peer: 'ergonomist',
      level: null,
      meters: [asMeter({ slug: 'ergonomist', rounds: 3, budget: 12 })],
    }).join('\n');

    when('[t0] the refusal is rendered', () => {
      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });

      // the diagnosis is the branch condition made visible — a driver can check the gate
      // rather than trust it
      then('it names the reviewer and its meter', () => {
        expect(stdout).toContain('ergonomist = 3/12 rounds spent — 9 left');
      });

      // ⚠️ F10's honest cost: the driver burns the rounds in hand, then asks again. the copy
      //    must say so, or a refusal at 3/12 reads as a defect
      then('it names the wait, never a human', () => {
        expect(stdout).toContain('spend the rounds in hand');
        expect(stdout).not.toContain('a human must grant');
      });
    });
  });

  /**
   * 🔴 .the two demoed critipaths' REFUSAL SURFACE, and the one place the render is known to
   *    under-deliver what its demo sketched.
   *
   *    `case=8` (the dispute that earns naught) and `case=6` (the broken lane) each demo a refusal
   *    whose diagnosis names WHY this cell is refused — *"a dispute earns no round"*, *"this lane
   *    MALFUNCTIONED"*. neither ships: `BudgetGrantRefusal` carries three kinds and no B- or
   *    C-specific variant, so the renderer has no disputed or malfunctioned input to branch on.
   *
   * 🔴 .these assert BOTH halves, and the second is the one that carries weight.
   *    the positive half pins the copy each cell really reads. the negative half pins that the
   *    demoed diagnosis is ABSENT — so the gap is a fact on the record rather than an omission a
   *    reader must guess at, and the day the enrichment lands these go red and name themselves.
   */
  given('[case4] the two demoed cells, at the render grain', () => {
    // `case=8` — the driver disputed a blocker against a fulcrum, then asked for the round it is
    // certain the argument earned. the ledger holds a stance; it holds no WARRANT
    when('[t0] a disputed stone, every round spent', () => {
      const disputed = formatBudgetGrantRefusalLines({
        refusal: { kind: 'no-warrant' },
        route: '.behavior/v2026_09_03.example',
        stone: '5.1.execution',
        add: 2,
        peer: 'mech-rules',
        level: null,
        meters: [asMeter({ rounds: 3, budget: 3 })],
      }).join('\n');

      then('the bytes a driver reads are pinned', () => {
        expect(disputed).toMatchSnapshot();
      });

      // req 5 holds: the sanctioned move is named, and it is the driver's own
      then('it names convergence, and no human', () => {
        expect(disputed).toContain('--as absorbed --that mech-rules');
        expect(disputed).toContain('yours to run, no human needed');
      });

      // ✅ the urgent-grade remedy is honest HERE even for a disputed concern: `--about <concern>`
      //    is a placeholder, and a concede on the disputed concern itself is refused as a contrary
      //    stance, so the command lands on a residual concern as the demo's own `[t4]` intends
      then('the meter is dry, so it does not warn about rounds in hand', () => {
        expect(disputed).not.toContain('spend the rounds in hand first');
      });

      // 🔴 the demoed B-specific diagnosis, ABSENT. `case=8` promises three clauses — that a
      //    dispute earns no round, that the argument is already on the board, and that the
      //    disputed concern no longer holds the stone. the shipped render carries none of them
      then('🔴 the demoed dispute diagnosis does NOT ship', () => {
        expect(disputed).not.toContain('a dispute earns no round');
        expect(disputed).not.toContain('already on the board');
        expect(disputed).not.toContain('no longer holds the stone');
      });
    });

    // `case=6` — the reviewer blew its context window and returned no verdict. a malfunctioned
    // round draws no budget, so the meter still reads 2 of 3 and the MOMENT conjunct refuses
    when('[t1] a malfunctioned reviewer, below its allowance', () => {
      const broken = formatBudgetGrantRefusalLines({
        refusal: {
          kind: 'rounds-remain',
          meters: [asMeter({ slug: 'ergo-coverage', rounds: 2, budget: 3 })],
        },
        route: '.behavior/v2026_09_03.example',
        stone: '5.1.execution',
        add: 2,
        peer: 'ergo-coverage',
        level: null,
        meters: [asMeter({ slug: 'ergo-coverage', rounds: 2, budget: 3 })],
      }).join('\n');

      then('the bytes a driver reads are pinned', () => {
        expect(broken).toMatchSnapshot();
      });

      // ✅ the remedy is the RIGHT one, and the demo says so at `[t2]` — the narrowed guard runs
      //    within its extant budget, so the round in hand is the one the repair needs
      then(
        'it hands over the round in hand, which is what the repair needs',
        () => {
          expect(broken).toContain('ergo-coverage = 2/3 rounds spent — 1 left');
          expect(broken).toContain('spend the rounds in hand');
        },
      );

      // 🔴 the demoed C-specific diagnosis, ABSENT. `case=6` promises the refusal name the
      //    MALFUNCTION, hand over `route.mutate.guard` as step 1, and forbid a hand-run review
      then('🔴 the demoed malfunction diagnosis does NOT ship', () => {
        expect(broken).not.toContain('MALFUNCTION');
        expect(broken).not.toContain('route.mutate.guard');
        expect(broken).not.toContain('rhx review');
      });
    });
  });

  given('[case3] --stone matched several stones', () => {
    const stdout = formatBudgetGrantRefusalLines({
      refusal: {
        kind: 'stone-matched-many',
        guards: [
          '.behavior/x/5.1.execution.guard',
          '.behavior/x/5.2.review.guard',
          '.behavior/x/5.3.ship.guard',
        ],
      },
      route: '.behavior/v2026_09_03.example',
      stone: '5',
      add: 2,
      peer: null,
      level: null,
      meters: [],
    }).join('\n');

    when('[t0] the refusal is rendered', () => {
      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });

      // rule.require.errors-name-the-fix — a rejection that does not list the valid options is
      // a dead end. it names every stone it matched, so the driver re-runs with the one it meant
      then('it names each stone it matched, by its own name', () => {
        expect(stdout).toContain('   │  ├─ 5.1.execution');
        expect(stdout).toContain('   │  ├─ 5.2.review');
        expect(stdout).toContain('   │  ├─ 5.3.ship');
      });

      // a driver types a STONE name, never a guard path — the `.guard` suffix and the route
      // prefix are the engine's, so a remedy that echoes them is a remedy that cannot be copied
      then('the stone rows carry no guard suffix and no route prefix', () => {
        expect(stdout).not.toContain('5.1.execution.guard');
        expect(stdout).not.toContain('.behavior/x/');
      });

      then('it offers a runnable command per stone', () => {
        expect(stdout).toContain(
          'rhx route.guard.budget --for review --add 2 --stone 5.1.execution',
        );
      });
    });
  });
});
