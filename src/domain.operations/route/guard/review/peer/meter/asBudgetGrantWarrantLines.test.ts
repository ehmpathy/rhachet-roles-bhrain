import { given, then, when } from 'test-fns';

import { asBudgetGrantWarrantLines } from './asBudgetGrantWarrantLines';

/**
 * .what = the rows a GRANTED budget top-up renders to name the warrant that earned it
 * .why = the block states which reviewer's concession bought the round, and asks the driver for
 *        the sentence its human is owed. both halves were reachable only through an acceptance
 *        snapshot, where a passive reword reads as a byte diff rather than a broken promise.
 */
describe('asBudgetGrantWarrantLines', () => {
  given('[case1] one reviewer held the warrant', () => {
    when('[t0] the rows are built', () => {
      const lines = asBudgetGrantWarrantLines({ warrantSlugs: ['mech-rules'] });
      const stdout = lines.join('\n');

      then('the grant names the fact the gate actually read', () => {
        expect(stdout).toContain(
          'granted — earned by a live urgent concession',
        );
        expect(stdout).toContain('mech-rules · conceded urgent');
      });

      // 🔴 the warn is an obligation the driver discharges in prose it writes. no mechanism mails
      //    anyone, so a passive `your human is warned` names no actor (`rule.avoid.passive-voice`)
      //    and reads as a notice already delivered. ⇒ a driver that trusts it writes naught, and
      //    the human meets the spend as an unexplained diff
      //
      // 🟡 the scope named is the stone, never a pull or a tree — budget is granted per stone,
      //    so the stone is what bought it and what a human asks about
      then('the warn asks the driver to write it, never reports a send', () => {
        expect(stdout).toContain(
          'tell your human why this stone bought budget',
        );
        expect(stdout).not.toContain('is warned');
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });
    });
  });

  // a bare `--add` scopes to a whole level, so several reviewers may each hold a live urgent
  // concession. the branch prefix must close on the last one, or the tree hangs open
  given('[case2] several reviewers held the warrant', () => {
    when('[t0] the rows are built', () => {
      const lines = asBudgetGrantWarrantLines({
        warrantSlugs: ['linter', 'spellcheck', 'mech-rules'],
      });
      const stdout = lines.join('\n');

      then(
        'every warrant holder is named, and the branch closes on the last',
        () => {
          expect(stdout).toContain('   │  ├─ linter · conceded urgent');
          expect(stdout).toContain('   │  ├─ spellcheck · conceded urgent');
          expect(stdout).toContain('   │  └─ mech-rules · conceded urgent');
        },
      );

      // the ask is one sentence however many lanes earned it — a driver owes its human a why,
      // not a why per lane
      then('the warn is asked once, never once per holder', () => {
        expect(stdout.split('tell your human').length - 1).toEqual(1);
      });

      then('the bytes a driver reads are pinned', () => {
        expect(stdout).toMatchSnapshot();
      });
    });
  });
});
