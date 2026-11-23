import { getError, given, then, when } from 'test-fns';

import { withRetry } from './withRetry';

/**
 * .what = a context whose log records each warn
 */
const genContext = () => {
  const warns: string[] = [];
  return {
    warns,
    context: { log: { warn: (message: string) => warns.push(message) } },
  };
};

describe('withRetry', () => {
  given('[case1] a call that fails once, then succeeds', () => {
    when('[t0] it is invoked', () => {
      then(
        'the second attempt answers, and the first failure is warned',
        async () => {
          const { warns, context } = genContext();
          const attempts: number[] = [];
          const logic = withRetry(async (input: { n: number }) => {
            attempts.push(input.n);
            if (attempts.length === 1) throw new Error('transient');
            return input.n * 2;
          });
          expect(await logic({ n: 3 }, context)).toEqual(6);
          expect(attempts).toEqual([3, 3]);
          expect(warns).toEqual([
            'withRetry.progress: caught an error, will retry',
          ]);
        },
      );
    });
  });

  given('[case2] a call that fails twice', () => {
    when('[t0] it is invoked', () => {
      then('the second failure surfaces', async () => {
        const { context } = genContext();
        const logic = withRetry(async (_: { n: number }) => {
          throw new Error('durable');
        });
        const error = await getError(logic({ n: 1 }, context));
        expect(error.message).toEqual('durable');
      });
    });
  });

  given('[case3] a call that throws a non-Error', () => {
    when('[t0] it is invoked', () => {
      then('it rethrows at once, with no retry', async () => {
        const { warns, context } = genContext();
        const attempts: number[] = [];
        const logic = withRetry(async (input: { n: number }) => {
          attempts.push(input.n);
          throw 'not an error';
        });
        await expect(logic({ n: 1 }, context)).rejects.toEqual('not an error');
        expect(attempts).toEqual([1]);
        expect(warns).toEqual([]);
      });
    });
  });
});
