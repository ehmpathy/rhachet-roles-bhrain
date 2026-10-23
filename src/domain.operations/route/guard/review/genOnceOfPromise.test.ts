import { given, then, useThen, when } from 'test-fns';

import { genOnceOfPromise } from './genOnceOfPromise';

describe('genOnceOfPromise', () => {
  given('[case1] a read that is asked for by several lanes at once', () => {
    when('[t0] three callers ask before the first read settles', () => {
      const result = useThen('each caller gets an answer', async () => {
        const calls: string[] = [];
        const get = genOnceOfPromise({
          read: async () => {
            calls.push('read');
            await new Promise((done) => setTimeout(done, 10));
            return ['a.ts', 'b.ts'];
          },
        });
        const answers = await Promise.all([get(), get(), get()]);
        return { calls, answers };
      });

      then('🔴 the read ran exactly once', () => {
        // the defect this clamps: each lane of a guard pass walked the whole
        // since-main diff for one shared answer
        expect(result.calls).toEqual(['read']);
      });

      then('every caller receives the same answer', () => {
        for (const answer of result.answers)
          expect(answer).toEqual(['a.ts', 'b.ts']);
      });
    });
  });

  given('[case2] a read that no caller asks for', () => {
    when('[t0] the getter is built but never called', () => {
      then('the read never starts — a pass that never asks pays naught', () => {
        const calls: string[] = [];
        genOnceOfPromise({
          read: async () => {
            calls.push('read');
            return [];
          },
        });
        expect(calls).toEqual([]);
      });
    });
  });

  given('[case3] a read whose first attempt rejects', () => {
    when(
      '[t0] two callers share the fault, then a third asks after it settles',
      () => {
        const result = useThen('each caller gets its outcome', async () => {
          const calls: string[] = [];
          const get = genOnceOfPromise({
            read: async () => {
              calls.push('read');
              await new Promise((done) => setTimeout(done, 10));
              if (calls.length === 1) throw new Error('transient');
              return ['a.ts'];
            },
          });
          const first = await Promise.allSettled([get(), get()]);
          const after = await get();
          return { calls, first, after };
        });

        then('callers in flight share the one rejection', () => {
          expect(result.first.map((outcome) => outcome.status)).toEqual([
            'rejected',
            'rejected',
          ]);
        });

        then(
          '🔴 the rejection is not cached — the next caller reads afresh',
          () => {
            expect(result.calls).toEqual(['read', 'read']);
            expect(result.after).toEqual(['a.ts']);
          },
        );
      },
    );
  });
});
