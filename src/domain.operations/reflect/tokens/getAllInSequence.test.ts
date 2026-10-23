import { given, then, useThen, when } from 'test-fns';

import { getAllInSequence } from './getAllInSequence';

describe('getAllInSequence', () => {
  given(
    '[case1] three items whose steps would finish out of order if run at once',
    () => {
      when('[t0] they are mapped', () => {
        const outcome = useThen('the map completes', async () => {
          // .note = deliberate mutation: a trace private to this test
          const inflightPeaks: number[] = [];
          const inflight = { count: 0 };
          const results = await getAllInSequence({
            items: [30, 10, 20],
            step: async (delay) => {
              inflight.count += 1;
              inflightPeaks.push(inflight.count);
              await new Promise((done) => setTimeout(done, delay));
              inflight.count -= 1;
              return delay * 2;
            },
          });
          return { results, inflightPeaks };
        });

        then('the results keep the input order', () => {
          expect(outcome.results).toEqual([60, 20, 40]);
        });

        then('no two steps ever run at once', () => {
          expect(Math.max(...outcome.inflightPeaks)).toEqual(1);
        });
      });
    },
  );

  given('[case2] no items', () => {
    when('[t0] they are mapped', () => {
      then('the result is empty and no step runs', async () => {
        const results = await getAllInSequence({
          items: [],
          step: async () => {
            throw new Error('a step ran on an empty list');
          },
        });
        expect(results).toEqual([]);
      });
    });
  });
});
