import { sleep } from 'iso-time';
import { getError, given, then, when } from 'test-fns';

import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

describe('getAllResultsInBoundedPool', () => {
  given('[case1] a list longer than the bound', () => {
    const items = [1, 2, 3, 4, 5, 6, 7];

    when('[t0] poured at a bound of 3', () => {
      then('every result comes back, in the order asked', async () => {
        const results = await getAllResultsInBoundedPool({
          items,
          bound: 3,
          map: async (one) => one * 10,
        });

        // 🔴 order is the contract the three call sites lean on — the
        // cache-stability sort reads `getAllTargetsTouchedAt`'s output
        // positionally against its input, so a reordered pour would
        // silently mis-attribute every target's mtime
        expect(results).toEqual([10, 20, 30, 40, 50, 60, 70]);
      });

      then('no more than the bound run at one time', async () => {
        let inflight = 0;
        let inflightPeak = 0;

        await getAllResultsInBoundedPool({
          items,
          bound: 3,
          map: async (one) => {
            inflight += 1;
            inflightPeak = Math.max(inflightPeak, inflight);
            await sleep({ milliseconds: 1 });
            inflight -= 1;
            return one;
          },
        });

        expect(inflightPeak).toEqual(3);
      });
    });
  });

  given('[case2] an empty list', () => {
    when('[t0] poured', () => {
      then('it answers an empty list without a call to map', async () => {
        let calls = 0;
        const results = await getAllResultsInBoundedPool({
          items: [],
          bound: 8,
          map: async (one: number) => {
            calls += 1;
            return one;
          },
        });

        expect(results).toEqual([]);
        expect(calls).toEqual(0);
      });
    });
  });

  given('[case3] a bound that would open no slot', () => {
    // 🔴 the hazard this case exists for: `at += 0` spins forever on a
    // non-empty list. a hang with no error is the worst failure shape
    // available, so the bound is refused by name instead
    when('[t0] poured at a bound of 0', () => {
      then('it throws and names the bound', async () => {
        const error = await getError(
          getAllResultsInBoundedPool({
            items: [1, 2, 3],
            bound: 0,
            map: async (one) => one,
          }),
        );

        expect(error.message).toContain('bound of at least 1');
      });
    });

    when('[t1] poured at a fractional bound', () => {
      then('it throws — a partial slot is not a slot', async () => {
        const error = await getError(
          getAllResultsInBoundedPool({
            items: [1, 2, 3],
            bound: 1.5,
            map: async (one) => one,
          }),
        );

        expect(error.message).toContain('bound of at least 1');
      });
    });
  });

  given('[case4] a map that rejects on one item', () => {
    when('[t0] poured', () => {
      then('the rejection surfaces rather than being swallowed', async () => {
        const error = await getError(
          getAllResultsInBoundedPool({
            items: [1, 2, 3],
            bound: 2,
            map: async (one) => {
              if (one === 2) throw new Error('the second item is a defect');
              return one;
            },
          }),
        );

        expect(error.message).toContain('the second item is a defect');
      });
    });

    when('[t1] poured one at a time', () => {
      then('🔴 no item after the fault is pulled', async () => {
        const pulled: number[] = [];
        await getError(
          getAllResultsInBoundedPool({
            items: [1, 2, 3, 4, 5, 6],
            bound: 1,
            map: async (one: number) => {
              pulled.push(one);
              if (one === 2) throw new Error('the second item is a defect');
              return one;
            },
          }),
        );

        expect(pulled).toEqual([1, 2]);
      });
    });
  });

  given('[case5] 🔴 clamp. one slow item among fast ones', () => {
    // the hazard: lockstep waves idle every slot of a wave until its slowest item
    // settles, so one long brain call stalls the whole pour. a continuous pool
    // keeps the other slots at work
    when('[t0] poured at a bound of 2', () => {
      then(
        'items past the first bound start before the slow item settles',
        async () => {
          const events: string[] = [];
          const results = await getAllResultsInBoundedPool({
            items: [1, 2, 3, 4],
            bound: 2,
            map: async (one: number) => {
              events.push(`start ${one}`);
              await sleep({ milliseconds: one === 1 ? 200 : 1 });
              events.push(`end ${one}`);
              return one * 10;
            },
          });

          expect(results).toEqual([10, 20, 30, 40]);
          expect(events.indexOf('start 4')).toBeLessThan(
            events.indexOf('end 1'),
          );
        },
      );
    });
  });
});
