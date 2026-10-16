import { given, then, when } from 'test-fns';

import { getOneRejectedUnforgivenTotal } from './getOneRejectedUnforgivenTotal';

describe('getOneRejectedUnforgivenTotal', () => {
  given(
    '[case1] a mix of approved, rejected, broken, and forgiven lanes',
    () => {
      when('[t0] the total is counted', () => {
        const total = getOneRejectedUnforgivenTotal({
          reviews: [
            { exitClass: 'passed', blockers: 0, index: 1 },
            { exitClass: 'passed', blockers: 2, index: 2 },
            { exitClass: 'malfunction', blockers: 1, index: 3 },
            { exitClass: 'passed', blockers: 1, index: 4 },
            { exitClass: 'passed', blockers: 3, index: 5 },
          ],
          isLevelOverruled: (index) => index === 5,
        });

        then(
          'only rejected lanes that did not break and are not forgiven count',
          () => {
            expect(total).toEqual(2);
          },
        );
      });
    },
  );

  given('[case2] no lanes', () => {
    when('[t0] the total is counted', () => {
      const total = getOneRejectedUnforgivenTotal({
        reviews: [],
        isLevelOverruled: () => false,
      });

      then('it is zero', () => {
        expect(total).toEqual(0);
      });
    });
  });
});
