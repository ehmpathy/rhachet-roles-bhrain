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

/**
 * .what = a review event that carries a `slot`, so the emit takes the slotted branch
 * .why  = `drawStatus` is gated on a non-empty inflight set AND a `slot` on the
 *         reviewer, so an unslotted event silently takes the legacy path — which
 *         is the exact trap this builder exists to keep a later author out of
 * .note = module-level BESIDE `genEvent`, never per-case. [case9] and [case10]
 *         held verbatim copies until i002/r1, and two copies of one shape
 *         contract drift the moment a field lands in one of them
 */
const genSlottedEvent = (input: {
  index: number;
  slot: { index: number; total: number };
  outcome: GuardProgressEvent['outcome'];
}): GuardProgressEvent => ({
  stone: { name: '1.test', path: '/tmp/1.test.stone', guard: null },
  step: { phase: 'review', index: input.index },
  reviewer: {
    index: input.index + 1,
    slug: `checker-${input.index + 1}`,
    level: 1,
    budget: 5,
    rounds: 1,
    slot: input.slot,
  },
  inflight: {
    beganAt: new Date().toISOString(),
    endedAt: input.outcome ? new Date().toISOString() : null,
  },
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
        expect(combined).toContain('✓ review.1 - completed 12.4s');
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
              judge: { decision: 'allowed', reason: 'all checks pass' },
            },
          }),
        );

        done();

        // 2 lines: blank line + judge line
        expect(mock.chunks).toHaveLength(2);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✓ judge.1 - allowed 0.8s');
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
                decision: 'blocked',
                reason: 'blockers exceed threshold (3 > 0)',
              },
            },
          }),
        );

        done();

        // 2 lines: blank line + judge line
        expect(mock.chunks).toHaveLength(2);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✗ judge.1 - blocked 2.1s');
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
        expect(combined).toContain('✓ review.1 - completed 8.2s');
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
              judge: { decision: 'allowed', reason: null },
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
      then('outputs cached line with completed status', () => {
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
        expect(combined).toContain('✓ review.1 - completed (cached)');
      });
    });

    when('[t1] cached judge event (outcome-less legacy shape)', () => {
      then('outputs blank line + cached line with allowed status', () => {
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

        // 2 lines: blank separator + judge line (matches completed judge)
        expect(mock.chunks).toHaveLength(2);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✓ judge.1 - allowed (cached)');
      });
    });

    when('[t2] cached judge event with outcome (real cached shape)', () => {
      then('closes the tree with the allowed cached line', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'judge',
            index: 0,
            inflight: null,
            outcome: {
              path: '/tmp/.route/1.test.guard.judge.i1p1.abc.def.j1.md',
              review: null,
              judge: { decision: 'allowed', reason: 'all checks pass' },
            },
          }),
        );

        done();

        // 2 lines: blank separator + judge line
        expect(mock.chunks).toHaveLength(2);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✓ judge.1 - allowed (cached)');
      });
    });

    when('[t3] cached judge event with blocked outcome', () => {
      then('closes the tree with the blocked cached line', () => {
        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genEvent({
            phase: 'judge',
            index: 0,
            inflight: null,
            outcome: {
              path: '/tmp/.route/1.test.guard.judge.i1p1.abc.def.j1.md',
              review: null,
              judge: {
                decision: 'blocked',
                reason: 'blockers exceed threshold',
              },
            },
          }),
        );

        done();

        expect(mock.chunks).toHaveLength(2);
        const combined = mock.chunks.join('');
        expect(combined).toContain('✗ judge.1 - blocked (cached)');
      });
    });
  });

  /**
   * .what = the tail status line under a slotted (concurrent) pour
   * .why = drawStatus is gated on BOTH `isTty` and a non-empty inflight set, so
   *        every extant case took an early return: the blackbox suites drive the
   *        cli via execAsync (stdout is a pipe), and [case4]'s tty event carries
   *        no `slot`, so it takes the legacy unslotted branch instead.
   *
   *        ⇒ the spinner frame, the `inflight · done · left` arithmetic, and the
   *        `\r` overwrite had never executed under test.
   *
   * .note = `left` is inflight + queued, NEVER queued alone. peer review i023/r2
   *         read it the other way and computed `0 left` where `1 left` is right.
   *         the two senses coincide on an unbounded level and diverge at
   *         concurrency: 1 — the level this feature exists to make possible — so
   *         the invariant `done + left = total` is asserted at every tick below.
   *
   * 🔴 .note = THIS ORACLE IS NOW BOTH KINDS, and the correction is the lesson.
   *         `1.vision.experience.case=8` offered a fork: *"either capture the
   *         reviewer stderr blocks into the acceptance suite so a future clamp
   *         gains a real oracle, or accept a hand-authored one and say so."* this
   *         case took the second and priced the first at "a new capture path
   *         through the blackbox harness … for a stream whose content is a
   *         spinner, and so differs on every run."
   *
   *         🔴 BOTH halves of that price were false HERE, and each for its own
   *         reason. raised i020/r2 as a blocker, and the reviewer was right:
   *
   *         - "a new capture path" — this is a UNIT case, not a blackbox one. the
   *           bytes are already in hand at `mock.chunks`; the harness was never
   *           in the way
   *         - "differs on every run" — `jest.useFakeTimers()` mocks `Date.now()`,
   *           so the `sec` delta is frozen, and `frameIdx` is a local counter
   *           rather than a clock read. at SPIN_MS=80 an advance of 240ms yields
   *           exactly 3 ticks, frames ⠋⠙⠹. not one field here varies
   *
   *         ⇒ the carve-out was reasoned from the ACCEPTANCE tier's constraints
   *         while sitting in the UNIT tier, where neither constraint applies. so
   *         it is a committed snapshot now, and the `toContain` assertions stay
   *         BESIDE it — they name the invariant (`done + left = total`) that a
   *         snapshot records without asserting. a snapshot proves the render did
   *         not CHANGE; the explicit clamp proves it is not WRONG.
   */
  given('[case9] tty mode — the tail status line under a slotted pour', () => {
    when(
      '[t0] two lanes announce, then one settles out of declared order',
      () => {
        then(
          'the status reports inflight, done, and left at every tick',
          () => {
            jest.useFakeTimers();

            const mock = genMockStderr({ isTTY: true });
            const { context, done } = genContextCliEmit({
              stderr: mock.stream,
            });

            // both lanes announce — declared slots 0 and 1 of a 2-member level
            context.cliEmit.onGuardProgress(
              genSlottedEvent({
                index: 0,
                slot: { index: 0, total: 2 },
                outcome: null,
              }),
            );
            context.cliEmit.onGuardProgress(
              genSlottedEvent({
                index: 1,
                slot: { index: 1, total: 2 },
                outcome: null,
              }),
            );

            jest.advanceTimersByTime(240);

            // 🔴 the arithmetic r1 flagged as never-executed
            const atAnnounce = mock.chunks.join('');
            expect(atAnnounce).toContain('2 inflight · 0 done · 2 left');

            // 🔴 the COMMITTED oracle — every tick of the tail status line,
            //    verbatim. deterministic under fake timers (see the docblock),
            //    so the `\r`, the frame cycle, and the elapsed delta are all
            //    recorded rather than imagined
            expect(
              mock.chunks.filter((chunk) => chunk.includes('inflight ·')),
            ).toMatchSnapshot('tail status — both lanes inflight');

            // every status write overwrites the LAST line — the wisher's constraint
            const overwrites = mock.chunks.filter((chunk) =>
              chunk.includes('inflight ·'),
            );
            expect(overwrites.length).toBeGreaterThanOrEqual(1);
            for (const chunk of overwrites)
              expect(chunk.startsWith('\r')).toBe(true);

            // slot 1 settles FIRST — the out-of-order case a concurrent pour creates
            mock.chunks.length = 0;
            context.cliEmit.onGuardProgress(
              genSlottedEvent({
                index: 1,
                slot: { index: 1, total: 2 },
                outcome: {
                  path: '/tmp/.reviews/peer/r002.given.md',
                  review: { blockers: 1, nitpicks: 0 },
                  judge: null,
                },
              }),
            );

            jest.advanceTimersByTime(240);

            // 🔴 done + left = total holds: 1 + 1 = 2
            const afterOne = mock.chunks.join('');
            expect(afterOne).toContain('1 inflight · 1 done · 1 left');

            // and slot 1's block is BUFFERED, never emitted ahead of slot 0
            expect(afterOne).not.toContain('r002.given.md');

            // 🔴 the committed oracle for the SETTLED tick — this is the frame a
            //    driver watches redraw in place, and the one the vision's
            //    `case=8` render argues for. `1 left` is the sense peer review
            //    i023/r2 misread as `0`, so the bytes now carry the settlement
            expect(
              mock.chunks.filter((chunk) => chunk.includes('inflight ·')),
            ).toMatchSnapshot('tail status — one settled, one aloft');

            done();
            jest.useRealTimers();
          },
        );
      },
    );

    when('[t1] the earlier slot settles, which releases both blocks', () => {
      then('slot 0 emits before slot 1, in DECLARED order', () => {
        jest.useFakeTimers();

        const mock = genMockStderr({ isTTY: true });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genSlottedEvent({
            index: 0,
            slot: { index: 0, total: 2 },
            outcome: null,
          }),
        );
        context.cliEmit.onGuardProgress(
          genSlottedEvent({
            index: 1,
            slot: { index: 1, total: 2 },
            outcome: null,
          }),
        );

        // the LATER slot settles first
        context.cliEmit.onGuardProgress(
          genSlottedEvent({
            index: 1,
            slot: { index: 1, total: 2 },
            outcome: {
              path: '/tmp/.reviews/peer/r002.given.md',
              review: { blockers: 1, nitpicks: 0 },
              judge: null,
            },
          }),
        );

        mock.chunks.length = 0;

        // then the earlier one — which unblocks the cursor
        context.cliEmit.onGuardProgress(
          genSlottedEvent({
            index: 0,
            slot: { index: 0, total: 2 },
            outcome: {
              path: '/tmp/.reviews/peer/r001.given.md',
              review: { blockers: 0, nitpicks: 2 },
              judge: null,
            },
          }),
        );

        const released = mock.chunks.join('');

        // both blocks are out, and r001 PRECEDES r002 despite its later settle
        expect(released).toContain('r001.given.md');
        expect(released).toContain('r002.given.md');
        expect(released.indexOf('r001.given.md')).toBeLessThan(
          released.indexOf('r002.given.md'),
        );

        done();
        jest.useRealTimers();
      });
    });
  });

  /**
   * .what = the same slotted pour, under a PIPE
   * .why = `1.vision.experience.case=8` `[case2]` calls this "the honest ergonomics
   *        floor — CI is not a tty. a render that only works under a tty is a
   *        render that does not work where the suite runs."
   *
   * 🔴 .note = the vision's `[t1]` `then` predicted the status line would "append
   *         once per tick rather than redraw in place". IT DOES NOT, and the
   *         deviation is deliberate — `drawStatus` returns early under a pipe.
   *
   *         the vision reasoned from `overwrite`'s non-tty fallback without the
   *         interval that calls it. every spinner in `genContextCliEmit` is
   *         already `if (isTty)` gated, so a per-tick append would make the wave
   *         status the ONE spinner that spams a piped log — at SPIN_MS 80ms
   *         against a PT21M timeout, ~15,750 lines per level.
   *
   *         ⇒ this clamps what the code DOES, so a later author who reads the
   *         vision does not "repair" it into that spam. the reason lives beside
   *         the early return in `genContextCliEmit.ts`
   *
   * 🔴 .note = TEETH, measured 2026-09-09. removed the `!isTty` early return and
   *         this case went red on the first assertion, with the spam in the
   *         failure output: **50 status lines** across the 4000ms window below,
   *         which is exactly `4000 / SPIN_MS`. ⇒ 12.5 lines/s × PT21M = ~15,750,
   *         so the arithmetic above is measured rather than estimated
   */
  given('[case10] non-tty mode — the slotted pour under a pipe', () => {
    when('[t0] two lanes announce, then both settle out of order', () => {
      then('no status line, no escape code, blocks in DECLARED order', () => {
        jest.useFakeTimers();

        const mock = genMockStderr({ isTTY: false });
        const { context, done } = genContextCliEmit({ stderr: mock.stream });

        context.cliEmit.onGuardProgress(
          genSlottedEvent({
            index: 0,
            slot: { index: 0, total: 2 },
            outcome: null,
          }),
        );
        context.cliEmit.onGuardProgress(
          genSlottedEvent({
            index: 1,
            slot: { index: 1, total: 2 },
            outcome: null,
          }),
        );

        // a long tick window — the spam window, if an interval ran here
        jest.advanceTimersByTime(4000);

        // the later slot settles first, then the earlier one releases both
        context.cliEmit.onGuardProgress(
          genSlottedEvent({
            index: 1,
            slot: { index: 1, total: 2 },
            outcome: {
              path: '/tmp/.reviews/peer/r002.given.md',
              review: { blockers: 1, nitpicks: 0 },
              judge: null,
            },
          }),
        );
        context.cliEmit.onGuardProgress(
          genSlottedEvent({
            index: 0,
            slot: { index: 0, total: 2 },
            outcome: {
              path: '/tmp/.reviews/peer/r001.given.md',
              review: { blockers: 0, nitpicks: 2 },
              judge: null,
            },
          }),
        );

        const stream = mock.chunks.join('');

        // 🔴 not one status line, however many ticks elapsed
        expect(stream).not.toContain('inflight ·');

        // and no cursor control at all — a piped log is append-only
        expect(stream).not.toContain('\r');

        // the blocks still emit, and still in DECLARED order
        expect(stream).toContain('r001.given.md');
        expect(stream).toContain('r002.given.md');
        expect(stream.indexOf('r001.given.md')).toBeLessThan(
          stream.indexOf('r002.given.md'),
        );

        done();
        jest.useRealTimers();
      });
    });
  });

  given(
    '[case11] the two emit paths disagree on the rounds count, ON PURPOSE',
    () => {
      // 🔴 .why this case exists = the divergence was documented in a code comment
      //     and clamped by no test. a future editor who reads the un-slotted
      //     `rounds + 1` as a defect and "pins" one side in isolation breaks an
      //     agreement the other side holds, with only prose to stop them — and
      //     prose is not a test. raised i033/r9
      //
      //     ⚠️ both halves sit in ONE given, deliberately. a change to either
      //        path goes red HERE, beside the reason, rather than in two suites
      //        a reader must reconcile
      const REVIEWER = {
        index: 1,
        slug: 'alpha-checker',
        level: 1,
        budget: 5,
        rounds: 0,
      };

      when('[t0] the UN-SLOTTED path seals its header at inflight', () => {
        then('it renders the OPTIMISTIC round — 1/5', () => {
          jest.useFakeTimers();

          const mock = genMockStderr({ isTTY: true });
          const { context, done } = genContextCliEmit({ stderr: mock.stream });

          context.cliEmit.onGuardProgress({
            stone: { name: '1.test', path: '/tmp/1.test.stone', guard: null },
            step: { phase: 'review', index: 0 },
            reviewer: REVIEWER,
            inflight: { beganAt: new Date().toISOString(), endedAt: null },
            outcome: null,
          });

          // ⇒ this path NEVER reprints its header, so a header without the `+ 1`
          //   would read `0/5` forever — even for a review that ran and did
          //   consume its round. the optimism is the lesser of two misreports
          expect(mock.chunks.join('')).toContain('(l1, 1/5)');

          done();
          jest.useRealTimers();
        });
      });

      when('[t1] the SLOTTED path builds its block at settle', () => {
        then('it renders the AUTHORITATIVE round — 0/5', () => {
          jest.useFakeTimers();

          const mock = genMockStderr({ isTTY: false });
          const { context, done } = genContextCliEmit({ stderr: mock.stream });

          // a malfunction consumes NO round, so the caller hands `rounds`
          // unchanged — and the slotted path seals no header at inflight, so it
          // has no optimistic value to correct
          context.cliEmit.onGuardProgress({
            stone: { name: '1.test', path: '/tmp/1.test.stone', guard: null },
            step: { phase: 'review', index: 0 },
            reviewer: { ...REVIEWER, slot: { index: 0, total: 1 } },
            inflight: {
              beganAt: new Date().toISOString(),
              endedAt: new Date().toISOString(),
            },
            outcome: {
              path: '/tmp/.reviews/peer/r001.given.md',
              review: { malfunction: '💥 malfunction: reviewer exited 127' },
              judge: null,
            },
          });

          expect(mock.chunks.join('')).toContain('(l1, 0/5)');

          done();
          jest.useRealTimers();
        });
      });
    },
  );
});
