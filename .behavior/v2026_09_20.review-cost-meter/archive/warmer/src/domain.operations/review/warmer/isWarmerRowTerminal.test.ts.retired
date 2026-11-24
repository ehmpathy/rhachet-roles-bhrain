import { getError, given, then, useThen, when } from 'test-fns';

import { isWarmerRowTerminal } from './isWarmerRowTerminal';
import type { WarmerPokeRow, WarmerPokeRowQuiet } from './WarmerPokeRow';

/**
 * .what = builds a row of a given act, with the rest of the envelope held constant
 * .why = the operation reads ONE field. every other field is noise to it, so the
 *        fixture pins them and varies `act` alone — a test that varied two fields
 *        could not say which one moved the verdict
 */
const asRowQuiet = (act: WarmerPokeRowQuiet['act']): WarmerPokeRowQuiet => ({
  at: '2026-09-25T00:00:00.000Z',
  reviewer: 'repo-rules',
  attempt: 1,
  act,
  why: `a ${act} row`,
  measured: null,
});

/**
 * .what = builds a row of any act — a poke carries the measurement its type demands
 * .why = the row type is a union on `act`, so a poke with no measurement cannot be built
 */
const asRow = (act: WarmerPokeRow['act']): WarmerPokeRow => {
  // a poke always carries what it measured
  if (act === 'poke')
    return {
      ...asRowQuiet('defer'),
      act,
      why: 'a poke row',
      measured: {
        promptTokens: 3_225,
        cacheGetTokens: 0,
        hit: false,
        cost: '$0.000428',
      },
    };

  // every other act measured naught
  return asRowQuiet(act);
};

describe('isWarmerRowTerminal', () => {
  given('[case1] a `retire` row — the one act a healthy plan ends on', () => {
    when('[t0] the reader asks whether the plan finished', () => {
      then('🔴 it answers TRUE', () => {
        // `retire` is the terminator `setReviewWarmerPokes` writes when a plan spends its
        // last poke. it is the ONLY act that means "this ledger is whole", so a
        // false here would render every complete plan's cost as a floor
        expect(isWarmerRowTerminal(asRow('retire'))).toEqual(true);
      });
    });
  });

  given('[case2] the three acts a plan continues through', () => {
    when('[t0] each is read as a tail', () => {
      then('🔴 `poke` is NOT terminal', () => {
        // a poke at the tail means the process died mid-plan — the truncation case
        expect(isWarmerRowTerminal(asRow('poke'))).toEqual(false);
      });

      then('🔴 `defer` is NOT terminal', () => {
        // a defer reschedules, so more rows were owed and never arrived
        expect(isWarmerRowTerminal(asRow('defer'))).toEqual(false);
      });

      then('🔴 `fault` is NOT terminal — the case worth the note', () => {
        // a fault is NOT fatal: the warmer survives it and keeps its schedule, so
        // a fault mid-plan is followed by more rows and then a `retire`. a fault
        // at the TAIL therefore means exactly what an absent terminator means —
        // the plan did not finish
        expect(isWarmerRowTerminal(asRow('fault'))).toEqual(false);
      });
    });
  });

  given('[case3] every declared act, walked as a set', () => {
    // the census is derived from the UNION, never hand-counted. a `Record` over
    // the union demands one key per member, so a fifth act added to
    // `WarmerPokeRow['act']` fails the typecheck HERE until it is walked — a
    // literal list and a `toHaveLength` would only have graded themselves
    const CENSUS_OF_ACTS = {
      poke: true,
      defer: true,
      retire: true,
      fault: true,
    } satisfies Record<WarmerPokeRow['act'], true>;
    const acts = Object.keys(CENSUS_OF_ACTS) as WarmerPokeRow['act'][];

    when('[t0] the set is read', () => {
      then('exactly ONE act is terminal', () => {
        const terminal = acts.filter((act) => isWarmerRowTerminal(asRow(act)));
        expect(terminal).toEqual(['retire']);
      });
    });
  });

  given('[case4] an act outside the declared union', () => {
    /**
     * .why = this is the branch no caller can reach, and the only place it can be
     *        proven to fire at all. `getOneWarmerCost` is the one reader, and it
     *        feeds rows parsed from a ledger this repo writes — so every row it
     *        hands over carries a declared act by construction, and the
     *        integration coverage through that caller exercises three of the
     *        four cases and cannot exercise the default. a cast is the only way
     *        in, and without this case the gate is an assertion nobody checked.
     *
     *        two dreams already want a fifth act (`covered`, and a marker for a
     *        failed ledger write), so this branch is scheduled to fire
     *        (rule.prefer.prevent-over-correct).
     */
    when('[t0] the reader is handed it', () => {
      const thrown = useThen('it throws', async () => ({
        error: await getError(async () =>
          isWarmerRowTerminal({
            ...asRowQuiet('defer'),
            act: 'covered' as WarmerPokeRowQuiet['act'],
          }),
        ),
      }));

      then('🔴 it THROWS rather than answers', () => {
        // a silent `false` would be the worse outcome by far: a new act would render
        // every plan that ended on it as TRUNCATED, so a whole ledger's cost would
        // report as a floor with no reason a reader could find (rule.forbid.failhide)
        expect(thrown.error.message).toContain(
          'does not say whether it ends a plan',
        );
      });

      then('and the error names the act, so the gap is traceable', () => {
        // an author who adds an act and trips this needs to know WHICH one, or they
        // must re-read the union to find their own edit
        expect(JSON.stringify(thrown.error)).toContain('covered');
      });
    });
  });
});
