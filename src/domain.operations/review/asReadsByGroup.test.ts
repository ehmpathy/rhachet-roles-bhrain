import { given, then, when } from 'test-fns';

import { asReadsByGroup } from '@src/domain.operations/review/asReadsByGroup';

/**
 * .what = clamps the split half of the one-bounded-pour read
 * .why = a cursor walk across a flat array, so an off-by-one is invisible to
 *        a caller that sums or counts — arity stays right while two groups
 *        silently swap a member. this is the grain where that is visible.
 */
describe('asReadsByGroup', () => {
  given('[case1] three groups of unequal size', () => {
    when('[t0] the flat reads are split', () => {
      then('🔴 each group gets ITS OWN slice, in the order flattened', () => {
        const byGroup = asReadsByGroup({
          names: ['a', 'b', 'c'] as const,
          groups: { a: ['a1', 'a2'], b: ['b1'], c: ['c1', 'c2', 'c3'] },
          reads: ['a1', 'a2', 'b1', 'c1', 'c2', 'c3'],
        });
        expect(byGroup).toEqual({
          a: ['a1', 'a2'],
          b: ['b1'],
          c: ['c1', 'c2', 'c3'],
        });
      });
    });
  });

  given('[case2] an EMPTY group between two populated ones', () => {
    when('[t0] the flat reads are split', () => {
      then(
        '🔴 the empty group answers empty and consumes no read from its neighbours',
        () => {
          // `conversation` is empty on a first round and sits between `refs`
          // and `targets` — a cursor that advanced by one here would hand
          // `targets` a `refs` read with the arity still intact
          const byGroup = asReadsByGroup({
            names: ['refs', 'conversation', 'targets'] as const,
            groups: { refs: ['r1'], conversation: [], targets: ['t1', 't2'] },
            reads: ['r1', 't1', 't2'],
          });
          expect(byGroup).toEqual({
            refs: ['r1'],
            conversation: [],
            targets: ['t1', 't2'],
          });
        },
      );
    });
  });

  given('[case3] the SAME path in two groups', () => {
    when('[t0] the flat reads are split', () => {
      then(
        '🔴 BOTH groups keep their own copy — the split parts by COUNT, never by path',
        () => {
          // a file may be both a rule and a target — a `find`-by-path split
          // would hand both groups the first read and lose the duplicate
          const byGroup = asReadsByGroup({
            names: ['rules', 'targets'] as const,
            groups: { rules: ['same.ts'], targets: ['same.ts', 'other.ts'] },
            reads: [
              { path: 'same.ts', at: 0 },
              { path: 'same.ts', at: 1 },
              { path: 'other.ts', at: 2 },
            ],
          });
          expect(byGroup.rules).toEqual([{ path: 'same.ts', at: 0 }]);
          expect(byGroup.targets).toEqual([
            { path: 'same.ts', at: 1 },
            { path: 'other.ts', at: 2 },
          ]);
        },
      );
    });
  });

  given('[case4] a read count that disagrees with the groups', () => {
    when('[t0] the split is attempted', () => {
      then('🔴 it FAILS LOUD rather than hands back short groups', () => {
        // a mismatch means the flatten and the split walked different lists;
        // silently short groups would reach the prompt as an absent rule
        // (rule.require.failloud)
        expect(() =>
          asReadsByGroup({
            names: ['a', 'b'] as const,
            groups: { a: ['a1', 'a2'], b: ['b1'] },
            reads: ['a1', 'a2'],
          }),
        ).toThrow('the reads do not match the groups they were poured from');
      });
    });
  });

  given('[case5] no groups at all', () => {
    when('[t0] the split is attempted', () => {
      then('it answers an empty record, and does not throw', () => {
        expect(asReadsByGroup({ names: [], groups: {}, reads: [] })).toEqual(
          {},
        );
      });
    });
  });
});
