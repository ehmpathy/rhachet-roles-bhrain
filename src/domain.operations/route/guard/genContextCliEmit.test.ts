import { given, then, when } from 'test-fns';

import type { ContextGuardProgress } from '@src/domain.objects/Driver/ContextCliEmit';
import type { GuardProgressEvent } from '@src/domain.objects/Driver/GuardProgressEvent';

import { genContextCliEmit } from './genContextCliEmit';

/**
 * .what = creates a mock stderr write stream for test capture
 * .why = enables assertion on stderr output without real terminal
 */
const genMockStderr = (input: { isTTY: boolean }) => {
  const chunks: string[] = [];
  return {
    stream: {
      isTTY: input.isTTY,
      write: (chunk: string) => {
        chunks.push(chunk);
        return true;
      },
    } as unknown as NodeJS.WriteStream,
    chunks,
  };
};

/**
 * .what = creates a minimal guard progress event for tests
 * .why = reduces boilerplate in test cases
 */
const genEvent = (input: {
  phase: 'review' | 'judge';
  index: number;
  inflight: GuardProgressEvent['inflight'];
  outcome: GuardProgressEvent['outcome'];
}): GuardProgressEvent => ({
  stone: { name: '1.test', path: '/tmp/1.test.stone', guard: null },
  step: { phase: input.phase, index: input.index },
  inflight: input.inflight,
  outcome: input.outcome,
});

describe('genContextCliEmit', () => {
  given('[case1] non-tty mode — inflight event', () => {
    when('[t0] review inflight event emitted', () => {
      then('non-tty mode does not output inflight lines', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'review',
            index: 0,
            inflight: {
              beganAt: '2024-01-01T00:00:00.000Z',
              endedAt: null,
            },
            outcome: null,
          }),
        );

        done();

        // non-tty mode only shows completed results, not inflight
        expect(mock.chunks).toHaveLength(0);
      });
    });

    when('[t1] judge inflight event emitted', () => {
      then('non-tty mode does not output inflight lines for judge', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'judge',
            index: 0,
            inflight: {
              beganAt: '2024-01-01T00:00:00.000Z',
              endedAt: null,
            },
            outcome: null,
          }),
        );

        done();

        // non-tty mode only shows completed results, not inflight
        expect(mock.chunks).toHaveLength(0);
      });
    });
  });

  given('[case2] non-tty mode — completed review event', () => {
    when('[t0] review completed', () => {
      then('stderr prints result line with done status', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'review',
            index: 0,
            inflight: {
              beganAt: '2024-01-01T00:00:00.000Z',
              endedAt: '2024-01-01T00:00:12.400Z',
            },
            outcome: {
              path: '/tmp/.route/1.test.guard.review.i1.abc.r1.md',
              review: { blockers: 3, nitpicks: 1 },
              judge: null,
            },
          }),
        );

        done();

        expect(mock.chunks).toHaveLength(1);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✓ review.1 - done 12.4s');
      });
    });
  });

  given('[case3] non-tty mode — completed judge events', () => {
    when('[t0] judge completed with pass', () => {
      then('stderr prints result with passed status', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'judge',
            index: 0,
            inflight: {
              beganAt: '2024-01-01T00:00:00.000Z',
              endedAt: '2024-01-01T00:00:00.800Z',
            },
            outcome: {
              path: '/tmp/.route/1.test.guard.judge.i1p1.abc.def.j1.md',
              review: null,
              judge: { decision: 'passed', reason: 'all checks pass' },
            },
          }),
        );

        done();

        expect(mock.chunks).toHaveLength(1);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✓ judge.1 - passed 0.8s');
      });
    });

    when('[t1] judge completed with failure', () => {
      then('stderr prints result with failed status', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'judge',
            index: 0,
            inflight: {
              beganAt: '2024-01-01T00:00:00.000Z',
              endedAt: '2024-01-01T00:00:02.100Z',
            },
            outcome: {
              path: '/tmp/.route/1.test.guard.judge.i1p1.abc.def.j1.md',
              review: null,
              judge: {
                decision: 'failed',
                reason: 'blockers exceed threshold (3 > 0)',
              },
            },
          }),
        );

        done();

        expect(mock.chunks).toHaveLength(1);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✗ judge.1 - failed 2.1s');
      });
    });
  });

  given('[case4] tty mode — inflight event starts spinner', () => {
    when('[t0] review inflight event emitted in tty mode', () => {
      then('stderr receives \\r-prefixed writes from spinner', () => {
        jest.useFakeTimers();

        const mock = genMockStderr({ isTTY: true });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'review',
            index: 0,
            inflight: {
              beganAt: new Date().toISOString(),
              endedAt: null,
            },
            outcome: null,
          }),
        );

        // advance past a few spinner frames
        jest.advanceTimersByTime(240);

        // should have written at least 2 frames
        expect(mock.chunks.length).toBeGreaterThanOrEqual(2);

        // each write should use \r for overwrite
        for (const chunk of mock.chunks) {
          expect(chunk.startsWith('\r')).toBe(true);
        }

        // should contain inflight label
        const combined = mock.chunks.join('');
        expect(combined).toContain('review.1 - inflight');

        done();
        jest.useRealTimers();
      });
    });
  });

  given('[case5] tty mode — completed event after inflight', () => {
    when('[t0] inflight then completed event in tty mode', () => {
      then('spinner clears and result line seals with \\n', () => {
        jest.useFakeTimers();

        const mock = genMockStderr({ isTTY: true });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        // start inflight
        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'review',
            index: 0,
            inflight: {
              beganAt: new Date().toISOString(),
              endedAt: null,
            },
            outcome: null,
          }),
        );

        jest.advanceTimersByTime(160);

        // clear spinner chunks for clarity
        const chunkCountBeforeFinish = mock.chunks.length;

        // emit completed event
        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'review',
            index: 0,
            inflight: {
              beganAt: '2024-01-01T00:00:00.000Z',
              endedAt: '2024-01-01T00:00:08.200Z',
            },
            outcome: {
              path: '/tmp/.route/1.test.guard.review.i1.abc.r1.md',
              review: { blockers: 0, nitpicks: 0 },
              judge: null,
            },
          }),
        );

        // the seal line should contain \r and \n
        const chunksAfterFinish = mock.chunks.slice(chunkCountBeforeFinish);
        const combined = chunksAfterFinish.join('');
        expect(combined).toContain('✓ review.1 - done 8.2s');
        expect(combined).toContain('\n');

        done();
        jest.useRealTimers();
      });
    });
  });

  given('[case6] done() clears active interval', () => {
    when('[t0] done called while spinner is active', () => {
      then('no further writes occur after done', () => {
        jest.useFakeTimers();

        const mock = genMockStderr({ isTTY: true });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        // start inflight
        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'review',
            index: 0,
            inflight: {
              beganAt: new Date().toISOString(),
              endedAt: null,
            },
            outcome: null,
          }),
        );

        jest.advanceTimersByTime(160);
        done();

        const chunkCountAfterDone = mock.chunks.length;
        jest.advanceTimersByTime(500);

        // no new writes after done
        expect(mock.chunks.length).toEqual(chunkCountAfterDone);

        jest.useRealTimers();
      });
    });
  });

  given('[case7] branch format with position context', () => {
    when('[t0] intermediate item with position', () => {
      then('uses ├─ branch character', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        const position: ContextGuardProgress = { index: 0, total: 3 };
        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'review',
            index: 0,
            inflight: {
              beganAt: '2024-01-01T00:00:00.000Z',
              endedAt: '2024-01-01T00:00:05.000Z',
            },
            outcome: {
              path: '/tmp/.route/review.md',
              review: { blockers: 0, nitpicks: 0 },
              judge: null,
            },
          }),
          position,
        );

        done();

        const combined = mock.chunks.join('');
        expect(combined).toContain('├─');
        expect(combined).not.toContain('└─');
      });
    });

    when('[t1] last item with position', () => {
      then('uses └─ branch character', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        const position: ContextGuardProgress = { index: 2, total: 3 };
        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'judge',
            index: 0,
            inflight: {
              beganAt: '2024-01-01T00:00:00.000Z',
              endedAt: '2024-01-01T00:00:05.000Z',
            },
            outcome: {
              path: '/tmp/.route/judge.md',
              review: null,
              judge: { decision: 'passed', reason: null },
            },
          }),
          position,
        );

        done();

        const combined = mock.chunks.join('');
        expect(combined).toContain('└─');
        expect(combined).not.toContain('├─');
      });
    });

    when('[t2] no position provided', () => {
      then('defaults to └─ branch character', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'review',
            index: 0,
            inflight: {
              beganAt: '2024-01-01T00:00:00.000Z',
              endedAt: '2024-01-01T00:00:05.000Z',
            },
            outcome: {
              path: '/tmp/.route/review.md',
              review: { blockers: 0, nitpicks: 0 },
              judge: null,
            },
          }),
        );

        done();

        const combined = mock.chunks.join('');
        expect(combined).toContain('└─');
      });
    });
  });

  given('[case8] cached events', () => {
    when('[t0] cached review event (inflight and outcome both null)', () => {
      then('outputs cached line with done status', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'review',
            index: 0,
            inflight: null,
            outcome: null,
          }),
        );

        done();

        expect(mock.chunks).toHaveLength(1);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✓ review.1 - done (cached)');
      });
    });

    when('[t1] cached judge event', () => {
      then('outputs cached line with passed status', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'judge',
            index: 0,
            inflight: null,
            outcome: null,
          }),
        );

        done();

        expect(mock.chunks).toHaveLength(1);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✓ judge.1 - passed (cached)');
      });
    });
  });
});
