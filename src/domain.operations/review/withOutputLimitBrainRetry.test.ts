import { MalfunctionError } from 'helpful-errors';
import { getError, given, then, when } from 'test-fns';

import { isErrorOfReplyCutAtOutputLimit } from './isErrorOfReplyCutAtOutputLimit';
import { withOutputLimitBrainRetry } from './withOutputLimitBrainRetry';

/**
 * .what = a cutoff fault shaped as the brain package throws it
 * .why = the wrapper reads `metadata.finishReason` by shape, so the fake must carry it
 */
const asFaultCutoff = (input: { generationId: string }) =>
  new MalfunctionError("openrouter's reply was cut off at the output limit", {
    finishReason: 'length',
    provider: 'InferenceNet',
    generationId: input.generationId,
    contentLength: 0,
    tokensOutput: 131072,
    errorMessage: null,
  });

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
 * .what = an onRetry that records each event it was handed
 * .note = deliberate mutation, in a scoped zone: `events` accumulates via push
 */
const genOnRetry = () => {
  const events: unknown[] = [];
  const onRetry = (event: unknown) => void events.push(event);
  return { onRetry, events };
};

describe('withOutputLimitBrainRetry', () => {
  given('[case1] a call that answers at once', () => {
    when('[t0] it runs', () => {
      then('it answers with one call, and reports no retry', async () => {
        const ask = genFakeAsk({ faults: [] });
        const spy = genOnRetry();
        const result = await withOutputLimitBrainRetry({
          operation: ask.operation,
          signal: null,
          onRetry: spy.onRetry,
        });
        expect(result).toEqual({ answer: 'answer', runaways: [] });
        expect(ask.calls.length).toEqual(1);
        expect(spy.events.length).toEqual(0);
      });
    });
  });

  given('[case2] a reply cut at the output limit once, then an answer', () => {
    when('[t0] it runs', () => {
      then('it asks once more and answers', async () => {
        const ask = genFakeAsk({
          faults: [asFaultCutoff({ generationId: 'gen-a' })],
        });
        const result = await withOutputLimitBrainRetry({
          operation: ask.operation,
          signal: null,
          onRetry: genOnRetry().onRetry,
        });
        expect(result.answer).toEqual('answer');
        expect(ask.calls.length).toEqual(2);
      });

      then(
        'it returns the billed first ask beside the answer, so the caller can meter it',
        async () => {
          const ask = genFakeAsk({
            faults: [asFaultCutoff({ generationId: 'gen-a' })],
          });
          const result = await withOutputLimitBrainRetry({
            operation: ask.operation,
            signal: null,
            onRetry: genOnRetry().onRetry,
          });
          expect(result.runaways).toEqual([
            {
              provider: 'InferenceNet',
              generationId: 'gen-a',
              tokensOutput: 131072,
            },
          ]);
        },
      );

      then(
        'it reports the billed first ask, with its host and generation',
        async () => {
          const ask = genFakeAsk({
            faults: [asFaultCutoff({ generationId: 'gen-a' })],
          });
          const spy = genOnRetry();
          await withOutputLimitBrainRetry({
            operation: ask.operation,
            signal: null,
            onRetry: spy.onRetry,
          });
          expect(spy.events).toMatchObject([
            {
              evidence: {
                provider: 'InferenceNet',
                generationId: 'gen-a',
                tokensOutput: 131072,
              },
            },
          ]);
        },
      );
    });
  });

  given('[case3] a reply cut at the output limit on both asks', () => {
    when('[t0] it runs', () => {
      then(
        'the lane malfunctions after two asks, with both asks named',
        async () => {
          const ask = genFakeAsk({
            faults: [
              asFaultCutoff({ generationId: 'gen-a' }),
              asFaultCutoff({ generationId: 'gen-b' }),
              asFaultCutoff({ generationId: 'gen-c' }),
            ],
          });
          const error = await getError(
            withOutputLimitBrainRetry({
              operation: ask.operation,
              signal: null,
              onRetry: genOnRetry().onRetry,
            }),
          );
          expect(ask.calls.length).toEqual(2);
          expect(error).toBeInstanceOf(MalfunctionError);
          expect(error.message).toContain(
            'the brain ran to its output limit on two asks in a row',
          );
          expect(error.message).toContain('gen-a');
          expect(error.message).toContain('gen-b');
        },
      );

      then(
        'the malfunction still reads as a cutoff, so no outer retry adds a third ask',
        async () => {
          const ask = genFakeAsk({
            faults: [
              asFaultCutoff({ generationId: 'gen-a' }),
              asFaultCutoff({ generationId: 'gen-b' }),
            ],
          });
          const error = await getError(
            withOutputLimitBrainRetry({
              operation: ask.operation,
              signal: null,
              onRetry: genOnRetry().onRetry,
            }),
          );
          expect(isErrorOfReplyCutAtOutputLimit({ error })).toEqual(true);
        },
      );
    });
  });

  given('[case4] a cutoff, then a different fault on the second ask', () => {
    when('[t0] it runs', () => {
      then('the second fault rethrows unchanged', async () => {
        const ask = genFakeAsk({
          faults: [
            asFaultCutoff({ generationId: 'gen-a' }),
            new Error('schema parse failed'),
          ],
        });
        const error = await getError(
          withOutputLimitBrainRetry({
            operation: ask.operation,
            signal: null,
            onRetry: genOnRetry().onRetry,
          }),
        );
        expect(error.message).toEqual('schema parse failed');
        expect(ask.calls.length).toEqual(2);
      });
    });
  });

  given('[case5] a fault that is not a cutoff', () => {
    when('[t0] it runs', () => {
      then('it rethrows at once, with no retry', async () => {
        const ask = genFakeAsk({
          faults: [Object.assign(new Error('504'), { status: 504 })],
        });
        const spy = genOnRetry();
        const error = await getError(
          withOutputLimitBrainRetry({
            operation: ask.operation,
            signal: null,
            onRetry: spy.onRetry,
          }),
        );
        expect(error.message).toEqual('504');
        expect(ask.calls.length).toEqual(1);
        expect(spy.events.length).toEqual(0);
      });
    });
  });

  given('[case6] a cutoff after the deadline abandoned the wait', () => {
    when('[t0] it runs with an aborted signal', () => {
      then('it bills no second ask — the cutoff rethrows at once', async () => {
        const ask = genFakeAsk({
          faults: [asFaultCutoff({ generationId: 'gen-a' })],
        });
        const controller = new AbortController();
        controller.abort();
        const error = await getError(
          withOutputLimitBrainRetry({
            operation: ask.operation,
            signal: controller.signal,
            onRetry: genOnRetry().onRetry,
          }),
        );
        expect(isErrorOfReplyCutAtOutputLimit({ error })).toEqual(true);
        expect(ask.calls.length).toEqual(1);
      });
    });
  });
});
