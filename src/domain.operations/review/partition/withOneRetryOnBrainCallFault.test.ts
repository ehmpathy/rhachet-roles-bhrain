import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { ReviewBrainCallError } from '@src/domain.operations/review/ReviewBrainCallError';
import { ReviewTimeoutError } from '@src/domain.operations/review/ReviewTimeoutError';

import { withOneRetryOnBrainCallFault } from './withOneRetryOnBrainCallFault';

/**
 * .what = an operation that throws each error in `faults` in turn, then returns 'verdict'
 * .why = a fake partition run — it records how many times it was called
 */
const genOperationOfFaults = (input: { faults: Error[] }) => {
  const calls: number[] = [];
  const operation = async (): Promise<string> => {
    const fault = input.faults[calls.length];
    calls.push(calls.length);
    if (fault) throw fault;
    return 'verdict';
  };
  return { operation, calls };
};

const asSocketDrop = (): ReviewBrainCallError =>
  new ReviewBrainCallError({ error: new Error('terminated') });

/**
 * .what = a lane clock that began now, with a bound far ahead — time left to retry
 */
const asClockOpen = () => ({
  msOfReviewStart: Date.now(),
  brainCallTimeoutMs: 10 * 60_000,
});

/**
 * .what = a lane clock whose bound is already spent — no time left to retry
 */
const asClockSpent = () => ({
  msOfReviewStart: Date.now() - 5_000,
  brainCallTimeoutMs: 1_000,
});

describe('withOneRetryOnBrainCallFault', () => {
  given('[case1] a partition whose brain call drops once', () => {
    when('[t0] it runs', () => {
      then('the retry returns the verdict, after two calls', async () => {
        const fake = genOperationOfFaults({ faults: [asSocketDrop()] });
        const result = await withOneRetryOnBrainCallFault({
          name: 'src',
          clock: asClockOpen(),
          operation: fake.operation,
        });
        expect(result.value).toEqual('verdict');
        expect(fake.calls.length).toEqual(2);
      });

      then(
        '🔴 the swallowed fault is returned beside the verdict — its spend is unreported',
        async () => {
          const drop = asSocketDrop();
          const fake = genOperationOfFaults({ faults: [drop] });
          const result = await withOneRetryOnBrainCallFault({
            name: 'src',
            clock: asClockOpen(),
            operation: fake.operation,
          });
          expect(result.faults).toEqual([{ error: drop }]);
        },
      );
    });
  });

  given('[case2] a partition whose brain call drops twice in a row', () => {
    when('[t0] it runs', () => {
      then('the second fault surfaces, and no third call is made', async () => {
        const fake = genOperationOfFaults({
          faults: [asSocketDrop(), asSocketDrop()],
        });
        const error = await getError(
          withOneRetryOnBrainCallFault({
            name: 'src',
            clock: asClockOpen(),
            operation: fake.operation,
          }),
        );
        expect(error).toBeInstanceOf(ReviewBrainCallError);
        expect(fake.calls.length).toEqual(2);
      });
    });
  });

  given('[case3] a partition that times out', () => {
    when('[t0] it runs', () => {
      then('the timeout surfaces at once, with no retry', async () => {
        const fake = genOperationOfFaults({
          faults: [new ReviewTimeoutError({ timeoutMs: 1000 })],
        });
        const error = await getError(
          withOneRetryOnBrainCallFault({
            name: 'src',
            clock: asClockOpen(),
            operation: fake.operation,
          }),
        );
        expect(error).toBeInstanceOf(ReviewTimeoutError);
        expect(fake.calls.length).toEqual(1);
      });
    });
  });

  given(
    '[case5] a partition whose brain ran to its output limit, past its own retry',
    () => {
      when('[t0] it runs', () => {
        then(
          'the runaway surfaces at once — no third ask of the full output limit',
          async () => {
            const runaway = new ReviewBrainCallError({
              error: new MalfunctionError(
                'the brain ran to its output limit on two asks in a row',
                { finishReason: 'length' },
              ),
            });
            const fake = genOperationOfFaults({ faults: [runaway] });
            const error = await getError(
              withOneRetryOnBrainCallFault({
                name: 'src',
                clock: asClockOpen(),
                operation: fake.operation,
              }),
            );
            expect(error).toBe(runaway);
            expect(fake.calls.length).toEqual(1);
          },
        );
      });
    },
  );

  given(
    '[case6] a partition whose brain call drops after the lane bound is spent',
    () => {
      when('[t0] it runs', () => {
        then(
          '🔴 it settles as a timeout of the lane bound, with no re-ask',
          async () => {
            // silence the fault note with a hand fake; restored in `finally`
            const errorOriginal = console.error;
            console.error = () => {};
            try {
              const fake = genOperationOfFaults({ faults: [asSocketDrop()] });
              const error = await getError(
                withOneRetryOnBrainCallFault({
                  name: 'src',
                  clock: asClockSpent(),
                  operation: fake.operation,
                }),
              );
              expect(error).toBeInstanceOf(ReviewTimeoutError);
              expect(error.message).toContain('timed out after 1 second');
              expect(fake.calls.length).toEqual(1);
            } finally {
              console.error = errorOriginal;
            }
          },
        );
      });
    },
  );

  given('[case4] a partition that succeeds', () => {
    when('[t0] it runs', () => {
      then('it is called once, and swallows no fault', async () => {
        const fake = genOperationOfFaults({ faults: [] });
        const result = await withOneRetryOnBrainCallFault({
          name: 'src',
          clock: asClockOpen(),
          operation: fake.operation,
        });
        expect(result).toEqual({ value: 'verdict', faults: [] });
        expect(fake.calls.length).toEqual(1);
      });
    });
  });
});
