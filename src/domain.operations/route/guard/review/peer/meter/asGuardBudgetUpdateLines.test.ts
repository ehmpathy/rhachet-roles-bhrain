import { given, then, when } from 'test-fns';

import { DISPUTED_NARRATIVE } from '../../../tree/formatGuardReviewerTree';
import {
  asGuardBudgetUpdateLines,
  DISPUTED_UNTOUCHED_SUFFIX,
  DISPUTED_UPDATE_SUFFIX,
} from './asGuardBudgetUpdateLines';

const anUpdate = (input: {
  peer: string;
  budgetBefore: number;
  budgetAfter: number;
}): { peer: string; budgetBefore: number; budgetAfter: number } => input;

describe('asGuardBudgetUpdateLines', () => {
  given('[case1] no lane is quiet — the extant shape', () => {
    when('[t0] two lanes are raised', () => {
      const lines = asGuardBudgetUpdateLines({
        updates: [
          anUpdate({ peer: 'mechanic', budgetBefore: 4, budgetAfter: 6 }),
          anUpdate({ peer: 'architect', budgetBefore: 4, budgetAfter: 6 }),
        ],
        disputeSkippedSlugs: [],
      });

      then('each renders its arithmetic, and no dispute is claimed', () => {
        expect(lines).toEqual([
          '      ├─ mechanic: 4 → 6',
          '      └─ architect: 4 → 6',
        ]);
      });
    });

    when('[t1] a budget is infinite', () => {
      then('it renders ∞ rather than the js literal', () => {
        expect(
          asGuardBudgetUpdateLines({
            updates: [
              anUpdate({
                peer: 'mechanic',
                budgetBefore: 4,
                budgetAfter: Infinity,
              }),
            ],
            disputeSkippedSlugs: [],
          }),
        ).toEqual(['      └─ mechanic: 4 → ∞']);
      });
    });
  });

  given(
    '[case2] the ONE-lane form — the driver tops up the disputed lane',
    () => {
      // .why = case=1 [t4b]. the budget rises and the lane still does not run, so the emit must say
      //        so "rather than a silent no-op" (rule.forbid.surprises)
      when('[t0] the raised lane is the quiet one', () => {
        const lines = asGuardBudgetUpdateLines({
          updates: [
            anUpdate({ peer: 'architect', budgetBefore: 4, budgetAfter: 6 }),
          ],
          disputeSkippedSlugs: ['architect'],
        });
        const stdout = lines.join('\n');

        then('the arithmetic still renders — the budget DID rise', () => {
          expect(stdout).toContain('architect: 4 → 6');
        });

        then('the skip is named, so the top-up is no silent no-op', () => {
          expect(stdout).toContain('disputed');
          expect(stdout).toContain('does not run this generation');
        });

        then('the rounds are DEFERRED, never reported as lost', () => {
          // .why = under S03 the skip lapses when the artifact next moves, so `wasted` was never
          //        true and `will not run` (unbounded) goes false past the next edit (case=9 §2)
          expect(stdout).toContain('the rounds carry to the next');
          expect(stdout).not.toContain('wasted');
          expect(stdout).not.toContain('lost');
        });

        then('exactly ONE row renders — the lane is not named twice', () => {
          expect(lines).toHaveLength(1);
        });
      });
    },
  );

  given(
    '[case3] 🔴 the TWO-lane form — one lane re-armed, one left dark',
    () => {
      // .why = case=9 §2, "the hardest single ask in the vision". a lane the --peer filter skipped
      //        produces NO update record, so it cannot be annotated — it must be ADDED, or "the
      //        driver is left to infer the architect's silence"
      when('[t0] the top-up targets the conceded lane', () => {
        const lines = asGuardBudgetUpdateLines({
          updates: [
            anUpdate({ peer: 'ergonomist', budgetBefore: 4, budgetAfter: 6 }),
          ],
          disputeSkippedSlugs: ['architect'],
        });
        const stdout = lines.join('\n');

        then('BOTH outcomes are named, in one block', () => {
          expect(stdout).toContain('ergonomist');
          expect(stdout).toContain('architect');
          expect(lines).toHaveLength(2);
        });

        then('the re-armed lane reports its arithmetic and no dispute', () => {
          expect(lines[0]).toContain('ergonomist: 4 → 6');
          expect(lines[0]).not.toContain('disputed');
        });

        then('the dark lane reports its silence and NO arithmetic', () => {
          // .why = the command did not touch it, so an arrow would assert a change that
          //        never happened
          expect(lines[1]).toContain('architect');
          expect(lines[1]).toContain('untouched');
          expect(lines[1]).toContain('does not run this generation');
          expect(lines[1]).not.toContain('→');
        });

        then(
          'the connectors stay a valid tree — one └─, and it is last',
          () => {
            expect(lines[0]).toContain('├─');
            expect(lines[1]).toContain('└─');
          },
        );
      });

      when('[t1] the top-up is unscoped, so BOTH lanes are raised', () => {
        const lines = asGuardBudgetUpdateLines({
          updates: [
            anUpdate({ peer: 'ergonomist', budgetBefore: 4, budgetAfter: 6 }),
            anUpdate({ peer: 'architect', budgetBefore: 4, budgetAfter: 6 }),
          ],
          disputeSkippedSlugs: ['architect'],
        });

        then('the dark lane is annotated in place, never duplicated', () => {
          expect(lines).toHaveLength(2);
          expect(lines[1]).toContain('architect: 4 → 6');
          expect(lines[1]).toContain('does not run this generation');
        });

        then('the lane that RAN carries no dispute claim', () => {
          expect(lines[0]).not.toContain('disputed');
        });
      });
    },
  );

  given('[case4] 🔴 the SCOPE word is shared with the guard tree', () => {
    // .why = the two surfaces phrase the fact differently on purpose, and they must never disagree
    //        on the scope. `this stone` would overstate the skip by every generation after the next
    //        edit — the exact cost F004 is graded on
    when('[t0] both constants are read', () => {
      then('each bounds the skip to a GENERATION, never to the stone', () => {
        expect(DISPUTED_NARRATIVE).toContain('this generation');
        expect(DISPUTED_UPDATE_SUFFIX).toContain('this generation');
        expect(DISPUTED_UNTOUCHED_SUFFIX).toContain('this generation');
      });

      then('none of them claims the wider scope', () => {
        expect(DISPUTED_NARRATIVE).not.toContain('this stone');
        expect(DISPUTED_UPDATE_SUFFIX).not.toContain('this stone');
        expect(DISPUTED_UNTOUCHED_SUFFIX).not.toContain('this stone');
      });
    });
  });
});
