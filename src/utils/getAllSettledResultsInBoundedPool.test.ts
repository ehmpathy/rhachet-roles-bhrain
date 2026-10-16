import { sleep } from 'iso-time';
import { getError, given, then, useThen, when } from 'test-fns';

import { getAllSettledResultsInBoundedPool } from '@src/utils/getAllSettledResultsInBoundedPool';

describe('getAllSettledResultsInBoundedPool', () => {
  given(
    '[case1] a map that rejects on one item among the first in flight',
    () => {
      const items = [1, 2, 3, 4, 5];
      const map = async (one: number): Promise<number> => {
        if (one === 2) throw new Error('the second item is a defect');
        await sleep({ milliseconds: 1 });
        return one * 10;
      };

      when('[t0] poured at a bound of 2', () => {
        const pour = useThen('the pour settles', async () => ({
          outcomes: await getAllSettledResultsInBoundedPool({
            items,
            bound: 2,
            map,
          }),
        }));

        then(
          'every item settles — the fault drops no peer, in flight or after',
          () => {
            // 🔴 the plain pour would reject here, and items 3..5 would never run.
            //    a review pour that drops them discards verdicts already paid for
            expect(pour.outcomes.map((outcome) => outcome.status)).toEqual([
              'fulfilled',
              'rejected',
              'fulfilled',
              'fulfilled',
              'fulfilled',
            ]);
          },
        );

        then('each fulfilled value keeps its place in the order asked', () => {
          expect(
            pour.outcomes.map((outcome) =>
              outcome.status === 'fulfilled' ? outcome.value : null,
            ),
          ).toEqual([10, null, 30, 40, 50]);
        });

        then('the rejection carries the thrown error, never a blank', () => {
          const rejected = pour.outcomes[1];

          expect(rejected?.status).toEqual('rejected');
          expect(
            rejected?.status === 'rejected' ? String(rejected.reason) : null,
          ).toContain('the second item is a defect');
        });
      });
    },
  );

  given('[case2] a map that throws synchronously', () => {
    when('[t0] poured', () => {
      then(
        'the sync throw settles as a rejection, never escapes the pour',
        async () => {
          const outcomes = await getAllSettledResultsInBoundedPool({
            items: [1, 2],
            bound: 2,
            map: (one: number): Promise<number> => {
              if (one === 1) throw new Error('a sync defect');
              return sleep({ milliseconds: 0 }).then(() => one);
            },
          });

          expect(outcomes.map((outcome) => outcome.status)).toEqual([
            'rejected',
            'fulfilled',
          ]);
        },
      );
    });
  });

  given('[case3] a bound that would never advance the pour', () => {
    when('[t0] poured at a bound of 0', () => {
      then(
        'it still refuses the bound by name — the settle never hides a misuse',
        async () => {
          const error = await getError(
            getAllSettledResultsInBoundedPool({
              items: [1],
              bound: 0,
              map: async (one) => one,
            }),
          );

          expect(error.message).toContain('bound of at least 1');
        },
      );
    });
  });
});
