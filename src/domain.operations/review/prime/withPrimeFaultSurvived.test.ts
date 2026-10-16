import { getError, given, then, useThen, when } from 'test-fns';

import { withPrimeFaultSurvived } from './withPrimeFaultSurvived';

/**
 * .what = runs the leaf with stderr captured
 * .note = deliberate mutation, in a scoped zone: `lines` accumulates via push, and the hand
 *         fake restores in a `finally` so no other case inherits it
 */
const runWithStderr = async <T>(
  operation: () => Promise<T>,
): Promise<{ result: T; stderr: string[] }> => {
  const lines: string[] = [];
  const errorOriginal = console.error;
  console.error = (...args: unknown[]) => void lines.push(args.join(' '));
  try {
    const result = await operation();
    return { result, stderr: lines };
  } finally {
    console.error = errorOriginal;
  }
};

describe('withPrimeFaultSurvived', () => {
  given('[case1] a prime that settles', () => {
    when('[t0] it runs', () => {
      const scene = useThen('it returns the value', async () =>
        runWithStderr(() =>
          withPrimeFaultSurvived({
            operation: async () => 'poked',
            peers: 'lanes',
          }),
        ),
      );

      then('the value is returned, and stderr stays quiet', () => {
        expect(scene.result).toEqual({ settled: true, value: 'poked' });
        expect(scene.stderr).toEqual([]);
      });
    });
  });

  given('[case2] a prime that hits a provider fault, for a split lane', () => {
    when('[t0] it runs', () => {
      const fault = new Error('openrouter 503: provider unavailable');
      const scene = useThen('it survives the fault', async () =>
        runWithStderr(() =>
          withPrimeFaultSurvived({
            operation: async () => {
              throw fault;
            },
            peers: 'partitions',
          }),
        ),
      );

      then('the fault is returned, never dropped', () => {
        expect(scene.result).toEqual({
          settled: false,
          fault: { error: fault },
        });
      });

      then('the one prime fault sentence names the partitions', () => {
        expect(scene.stderr).toEqual([
          '💥 MalfunctionError: the prime of the shared prefix failed (openrouter 503: provider unavailable); its peer partitions pour cold',
        ]);
      });
    });
  });

  given('[case3] a prime that throws a defect in our own code', () => {
    when('[t0] it runs', () => {
      then('the defect rethrows as itself', async () => {
        const error = await getError(
          withPrimeFaultSurvived({
            operation: async () => {
              throw new TypeError('cannot read properties of null');
            },
            peers: 'lanes',
          }),
        );
        expect(error).toBeInstanceOf(TypeError);
      });
    });
  });
});
