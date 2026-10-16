import { getError, given, then, when } from 'test-fns';

import { withTransientBrainRetry } from './withTransientBrainRetry';

const asFault504 = () => Object.assign(new Error('504'), { status: 504 });

/**
 * .what = a fake brain call that fails with the given faults, in order, then answers
 */
const genFakeAsk = (input: { faults: Error[] }) => {
  const calls: number[] = [];
  const operation = async () => {
    calls.push(calls.length);
    const fault = input.faults[calls.length - 1];
    if (fault) throw fault;
    return 'answer';
  };
  return { operation, calls };
};

/**
 * .what = an `onRetry` that records each fault it hears
 *
 * .note = deliberate mutation, in a scoped zone: `heard` accumulates via push
 */
const genRetryRecorder = () => {
  const heard: unknown[] = [];
  const onRetry = (event: { error: unknown }): void => {
    heard.push(event.error);
  };
  return { onRetry, heard };
};

describe('withTransientBrainRetry', () => {
  given('[case1] a call that answers at once', () => {
    when('[t0] it runs', () => {
      then('it answers with one call, and swallows no fault', async () => {
        const ask = genFakeAsk({ faults: [] });
        const recorder = genRetryRecorder();
        const result = await withTransientBrainRetry({
          operation: ask.operation,
          delays: [{ seconds: 0 }, { seconds: 0 }],
          signal: null,
          onRetry: recorder.onRetry,
        });
        expect(result).toEqual('answer');
        expect(ask.calls.length).toEqual(1);
        expect(recorder.heard).toEqual([]);
      });
    });
  });

  given('[case2] a call that 504s once, then answers', () => {
    when('[t0] it runs', () => {
      then('it asks again and answers', async () => {
        const ask = genFakeAsk({ faults: [asFault504()] });
        const result = await withTransientBrainRetry({
          operation: ask.operation,
          delays: [{ seconds: 0 }, { seconds: 0 }],
          signal: null,
          onRetry: () => {},
        });
        expect(result).toEqual('answer');
        expect(ask.calls.length).toEqual(2);
      });

      then(
        '🔴 it reports the fault it swallowed — that ask may have been billed',
        async () => {
          const fault = asFault504();
          const ask = genFakeAsk({ faults: [fault] });
          const recorder = genRetryRecorder();
          await withTransientBrainRetry({
            operation: ask.operation,
            delays: [{ seconds: 0 }, { seconds: 0 }],
            signal: null,
            onRetry: recorder.onRetry,
          });
          expect(recorder.heard).toEqual([fault]);
        },
      );
    });
  });

  given('[case3] a call that 504s past every retry', () => {
    when('[t0] it runs', () => {
      then(
        'the last fault rethrows, after one call per delay plus one',
        async () => {
          const ask = genFakeAsk({
            faults: [asFault504(), asFault504(), asFault504()],
          });
          const recorder = genRetryRecorder();
          const error = await getError(
            withTransientBrainRetry({
              operation: ask.operation,
              delays: [{ seconds: 0 }, { seconds: 0 }],
              signal: null,
              onRetry: recorder.onRetry,
            }),
          );
          expect(error.message).toEqual('504');
          expect(ask.calls.length).toEqual(3);

          // the two faults it retried past are reported; the last one rethrows instead
          expect(recorder.heard.length).toEqual(2);
        },
      );
    });
  });

  given('[case4] a call that fails with a non-transient fault', () => {
    when('[t0] it runs', () => {
      then('it rethrows at once, with no retry', async () => {
        const ask = genFakeAsk({ faults: [new Error('schema parse failed')] });
        const recorder = genRetryRecorder();
        const error = await getError(
          withTransientBrainRetry({
            operation: ask.operation,
            delays: [{ seconds: 0 }, { seconds: 0 }],
            signal: null,
            onRetry: recorder.onRetry,
          }),
        );
        expect(error.message).toEqual('schema parse failed');
        expect(ask.calls.length).toEqual(1);
        expect(recorder.heard).toEqual([]);
      });
    });
  });

  given(
    '[case5] a call that 504s after the deadline abandoned the wait',
    () => {
      when('[t0] it runs with an aborted signal', () => {
        then(
          'it bills no second ask — the fault rethrows at once',
          async () => {
            const ask = genFakeAsk({ faults: [asFault504()] });
            const recorder = genRetryRecorder();
            const controller = new AbortController();
            controller.abort();
            const error = await getError(
              withTransientBrainRetry({
                operation: ask.operation,
                delays: [{ seconds: 0 }, { seconds: 0 }],
                signal: controller.signal,
                onRetry: recorder.onRetry,
              }),
            );
            expect(error.message).toEqual('504');
            expect(ask.calls.length).toEqual(1);
            expect(recorder.heard).toEqual([]);
          },
        );
      });
    },
  );
});
