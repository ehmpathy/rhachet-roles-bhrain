import { given, then, when } from 'test-fns';

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
      then('stderr prints static inflight line', () => {
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

        expect(mock.chunks).toHaveLength(1);
        expect(mock.chunks[0]).toContain('r1: inflight');
        expect(mock.chunks[0]).toContain('\n');
      });
    });

    when('[t1] judge inflight event emitted', () => {
      then('stderr prints static inflight line with j label', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'judge',
            index: 1,
            inflight: {
              beganAt: '2024-01-01T00:00:00.000Z',
              endedAt: null,
            },
            outcome: null,
          }),
        );

        done();

        expect(mock.chunks).toHaveLength(1);
        expect(mock.chunks[0]).toContain('j2: inflight');
      });
    });
  });

  given('[case2] non-tty mode — completed review event', () => {
    when('[t0] review completed with blockers', () => {
      then('stderr prints result and blocker detail', () => {
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

        // result line + blocker line + nitpick line = 3 writes
        expect(mock.chunks.length).toBeGreaterThanOrEqual(3);

        const combined = mock.chunks.join('');
        expect(combined).toContain('✓ r1: finished 12.4s');
        expect(combined).toContain('3 blockers 🔴');
        expect(combined).toContain('1 nitpick 🟠');
      });
    });

    when('[t1] review completed with no issues', () => {
      then('stderr prints result line only', () => {
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
              path: '/tmp/.route/1.test.guard.review.i1.abc.r1.md',
              review: { blockers: 0, nitpicks: 0 },
              judge: null,
            },
          }),
        );

        done();

        // only result line, no blocker/nitpick detail
        expect(mock.chunks).toHaveLength(1);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✓ r1: finished 5.0s');
        expect(combined).not.toContain('blocker');
        expect(combined).not.toContain('nitpick');
      });
    });
  });

  given('[case3] non-tty mode — completed judge events', () => {
    when('[t0] judge completed with pass', () => {
      then('stderr prints result with checkmark', () => {
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
        expect(combined).toContain('✓ j1: finished 0.8s');
        expect(combined).not.toContain('reason:');
      });
    });

    when('[t1] judge completed with failure', () => {
      then('stderr prints result with cross and reason', () => {
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

        expect(mock.chunks.length).toBeGreaterThanOrEqual(2);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✗ j1: finished 2.1s');
        expect(combined).toContain('reason: blockers exceed threshold (3 > 0)');
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
        expect(combined).toContain('r1: inflight');

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
        expect(combined).toContain('✓ r1: finished 8.2s');
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

  given('[case7] singular vs plural labels', () => {
    when('[t0] review with exactly 1 blocker', () => {
      then('uses singular "blocker"', () => {
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
              review: { blockers: 1, nitpicks: 0 },
              judge: null,
            },
          }),
        );

        done();

        const combined = mock.chunks.join('');
        expect(combined).toContain('1 blocker 🔴');
        expect(combined).not.toContain('blockers');
      });
    });

    when('[t1] review with exactly 1 nitpick', () => {
      then('uses singular "nitpick"', () => {
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
              review: { blockers: 0, nitpicks: 1 },
              judge: null,
            },
          }),
        );

        done();

        const combined = mock.chunks.join('');
        expect(combined).toContain('1 nitpick 🟠');
        expect(combined).not.toContain('nitpicks');
      });
    });
  });
});
