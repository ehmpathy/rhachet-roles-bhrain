import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import { asIsoPriceHuman } from 'iso-price';
import * as path from 'path';
import type { BrainChoice, ContextBrain } from 'rhachet';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

import { setOneReviewRunLogDir } from '../__test_assets__/setOneReviewRunLogDir';
import { asReviewWarmerOutputPath } from './asReviewWarmerOutputPath';
import { PLAN_OF_WARMER_ON } from './asReviewWarmerPlan';
import { getOneReviewWarmerRecord } from './getOneReviewWarmerRecord';
import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';
import { NAME_OF_WARMER_ROWS } from './setOneWarmerPokeRow';
import { setReviewWarmerBoot } from './setReviewWarmerBoot';
import { setReviewWarmerLane } from './setReviewWarmerLane';
import { setReviewWarmerPokes } from './setReviewWarmerPokes';
import type { WarmerClock } from './WarmerClock';
import type { WarmerPokeRow } from './WarmerPokeRow';

/**
 * .what = the pid every warmer in this suite runs as
 * .why = a warmer exits at a wake where its prefix's record names another pid; a
 *        case that seeds no record leaves the pid unrecorded, so this one never displaces
 */
const PID_OF_TEST = 4242;

const HEAD_OF_TEST = '# rules\n\nbe kind.\n';
const TAIL_OF_TEST = '<target.file path="a.ts">const a = 1;</target.file>';

/**
 * .what = the prefix every warmer in this suite keeps warm
 * .why = the watermark is keyed on it; a lane with no recorded prefix supersedes
 *        none, so a case need not seed the lane unless it tests supersession
 */
const PREFIX_OF_TEST: ReviewWarmerPrefix = {
  head: 'head-of-test',
  brain: 'test/brain',
};

/**
 * .what = a brain that measures whatever this test declares, and records each poke
 *
 * .mock = the brain's `choice.ask` — the live provider call, the one external boundary
 *         the warmer loop has (the clock is the other, and it is faked below)
 * .why = the loop's contract is what it RECORDS, never what a provider answers.
 *        a real call here would make the suite a cost center and a flake source,
 *        and it would prove naught this file claims. the stub sits at the BRAIN, so
 *        every poke passes through the real `setOneWarmerPoke` — the head brief it
 *        writes, the tail it sends, and the row shape it returns
 * .real = `setOneWarmerPoke.integration.test.ts` names where the provider contract
 *         for this same role shape is exercised live
 *
 * .note = `throwOn` refuses ONE call by its 1-based index, so a case can declare a
 *         provider fault (any Error) or a defect (a TypeError) on a chosen attempt
 */
const genBrainStub = (input: {
  cacheGetTokens: number;
  throwOn: { call: number; error: Error } | null;
}): {
  brain: ContextBrain<BrainChoice>;
  calls: { head: string; tail: string }[];
} => {
  const calls: { head: string; tail: string }[] = [];
  const ask = async (askInput: {
    role: { briefs: { ref: { uri: string } }[] };
    prompt: string;
  }): Promise<unknown> => {
    // the head reaches the brain as the system brief the poke wrote; read it back
    calls.push({
      head: askInput.role.briefs
        .map((brief) => fs.readFileSync(brief.ref.uri, 'utf-8'))
        .join(''),
      tail: askInput.prompt,
    });
    if (input.throwOn && calls.length === input.throwOn.call)
      throw input.throwOn.error;
    return {
      output: { ack: 'ack' },
      metrics: {
        size: {
          tokens: {
            input: 1_000 - input.cacheGetTokens,
            cache: { get: input.cacheGetTokens, set: 0 },
          },
        },
        cost: { cash: { total: 'USD 0.000429' } },
      },
    };
  };
  return {
    calls,
    brain: {
      brain: { choice: { ask } },
    } as unknown as ContextBrain<BrainChoice>,
  };
};

/**
 * .what = writes the run artifacts a warmer replays, and answers their dir
 * .why = the poke prompt comes from the run's OWN artifacts, never a re-compile —
 *        a re-compile reads a tree that has since moved
 */
const setOneRunLogDir = (input: { cwd: string; prompt: string }): string => {
  const logDir = path.join(input.cwd, '.log', 'bhrain', 'review', 'run-1');
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(path.join(logDir, 'input.prompt.head.md'), HEAD_OF_TEST);
  fs.writeFileSync(path.join(logDir, 'input.prompt.md'), input.prompt);
  return logDir;
};

/**
 * .what = a clock whose `sleep` advances its own `now`, at zero wall time
 * .why = the cadence is the product, so a suite that could not control it could
 *        only clamp the paths that never wait — which excludes the DEFER, the one
 *        decision the wisher asked for by name ("minimize redundant warms").
 *
 * .note = it preserves the real clock's sequence exactly: every wait the warmer
 *         asks for lands on `now` before the next read, in order. what it removes
 *         is the wall time, never the arithmetic
 */
const genClockFake = (input: {
  at: Date;
}): WarmerClock & { waits: number[] } => {
  let at = input.at.getTime();
  const waits: number[] = [];
  return {
    waits,
    now: () => new Date(at),
    sleep: async (minutes) => {
      waits.push(minutes);
      at += minutes * 60_000;
    },
  };
};

/**
 * .what = the fake clock, plus a READ of the ledger taken at each wait
 * .why = `0.wish` bar 9b promises a driver can `cat` the ledger MID-FLIGHT — a
 *        detached warmer has no terminal, so these rows are its only voice. every
 *        other case here reads the file after the warmer returned, which cannot
 *        part a per-poke flush from one batched write at exit.
 *
 *        ⇒ the `sleep` is the only seam that is genuinely mid-flight, so the watch
 *        rides there rather than in a timer the suite would have to race.
 *
 * .note = it is a peer of `genClockFake`, never a replacement — the cases that do
 *         not ask the mid-flight question should not pay a file read per wait
 *         (rule.prefer.wet-over-dry).
 */
const genClockWatched = (input: {
  at: Date;
  watch: () => string[];
}): WarmerClock & { waits: number[]; seen: string[][] } => {
  let at = input.at.getTime();
  const waits: number[] = [];
  const seen: string[][] = [];
  return {
    waits,
    seen,
    now: () => new Date(at),
    sleep: async (minutes) => {
      waits.push(minutes);
      seen.push(input.watch());
      at += minutes * 60_000;
    },
  };
};

const getAllRows = (input: { at: string }): WarmerPokeRow[] =>
  fs
    .readFileSync(input.at, 'utf8')
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line) as WarmerPokeRow);

/**
 * .what = the acts recorded so far, or an empty list where no row has landed yet
 * .why = it reads a LIVE file, so absence is an ordinary state rather than a
 *        defect — a driver who `cat`s before the first poke lands sees no file at
 *        all. `getAllRows` would throw on both an absent file and an empty one,
 *        which would grade the very first observation a malfunction.
 */
const getAllActsSoFar = (input: { at: string }): string[] => {
  if (!fs.existsSync(input.at)) return [];
  if (!fs.readFileSync(input.at, 'utf8').trim()) return [];
  return getAllRows(input).map((row) => row.act);
};

describe('setReviewWarmerPokes', () => {
  given('[case1] a two-poke budget and no cadence to wait out', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-run-two-pokes' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });
      return {
        cwd,
        logDir,
        stub: genBrainStub({ cacheGetTokens: 998, throwOn: null }),
      };
    });

    when('[t0] the warmer runs to completion', () => {
      const done = useThen('it returns rather than polls forever', async () => {
        await setReviewWarmerPokes(
          {
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            plan: { pokes: 2, everyMinutes: 0 },
            logDir: scene.logDir,
            prefix: PREFIX_OF_TEST,
            pid: PID_OF_TEST,
          },
          {
            brain: scene.stub.brain,
            clock: genClockFake({ at: new Date('2026-09-24T10:00:00.000Z') }),
          },
        );
        return { ran: true };
      });

      then('🔴 it EXITS when its budget is spent — exactly two pokes', () => {
        // a warmer that polled for a round that may never come is an unbounded
        // spender, which is the one thing a driver cannot forgive
        expect(done.ran).toEqual(true);
        expect(scene.stub.calls.length).toEqual(2);
      });

      then('🔴 every poke sends the head BYTE-IDENTICAL to the run', () => {
        // a truncated head re-derives the affinity key and warms a replica the
        // real call never reaches — silently
        for (const call of scene.stub.calls)
          expect(call.head).toEqual(HEAD_OF_TEST);
      });

      then('🔴 its rows land BESIDE the review output they protect', () => {
        const rows = getAllRows({
          at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
        });
        // the final `retire` is the TERMINATOR, and it is the whole point of an
        // exact-sequence assertion here: a record that ends on its last poke
        // cannot be told from one that STOPPED at its last poke. bar 9b promises
        // a driver can read this log mid-flight, and a detached process has no
        // other voice
        expect(rows.map((row) => row.act)).toEqual(['poke', 'poke', 'retire']);
      });

      then(
        '🔴 and the terminator says WHY it ended — the plan, not a death',
        () => {
          const rows = getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          });
          const last = rows[rows.length - 1];
          expect(last?.act).toEqual('retire');
          expect(last?.why).toContain('spent');
          expect(last?.why).toContain('2 of 2');
          // a terminator measures naught — it spent no money to announce it was done
          expect(last?.measured).toEqual(null);
        },
      );

      then(
        'each row carries what the poke measured — never a projection',
        () => {
          const rows = getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          });
          expect(rows[0]?.measured).toEqual({
            promptTokens: 1_000,
            cacheGetTokens: 998,
            hit: true,
            // the format the real poke writes, never the stub's raw word
            cost: asIsoPriceHuman('USD 0.000429'),
          });
        },
      );

      then(
        '🔴 and bar 9b holds: ONE log per warmer, every poke in order',
        () => {
          // the whole of what a driver's mid-flight `cat` needs — never one
          // file PER ATTEMPT (a loop over `[1, 2]`), which would scatter one
          // warmer's chronology across k paths while it mixed k warmers' rows
          // inside each. the key is the run, so the file is the warmer's whole
          // life and the read is a single `cat`
          const at = asReviewWarmerOutputPath({
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            run: path.basename(scene.logDir),
          });
          expect(fs.existsSync(at)).toEqual(true);
          expect(getAllRows({ at }).map((row) => row.act)).toEqual([
            'poke',
            'poke',
            'retire',
          ]);
          // and it is the SAME chronology as the ledger, row for row. the two
          // sinks are keyed on different axes and neither can serve the other's
          // question (bar 9 vs bar 9b) — so the one property that must hold
          // across them is that a driver who reads either reads the same story
          expect(getAllRows({ at })).toEqual(
            getAllRows({ at: path.join(scene.logDir, NAME_OF_WARMER_ROWS) }),
          );
        },
      );
    });
  });

  given('[case2] a poke the provider served only a sliver of', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-run-miss' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });
      // 27.8% — the real figure the prefix census measured at a 33m gap
      return {
        cwd,
        logDir,
        stub: genBrainStub({ cacheGetTokens: 278, throwOn: null }),
      };
    });

    when('[t0] the warmer records it', () => {
      const done = useThen('the warmer completes', async () => {
        await setReviewWarmerPokes(
          {
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            plan: { pokes: 1, everyMinutes: 0 },
            logDir: scene.logDir,
            prefix: PREFIX_OF_TEST,
            pid: PID_OF_TEST,
          },
          {
            brain: scene.stub.brain,
            clock: genClockFake({ at: new Date('2026-09-24T10:00:00.000Z') }),
          },
        );
        return { ran: true };
      });

      then(
        '🔴 the MISS is named, never folded into a rate that hides it',
        () => {
          expect(done.ran).toEqual(true);
          const rows = getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          });
          expect(rows[0]?.measured?.hit).toEqual(false);
        },
      );

      then('and the tokens it did serve are still recorded', () => {
        const rows = getAllRows({
          at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
        });
        expect(rows[0]?.measured?.cacheGetTokens).toEqual(278);
      });

      then('and the 1-poke terminator agrees its count with its noun', () => {
        const rows = getAllRows({
          at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
        });
        const last = rows[rows.length - 1];
        expect(last?.act).toEqual('retire');
        expect(last?.why).toEqual('the plan is spent — 1 of 1 attempt');
      });
    });
  });

  given(
    '[case3] run artifacts that disagree — the head prefixes no prompt',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'warmer-run-disagree' });
        const logDir = setOneRunLogDir({
          cwd,
          prompt: '# a different head entirely\n<target/>',
        });
        return {
          cwd,
          logDir,
          stub: genBrainStub({ cacheGetTokens: 0, throwOn: null }),
        };
      });

      when('[t0] the warmer reads them', () => {
        const done = useThen('it returns at once', async () => {
          await setReviewWarmerPokes(
            {
              cwd: scene.cwd,
              reviewer: 'repo-rules',
              plan: { pokes: 3, everyMinutes: 0 },
              logDir: scene.logDir,
              prefix: PREFIX_OF_TEST,
              pid: PID_OF_TEST,
            },
            {
              brain: scene.stub.brain,
              clock: genClockFake({ at: new Date('2026-09-24T10:00:00.000Z') }),
            },
          );
          return { ran: true };
        });

        then('🔴 it RETIRES rather than warms a prefix nobody sent', () => {
          expect(done.ran).toEqual(true);
          expect(scene.stub.calls.length).toEqual(0);
        });

        then('and it SAYS so, rather than exits in silence', () => {
          // a detached process has no terminal, so a silent exit reads exactly like
          // a warmer that is still alive and mid-cadence
          const rows = getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          });
          expect(rows[0]?.act).toEqual('retire');
          expect(rows[0]?.measured).toEqual(null);
        });
      });
    },
  );

  given('[case9] 🔴 the DEFAULT plan, run at its real cadence', () => {
    /**
     * .what = the cumulative wall clock of the plan every real warmer runs
     *
     * .note = every expectation below is DERIVED from `PLAN_OF_WARMER_ON`,
     *            deliberately — a clamp that must be edited to follow its
     *            subject is a clamp that reports an edit rather than a defect.
     *
     *            ⇒ so the SHAPE is derived (a full cadence per gap, one poke per
     *            budget unit) and the ARITHMETIC is pinned (the window in
     *            minutes, as a literal, so a plan that silently shrank is caught).
     *
     * .why = this is the one claim the whole product rests on. `PLAN_OF_WARMER_ON`
     *           argues its cadence from the prefix census and its count from the
     *           measured round gap — and every OTHER multi-poke case in this
     *           suite runs at `everyMinutes: 0`, while the only nonzero-cadence
     *           case (`[case4]`) spends ONE poke.
     *
     *           ⇒ so the cadence is clamped for a single poke elsewhere, and the
     *           COVERAGE WINDOW is clamped only here. a regression that collapsed
     *           `waitOfNextWake` after a successful poke would pass every other
     *           case: the 0-cadence cases cannot see it, and `[case4]` never
     *           reaches a second gap.
     *
     * .note = THE CADENCE IS DEFENDED TWICE:
     *
     *              waits  [15, 0, 15, 0, 15]      acts  poke defer poke defer poke
     *              stamps 10:15 · 10:30 · 10:45
     *
     *            the wake verdict is a second, independent guard: it defers on
     *            `sinceTouch < cadence`, so a zeroed wait costs an extra wake and
     *            buys a collapse of `waitOfNextWake` naught — the poke still
     *            lands on time. the two assertions below pin the SCHEDULE AS
     *            ACHIEVED rather than either guard alone: the wait list catches a
     *            drift in the first, the act sequence catches the second's
     *            silent rescue of it.
     *
     * .the timeline, with no review to defer to:
     *   10:00  the warmer starts — lastTouch = its own start
     *   10:15  poke 1
     *    ...   one poke per cadence
     *   13:00  poke 12, then the terminator. coverage spans 2h45m
     */
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-run-default-cadence' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });
      return {
        cwd,
        logDir,
        stub: genBrainStub({ cacheGetTokens: 998, throwOn: null }),
        clock: genClockFake({ at: new Date('2026-09-24T10:00:00.000Z') }),
      };
    });

    when('[t0] it runs the default plan to completion', () => {
      const done = useThen('it completes', async () => {
        await setReviewWarmerPokes(
          {
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            plan: PLAN_OF_WARMER_ON,
            logDir: scene.logDir,
            prefix: PREFIX_OF_TEST,
            pid: PID_OF_TEST,
          },
          { brain: scene.stub.brain, clock: scene.clock },
        );
        return { ran: true };
      });

      then(
        '🔴 EVERY gap is a full cadence — never one, never accumulated',
        () => {
          // the assertion the suite lacked. `[15]` alone was clamped by `[case4]`;
          // a second and third gap of the same size was clamped by no case at all
          expect(done.ran).toEqual(true);
          expect(scene.clock.waits).toEqual(
            Array(PLAN_OF_WARMER_ON.pokes).fill(PLAN_OF_WARMER_ON.everyMinutes),
          );
        },
      );

      then('🔴 so the pokes land on the wall clock the plan PROMISES', () => {
        // the row stamps, not the wait list — the LAST one is the coverage
        // window, stated as an assertion rather than as prose. the stamps are
        // what a reader of the ledger sees, and they are the quantity the ttl
        // argument is about
        //
        // measured: this assertion survives the wait-collapse neuter, BECAUSE
        // the wake verdict rescues it. that is no flaw in the assertion — it
        // is the clamp's report that the ACHIEVED schedule held, which is the
        // only schedule the cache ever sees. the two `then`s around it name
        // which guard did the work
        const rows = getAllRows({
          at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
        });
        const stamps = rows
          .filter((row) => row.act === 'poke')
          .map((row) => row.at);

        // one stamp per cadence, from the start — derived, so it follows the plan
        const asStampOfPoke = (input: { ordinal: number }): string =>
          new Date(
            Date.parse('2026-09-24T10:00:00.000Z') +
              input.ordinal * PLAN_OF_WARMER_ON.everyMinutes * 60 * 1000,
          ).toISOString();
        expect(stamps).toEqual(
          Array.from({ length: PLAN_OF_WARMER_ON.pokes }, (_, index) =>
            asStampOfPoke({ ordinal: index + 1 }),
          ),
        );

        // and the ARITHMETIC pinned as a literal: 2h45m is the window the
        // default's `.why` claims covers the measured 1h29m-3h05m round gap. a
        // plan that silently shrank would satisfy every derived assertion above
        // and fail here (rule.require.clamp-edge-cases)
        expect(stamps[stamps.length - 1]).toEqual('2026-09-24T13:00:00.000Z');
      });

      then('and it spent exactly its declared budget, then terminated', () => {
        const rows = getAllRows({
          at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
        });
        expect(scene.stub.calls.length).toEqual(PLAN_OF_WARMER_ON.pokes);
        expect(rows.map((row) => row.act)).toEqual([
          ...Array(PLAN_OF_WARMER_ON.pokes).fill('poke'),
          'retire',
        ]);
      });
    });
  });

  given('[case4] a real review that lands between two wakes', () => {
    /**
     * .why = THE bar-16 clamp, and the only place the three halves of the
     *           touch-chain are exercised TOGETHER: the read of the last nominal
     *           run, the verdict that defers on it, and the schedule that re-aims
     *           the next wake. each half is clamped alone elsewhere; a wrong join
     *           between them is silent — the warmer simply never defers, and pays
     *           for a redundant poke it was built to avoid.
     *
     * .the timeline, at a 15m cadence:
     *   10:00  the warmer starts — lastTouch = its own start
     *   10:10  a driver re-drives the guard; a REAL review runs for this lane
     *   10:15  wake 1 — the review touched 5m ago, under the cadence ⇒ DEFER 10m
     *   10:25  wake 2 — 15m since that touch ⇒ POKE
     *
     * ⇒ the poke lands exactly `everyMinutes` after the REVIEW, never after the
     *   warmer's own clock. that is the whole claim.
     */
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-run-defer' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });

      // the driver's re-drive — 10m after the warmer started, 5m before its wake
      setOneReviewRunLogDir({
        cwd,
        stamp: '2026-09-24T10-10-00-000Z',
        slug: 'repo-rules',
      });

      return {
        cwd,
        logDir,
        stub: genBrainStub({ cacheGetTokens: 998, throwOn: null }),
        clock: genClockFake({ at: new Date('2026-09-24T10:00:00.000Z') }),
      };
    });

    when('[t0] the warmer runs its one-poke budget', () => {
      const done = useThen('it completes', async () => {
        await setReviewWarmerPokes(
          {
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            plan: { pokes: 1, everyMinutes: 15 },
            logDir: scene.logDir,
            prefix: PREFIX_OF_TEST,
            pid: PID_OF_TEST,
          },
          { brain: scene.stub.brain, clock: scene.clock },
        );
        return { ran: true };
      });

      then('🔴 it woke TWICE and spent exactly ONE poke', () => {
        // a warmer that ignored the review would have poked on wake 1 — money
        // spent to warm a replica a real review had warmed 5 minutes earlier
        expect(done.ran).toEqual(true);
        expect(scene.clock.waits.length).toEqual(2);
        expect(scene.stub.calls.length).toEqual(1);
      });

      then('🔴 the first wake DEFERRED, and said why', () => {
        const rows = getAllRows({
          at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
        });
        // the terminator closes the sequence — see `[case1]` for why it is owed
        expect(rows.map((row) => row.act)).toEqual(['defer', 'poke', 'retire']);
        expect(rows[0]?.why).toContain('under the 15m cadence');
      });

      then('🔴 the deferral spent NAUGHT, so it advanced no counter', () => {
        // a defer counted as an attempt would retire a warmer that never poked
        // at all — its budget spent on rounds where it stayed its hand
        const rows = getAllRows({
          at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
        });
        expect(rows[0]?.measured).toEqual(null);
        expect(rows[0]?.attempt).toEqual(0);
        expect(rows[1]?.attempt).toEqual(1);
      });

      then('🔴 the second wake is the REMAINDER, never a fresh cadence', () => {
        // the regression clamp. a `sleep(everyMinutes)` at the loop head plus a
        // `sleep(waitMinutes)` in the defer branch reads as correct and waits
        // 25m — so a deferred poke lands a full cadence late, and the gap can
        // cross the ttl while both pokes look on schedule
        expect(scene.clock.waits).toEqual([15, 10]);
      });

      then('and the poke landed 15m after the REVIEW, not after start', () => {
        const rows = getAllRows({
          at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
        });
        expect(rows[1]?.at).toEqual('2026-09-24T10:25:00.000Z');
      });
    });
  });

  given(
    '[case18] a real review that lands AFTER the warmer spent a poke',
    () => {
      /**
       * .why = the budget clamp. the plan counts attempts from the last nominal
       *        review, so a review refills the budget — else a driver who re-drives
       *        for hours drains the warmer between rounds, the spawn line still
       *        prints the full plan, and the lane goes cold soon after they leave.
       *
       * .the timeline, two pokes at a 15m cadence:
       *   10:00  the warmer starts
       *   10:15  wake 1 — POKE (1 of 2 spent)
       *   10:20  a driver re-drives the guard; a REAL review runs for this lane
       *   10:30  wake 2 — the review touched 10m ago ⇒ DEFER 5m, budget refilled
       *   10:35  wake 3 — POKE (1 of 2, counted from the review)
       *   10:50  wake 4 — POKE (2 of 2) ⇒ the plan is spent
       *
       * ⇒ without the refill, wake 3 spends the LAST poke and the warmer exits at
       *   10:35 — two pokes in total, the second one only 15m past the review.
       */
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'warmer-run-refill' });
        const logDir = setOneRunLogDir({
          cwd,
          prompt: HEAD_OF_TEST + TAIL_OF_TEST,
        });

        // the driver's re-drive lands 5m after the first poke, so its run dir
        // must APPEAR mid-flight: a dir seeded up front would read at wake 1 as a
        // touch from the future, and the case would test the defer instead
        const clockBase = genClockFake({
          at: new Date('2026-09-24T10:00:00.000Z'),
        });
        const clock: WarmerClock & { waits: number[] } = {
          waits: clockBase.waits,
          now: clockBase.now,
          sleep: async (minutes) => {
            await clockBase.sleep(minutes);
            if (clockBase.waits.length === 2)
              setOneReviewRunLogDir({
                cwd,
                stamp: '2026-09-24T10-20-00-000Z',
                slug: 'repo-rules',
              });
          },
        };

        return {
          cwd,
          logDir,
          stub: genBrainStub({ cacheGetTokens: 998, throwOn: null }),
          clock,
        };
      });

      when('[t0] the warmer runs its two-poke budget', () => {
        const result = useThen('it completes', async () => {
          await setReviewWarmerPokes(
            {
              cwd: scene.cwd,
              reviewer: 'repo-rules',
              plan: { pokes: 2, everyMinutes: 15 },
              logDir: scene.logDir,
              prefix: PREFIX_OF_TEST,
              pid: PID_OF_TEST,
            },
            { brain: scene.stub.brain, clock: scene.clock },
          );
          return {
            rows: getAllRows({
              at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
            }),
          };
        });

        then(
          '🔴 the review REFILLED the budget — the full plan follows it',
          () => {
            // two pokes after the review, as the plan declared, plus the one before it
            expect(scene.stub.calls.length).toEqual(3);
            expect(result.rows.map((row) => row.act)).toEqual([
              'poke',
              'defer',
              'poke',
              'poke',
              'retire',
            ]);
          },
        );

        then('the attempts count from the review, never from spawn', () => {
          expect(result.rows.map((row) => row.attempt)).toEqual([
            1, 0, 1, 2, 2,
          ]);
        });

        then('the last poke lands a full plan past the review', () => {
          // 10:20 review + 2 pokes x 15m = 10:50
          expect(result.rows[3]?.at).toEqual('2026-09-24T10:50:00.000Z');
        });
      });
    },
  );

  given('[case5] a provider that refuses the first poke of two', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-run-poke-faults' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });

      // a poke reaches a live provider over a network, so a refusal is ordinary
      // rather than exotic. the stub refuses ONCE, so the case asserts both
      // halves at once: the fault is recorded, and the budget still runs on
      const stub = genBrainStub({
        cacheGetTokens: 998,
        throwOn: { call: 1, error: new Error('a warmer poke timed out') },
      });

      return { cwd, logDir, calls: stub.calls, brain: stub.brain };
    });

    when('[t0] the warmer runs its two-poke budget', () => {
      const done = useThen('it RETURNS rather than dies', async () => {
        // the sharpest half. this warmer is detached with `stdio: 'ignore'`, so a
        // rejection that escaped the loop would kill it with no terminal to print
        // to — and every poke the budget still owed would never be sent
        await setReviewWarmerPokes(
          {
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            plan: { pokes: 2, everyMinutes: 0 },
            logDir: scene.logDir,
            prefix: PREFIX_OF_TEST,
            pid: PID_OF_TEST,
          },
          {
            brain: scene.brain,
            clock: genClockFake({ at: new Date('2026-09-24T10:00:00.000Z') }),
          },
        );
        return { ran: true };
      });

      then('🔴 the fault is RECORDED, and the row names it', () => {
        expect(done.ran).toEqual(true);
        const rows = getAllRows({
          at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
        });
        expect(rows.map((row) => row.act)).toEqual(['fault', 'poke', 'retire']);
        expect(rows[0]?.why).toContain('a warmer poke timed out');
      });

      then(
        '🔴 and the terminator parts a spent budget from a DEATH on the fault',
        () => {
          // the case the terminator exists for, at its sharpest. reverse the stub
          // and this log reads `poke, fault` — which is the record of a warmer that
          // spent its budget AND of one that died on a wedged provider with pokes
          // still owed. those are different facts about money, and with no
          // terminator the record could not part them
          const rows = getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          });
          const last = rows[rows.length - 1];
          expect(last?.act).toEqual('retire');
          expect(last?.why).toContain('2 of 2');
        },
      );

      then(
        '🔴 the fault measured NAUGHT — never a free zero-token poke',
        () => {
          // an unmeasured spend graded as a measured poke of zero tokens is a wedge
          // rendered as a free success, which is the failhide the meter refuses
          const rows = getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          });
          expect(rows[0]?.measured).toEqual(null);
        },
      );

      then(
        '🔴 the fault SPENT its attempt, so the budget stays bounded',
        () => {
          // a timeout abandons the wait and cannot cancel the provider's work, so the
          // call may well have billed. a fault that advanced no counter would let a
          // wedged provider loop the warmer without bound
          const rows = getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          });
          expect(rows[0]?.attempt).toEqual(1);
          expect(rows[1]?.attempt).toEqual(2);
        },
      );

      then('and the REMAINING budget was still spent — 2 calls', () => {
        expect(scene.calls.length).toEqual(2);
      });

      then('and the fault row reached the VOICE log too', () => {
        // bar 9b: a detached warmer's rows are its only voice, so a fault must be
        // legible where a driver reads mid-flight, never in the run dir alone
        const rows = getAllRows({
          at: asReviewWarmerOutputPath({
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            run: path.basename(scene.logDir),
          }),
        });
        expect(rows.map((row) => row.act)).toContain('fault');
      });
    });
  });

  given(
    '[case7] a SECOND warmer, spawned for the same lane a week later',
    () => {
      /**
       * .why = `0.wish` bar 17 promises the FILENAME keeps an earlier record, and
       *        no key it has ever carried does. under the `attempt` key the counter
       *        reset to 1 on every spawn; under the `run` key a re-spawn for one run
       *        addresses that run's file again. either way the two spawns write ONE
       *        path, and what protects the earlier row is the `appendFileSync` in
       *        `setOneWarmerPokeRow`.
       *
       *        ⇒ so the guarantee was real and its clamp was aimed at the wrong
       *        mechanism: `asReviewWarmerDir.test` asserted two ATTEMPT numbers
       *        differ, which is true and says naught about spawns. this case tests the
       *        mechanism that carries it.
       *
       * .note = a re-spawn for ONE run is the case that survives the 2026-09-26 re-key,
       *         and it is real: a warmer that died or was killed leaves a stale pid the
       *         liveness probe clears, so the next round of the same review findserts a
       *         fresh warmer onto the same `logDir`.
       *
       * .note = the harm a truncate would ship is a silent one, and it lands on the
       *        surface bar 9b built for a driver to trust: they `cat` the log to see
       *        what a detached spender has done, and read a file whose history was
       *        erased by the very next round. that is the defect `0.wish` bar 9 opens
       *        with — an engine act with no record — re-created by a write mode.
       */
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'warmer-run-second-spawn' });
        const logDir = setOneRunLogDir({
          cwd,
          prompt: HEAD_OF_TEST + TAIL_OF_TEST,
        });
        return { cwd, logDir };
      });

      when('[t0] both warmers have run, a week apart', () => {
        const done = useThen('both runs complete', async () => {
          // the FIRST spawn — one poke, then it exits and its pid file is cleared
          await setReviewWarmerPokes(
            {
              cwd: scene.cwd,
              reviewer: 'repo-rules',
              plan: { pokes: 1, everyMinutes: 0 },
              logDir: scene.logDir,
              prefix: PREFIX_OF_TEST,
              pid: PID_OF_TEST,
            },
            {
              brain: genBrainStub({ cacheGetTokens: 998, throwOn: null }).brain,
              clock: genClockFake({ at: new Date('2026-09-24T10:00:00.000Z') }),
            },
          );

          // the SECOND spawn, a week on. it serves the same run, so it addresses the
          // identical path the first one wrote
          await setReviewWarmerPokes(
            {
              cwd: scene.cwd,
              reviewer: 'repo-rules',
              plan: { pokes: 1, everyMinutes: 0 },
              logDir: scene.logDir,
              prefix: PREFIX_OF_TEST,
              pid: PID_OF_TEST,
            },
            {
              brain: genBrainStub({ cacheGetTokens: 998, throwOn: null }).brain,
              clock: genClockFake({ at: new Date('2026-10-01T10:00:00.000Z') }),
            },
          );
          return { ran: true };
        });

        then(
          '🔴 BOTH rounds survive in one file — the append is the guarantee',
          () => {
            // the discriminator, and it is the assertion a `writeFileSync` breaks.
            //
            // it counts POKES rather than rows, because each spawn also writes a
            // terminator: a 1-poke plan leaves `poke, retire`, so the file holds 4
            // rows for 2 rounds. the pokes are what a truncate would have erased,
            // so they are what this must assert
            const rows = getAllRows({
              at: asReviewWarmerOutputPath({
                cwd: scene.cwd,
                reviewer: 'repo-rules',
                run: path.basename(scene.logDir),
              }),
            });
            expect(done.ran).toEqual(true);
            expect(rows.filter((row) => row.act === 'poke').length).toEqual(2);
            expect(rows.map((row) => row.act)).toEqual([
              'poke',
              'retire',
              'poke',
              'retire',
            ]);
          },
        );

        then(
          '🔴 and the two are DISTINGUISHABLE, by `at` rather than by path',
          () => {
            // the filename cannot part them, so the row must. without a distinct `at` a
            // driver reads two identical lines and cannot tell a stale poke from a live
            // one — which is what makes the wrong-axis key a readability defect rather
            // than merely an inelegant one
            const pokes = getAllRows({
              at: asReviewWarmerOutputPath({
                cwd: scene.cwd,
                reviewer: 'repo-rules',
                run: path.basename(scene.logDir),
              }),
            }).filter((row) => row.act === 'poke');
            expect(pokes[0]?.at).not.toEqual(pokes[1]?.at);
            expect(pokes[0]?.at).toContain('2026-09-24');
            expect(pokes[1]?.at).toContain('2026-10-01');
          },
        );

        then('and the run-dir sink accumulated both too', () => {
          // the two sinks are keyed on different axes and neither substitutes for the
          // other, so the append guarantee is owed at BOTH (bar 9 and bar 9b)
          const rows = getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          });
          expect(rows.filter((row) => row.act === 'poke').length).toEqual(2);
        });
      });
    },
  );

  given('[case8] the VOICE sink cannot be written', () => {
    /**
     * .why = the two sinks are NOT equals. the run-dir sink is the ledger
     *           `review._.cost` reads (bar 9); the voice log is a `cat`
     *           convenience (bar 9b) that no operation consumes — so a failure
     *           of the lesser one must never kill the warmer outright.
     *
     *           an unguarded throw here escapes the loop, passes `reviewWarmer`'s
     *           catch-less `try/finally`, reaches an entry with no `.catch()`, and
     *           kills a process spawned `stdio: 'ignore'`.
     *
     *           ⇒ so the price of an unwritable convenience file would be every
     *           poke the budget still owed. the lane then meets the next round
     *           cold at ~45× — the precise harm the warmer exists to prevent.
     *
     * .note = the fixture makes the path a DIRECTORY, so `appendFileSync` throws
     *         `EISDIR` — a real errno from the real fs, never a stubbed throw
     *         (rule.forbid.integration.mocks). it is also the shape a stray `mkdir -p`
     *         on the cache tree would leave behind.
     */
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-sink-unwritable' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });
      // occupy the exact path this warmer's voice log writes, with a directory
      fs.mkdirSync(
        asReviewWarmerOutputPath({
          cwd,
          reviewer: 'repo-rules',
          run: path.basename(logDir),
        }),
        { recursive: true },
      );
      return { cwd, logDir };
    });

    when('[t0] the warmer runs its whole plan', () => {
      const done = useThen('it completes rather than dies', async () => {
        await setReviewWarmerPokes(
          {
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            plan: { pokes: 2, everyMinutes: 0 },
            logDir: scene.logDir,
            prefix: PREFIX_OF_TEST,
            pid: PID_OF_TEST,
          },
          {
            brain: genBrainStub({ cacheGetTokens: 998, throwOn: null }).brain,
            clock: genClockFake({ at: new Date('2026-09-25T10:00:00.000Z') }),
          },
        );
        return { ran: true };
      });

      then('🔴 every poke the budget owed was still sent', () => {
        // the discriminator. unguarded, the FIRST row's write throws and the warmer
        // dies with 2 of 2 pokes unsent — so this reads 0
        const rows = getAllRows({
          at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
        });
        expect(done.ran).toEqual(true);
        expect(rows.filter((row) => row.act === 'poke').length).toEqual(2);
      });

      then(
        '🔴 and the LEDGER is whole — the money question is fully answered',
        () => {
          // the order carries weight: the ledger is written before the convenience
          // sink, so the sink's failure cannot truncate the record a reader prices
          const rows = getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          });
          expect(rows.map((row) => row.act)).toEqual([
            'poke',
            'poke',
            'retire',
          ]);
          expect(rows[0]?.measured?.cacheGetTokens).toEqual(998);
        },
      );

      then(
        '🟡 and a genuine fs error is what was survived, never swallowed whole',
        () => {
          // the allowlist is by KIND: an errno is expected and survivable here because
          // the ledger already holds the row. the path is still a directory afterward,
          // so the failure was real on every attempt rather than a one-time race
          const pathOfVoice = asReviewWarmerOutputPath({
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            run: path.basename(scene.logDir),
          });
          expect(fs.statSync(pathOfVoice).isDirectory()).toEqual(true);
        },
      );
    });
  });

  given('[case8b] the LEDGER sink cannot be written', () => {
    /**
     * .why = the inverse of `[case8]`, and so is the verdict. the ledger is what
     *        `review._.cost` reads (bar 9); a warmer that cannot write it would bill
     *        every further poke where no meter can see it. so it must STOP, loud —
     *        never survive quiet, and never die with no trace.
     *
     * .note = the fixture occupies the ledger path with a directory, so the real fs
     *         throws `EISDIR` (rule.forbid.integration.mocks)
     */
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-ledger-unwritable' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });
      fs.mkdirSync(path.join(logDir, NAME_OF_WARMER_ROWS), { recursive: true });
      const stub = genBrainStub({ cacheGetTokens: 998, throwOn: null });
      return { cwd, logDir, stub };
    });

    when('[t0] the warmer runs a plan of three pokes', () => {
      const halt = useThen('it halts with an error', async () => ({
        error: await getError(
          setReviewWarmerPokes(
            {
              cwd: scene.cwd,
              reviewer: 'repo-rules',
              plan: { pokes: 3, everyMinutes: 0 },
              logDir: scene.logDir,
              prefix: PREFIX_OF_TEST,
              pid: PID_OF_TEST,
            },
            {
              brain: scene.stub.brain,
              clock: genClockFake({ at: new Date('2026-09-25T10:00:00.000Z') }),
            },
          ),
        ),
      }));

      then('🔴 the halt is a malfunction that names the ledger', () => {
        expect(halt.error).toBeInstanceOf(UnexpectedCodePathError);
        expect(halt.error.message).toContain(
          'warmer cost record write refused',
        );
        expect(halt.error.message).toContain(NAME_OF_WARMER_ROWS);
      });

      then('🔴 no poke followed the refused row — 1 of 3 sent', () => {
        // the discriminator. a survive-quiet recast keeps the loop alive and bills
        // all three, with none of them on the ledger
        expect(scene.stub.calls.length).toEqual(1);
      });

      then(
        '🟡 and the voice log holds the spent poke plus a retire that names why',
        () => {
          const rows = getAllRows({
            at: asReviewWarmerOutputPath({
              cwd: scene.cwd,
              reviewer: 'repo-rules',
              run: path.basename(scene.logDir),
            }),
          });
          expect(rows.map((row) => row.act)).toEqual(['poke', 'retire']);
          expect(rows[0]?.measured?.cacheGetTokens).toEqual(998);
          expect(rows[1]?.why).toContain('the ledger refused a write');
        },
      );
    });
  });

  given('[case10] a driver who reads the ledger between two wakes', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-run-read-midflight' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });
      return {
        cwd,
        logDir,
        stub: genBrainStub({ cacheGetTokens: 998, throwOn: null }),
        clock: genClockWatched({
          at: new Date('2026-09-24T10:00:00.000Z'),
          watch: () =>
            getAllActsSoFar({ at: path.join(logDir, NAME_OF_WARMER_ROWS) }),
        }),
      };
    });

    when('[t0] the warmer runs a three-poke plan at a real cadence', () => {
      const done = useThen('it completes', async () => {
        await setReviewWarmerPokes(
          {
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            plan: { pokes: 3, everyMinutes: 15 },
            logDir: scene.logDir,
            prefix: PREFIX_OF_TEST,
            pid: PID_OF_TEST,
          },
          { brain: scene.stub.brain, clock: scene.clock },
        );
        return { ran: true };
      });

      then(
        '🔴 each poke is on disk BEFORE the next wake, never at exit',
        () => {
          // the discriminator, and no other case in this file can be it: every one
          // of them reads the ledger AFTER the warmer returned, which cannot part a
          // per-poke flush from one batched write at exit. the clock's `sleep` is
          // the only seam where a driver's mid-flight `cat` can be stood in for.
          //
          //    ⇒ so the assertion is on the GROWTH, never the end state. the wait
          //    before poke 1 sees an absent file; each later wait sees every poke
          //    already spent. a buffered write reads `[], [], []`
          expect(done.ran).toEqual(true);
          expect(scene.clock.seen).toEqual([[], ['poke'], ['poke', 'poke']]);
        },
      );

      then('and the record is whole once it retires', () => {
        // bounds what the growth above MEANS: a ledger that grew per poke and then
        // lost a row would satisfy the sequence and still misprice the round
        expect(
          getAllActsSoFar({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          }),
        ).toEqual(['poke', 'poke', 'poke', 'retire']);
      });
    });
  });

  given('[case11] a poke whose own code throws a defect, not a fault', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-run-poke-defect' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });

      // a TypeError is what a bug in the poke's own code raises — a bad
      // property read — and no provider raises it through the sdk. it must
      // surface as itself, never sit in the ledger misnamed as a provider fault
      const { brain } = genBrainStub({
        cacheGetTokens: 998,
        throwOn: {
          call: 1,
          error: new TypeError('cannot read properties of undefined'),
        },
      });

      return { cwd, logDir, brain };
    });

    when('[t0] the warmer runs', () => {
      const error = useThen('it REJECTS with the defect', async () => {
        // .note = a plain shape, never the Error — `useThen` hands back a proxy
        //         that sees only own enumerable props, and `name` is neither
        const thrown = await getError(
          setReviewWarmerPokes(
            {
              cwd: scene.cwd,
              reviewer: 'repo-rules',
              plan: { pokes: 2, everyMinutes: 0 },
              logDir: scene.logDir,
              prefix: PREFIX_OF_TEST,
              pid: PID_OF_TEST,
            },
            {
              brain: scene.brain,
              clock: genClockFake({ at: new Date('2026-09-24T10:00:00.000Z') }),
            },
          ),
        );
        return {
          isTypeError: thrown instanceof TypeError,
          message: thrown.message,
        };
      });

      then('🔴 the defect surfaces as itself', () => {
        expect(error.isTypeError).toEqual(true);
        expect(error.message).toContain('cannot read properties');
      });

      then('and the ledger files no fault under the provider name', () => {
        const pathOfRows = path.join(scene.logDir, NAME_OF_WARMER_ROWS);
        const rows = fs.existsSync(pathOfRows)
          ? getAllRows({ at: pathOfRows })
          : [];
        expect(rows.map((row) => row.act)).not.toContain('fault');
      });
    });
  });

  given('[case14] two warmers of ONE prefix, awake at once', () => {
    /**
     * .why = the clamp on the poke claim. a duplicate spawn — or a respawn beside a
     *        warmer that still beats — puts two loops on one prefix. each runs its
     *        own clock, and without a shared watermark each would poke on it and
     *        each would bill in full, for one cache. the claim on the prefix's
     *        last-poked-at is what makes a duplicate cost a check, never a poke
     */
    const T0 = new Date('2026-09-24T10:00:00.000Z');
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-run-duplicate' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });
      return {
        cwd,
        logDir,
        stub: genBrainStub({ cacheGetTokens: 998, throwOn: null }),
      };
    });

    when('[t0] both run to completion, each on its own clock', () => {
      const rows = useThen('both return', async () => {
        const plan = { pokes: 3, everyMinutes: 15 };
        await Promise.all(
          [0, 1].map(() =>
            setReviewWarmerPokes(
              {
                cwd: scene.cwd,
                reviewer: 'repo-rules',
                plan,
                logDir: scene.logDir,
                prefix: PREFIX_OF_TEST,
                pid: PID_OF_TEST,
              },
              { brain: scene.stub.brain, clock: genClockFake({ at: T0 }) },
            ),
          ),
        );
        return {
          all: getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          }),
        };
      });

      then(
        '🔴 the first wake pokes ONCE in total, never once per warmer',
        () => {
          const firstWake = new Date(T0.getTime() + 15 * 60_000).toISOString();
          const pokesAtFirstWake = rows.all.filter(
            (row) => row.act === 'poke' && row.at === firstWake,
          );
          expect(pokesAtFirstWake).toHaveLength(1);
        },
      );

      then('🔴 no two pokes of the prefix land within one cadence', () => {
        const instants = rows.all
          .filter((row) => row.act === 'poke')
          .map((row) => new Date(row.at).getTime())
          .sort((a, b) => a - b);
        const gaps = instants
          .slice(1)
          .map((at, index) => (at - instants[index]!) / 60_000);
        expect(gaps.every((gap) => gap >= 15)).toEqual(true);
      });

      then('the peer that did not poke says so, as a defer', () => {
        // two routes reach the same defer, by the order the two loops interleave: the
        // loser reads the peer's poke at its wake (a touch), or it loses the claim
        // under the hold. either one costs a check, never a poke
        const firstWake = new Date(T0.getTime() + 15 * 60_000).toISOString();
        expect(
          rows.all.some((row) => row.act === 'defer' && row.at === firstWake),
        ).toEqual(true);
      });

      then('every poke row matches one provider call', () => {
        expect(rows.all.filter((row) => row.act === 'poke')).toHaveLength(
          scene.stub.calls.length,
        );
      });
    });
  });

  given('[case15] a warmer whose prefix the lane no longer sends', () => {
    /**
     * .why = the clamp on supersession. a newer round recorded another head for this
     *        lane, so no later round reads this warmer's prefix. it must exit at its
     *        next wake, with no poke — a poke would warm a cache nobody reads
     */
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-run-superseded' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });
      await setReviewWarmerLane({
        cwd,
        reviewer: 'repo-rules',
        lane: { head: 'head-of-a-newer-round', brain: PREFIX_OF_TEST.brain },
      });
      return {
        cwd,
        logDir,
        stub: genBrainStub({ cacheGetTokens: 998, throwOn: null }),
      };
    });

    when('[t0] the warmer wakes', () => {
      const rows = useThen('it returns', async () => {
        await setReviewWarmerPokes(
          {
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            plan: { pokes: 2, everyMinutes: 0 },
            logDir: scene.logDir,
            prefix: PREFIX_OF_TEST,
            pid: PID_OF_TEST,
          },
          {
            brain: scene.stub.brain,
            clock: genClockFake({ at: new Date('2026-09-24T10:00:00.000Z') }),
          },
        );
        return {
          all: getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          }),
        };
      });

      then('🔴 it sends NO poke', () => {
        expect(scene.stub.calls).toHaveLength(0);
      });

      then('🔴 it retires, and names why', () => {
        expect(rows.all.map((row) => row.act)).toEqual(['retire']);
        expect(rows.all[0]?.why).toContain('no longer current');
      });
    });
  });

  given('[case16] a run in the live log root whose args cannot be read', () => {
    /**
     * .why = the clamp on the one read the loop had left unguarded. a detached warmer has
     *        no terminal, so a throw out of the log-root read would end it with no row —
     *        silent, and undebuggable from the ledger. it must write a `retire` row that
     *        names the fault, then let the fault stand
     */
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-run-log-root-fault' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });

      // a run minted after the warmer's start, whose args file is a DIR — a read fault
      // that is neither an absence nor a half-written file
      const run = setOneReviewRunLogDir({
        cwd,
        stamp: '2026-09-24T10-10-00-000Z',
        slug: 'repo-rules',
      });
      const argsAt = path.join(run.dir, 'input.args.json');
      fs.rmSync(argsAt);
      fs.mkdirSync(argsAt);

      return {
        cwd,
        logDir,
        stub: genBrainStub({ cacheGetTokens: 998, throwOn: null }),
      };
    });

    when('[t0] the warmer wakes', () => {
      const result = useThen('the fault stands', async () => {
        const error = await getError(
          setReviewWarmerPokes(
            {
              cwd: scene.cwd,
              reviewer: 'repo-rules',
              plan: { pokes: 2, everyMinutes: 0 },
              logDir: scene.logDir,
              prefix: PREFIX_OF_TEST,
              pid: PID_OF_TEST,
            },
            {
              brain: scene.stub.brain,
              clock: genClockFake({ at: new Date('2026-09-24T10:00:00.000Z') }),
            },
          ),
        );
        return {
          error,
          all: getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          }),
        };
      });

      then('🔴 the fault surfaces as itself, never swallowed', () => {
        expect(result.error.message).toContain(
          'could not read a review run args file',
        );
      });

      then('🔴 it sends NO poke on a touch it could not establish', () => {
        expect(scene.stub.calls).toHaveLength(0);
      });

      then('🔴 its last voice is a retire row that names the fault', () => {
        expect(result.all.map((row) => row.act)).toEqual(['retire']);
        expect(result.all[0]?.why).toContain(
          'the review log root could not be read',
        );
        expect(result.all[0]?.why).toContain(
          'could not read a review run args file',
        );
      });
    });
  });

  given('[case17] a duplicate warmer booted and took the record', () => {
    /**
     * .why = the clamp on displacement. the last warmer to boot names the record's pid,
     *        and a round prints that pid as THE kill that stops the spend. a warmer the
     *        record no longer names is one no printed kill reaches, so it must exit at
     *        its next wake, with no poke
     */
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-run-displaced' });
      const logDir = setOneRunLogDir({
        cwd,
        prompt: HEAD_OF_TEST + TAIL_OF_TEST,
      });
      // the duplicate's boot: it writes its own pid into this prefix's record
      await setReviewWarmerBoot({
        cwd,
        reviewer: 'repo-rules',
        prefix: PREFIX_OF_TEST,
        plan: { pokes: 2, everyMinutes: 0 },
        pid: PID_OF_TEST + 1,
        now: new Date('2026-09-24T10:00:00.000Z'),
      });
      return {
        cwd,
        logDir,
        stub: genBrainStub({ cacheGetTokens: 998, throwOn: null }),
      };
    });

    when('[t0] the displaced warmer wakes', () => {
      const rows = useThen('it returns', async () => {
        await setReviewWarmerPokes(
          {
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            plan: { pokes: 2, everyMinutes: 0 },
            logDir: scene.logDir,
            prefix: PREFIX_OF_TEST,
            pid: PID_OF_TEST,
          },
          {
            brain: scene.stub.brain,
            clock: genClockFake({ at: new Date('2026-09-24T10:00:00.000Z') }),
          },
        );
        return {
          all: getAllRows({
            at: path.join(scene.logDir, NAME_OF_WARMER_ROWS),
          }),
          record: await getOneReviewWarmerRecord({
            cwd: scene.cwd,
            reviewer: 'repo-rules',
            prefix: PREFIX_OF_TEST,
          }),
        };
      });

      then('🔴 it sends NO poke', () => {
        expect(scene.stub.calls).toHaveLength(0);
      });

      then('🔴 it retires, and names why', () => {
        expect(rows.all.map((row) => row.act)).toEqual(['retire']);
        expect(rows.all[0]?.why).toContain(
          'the record names another warmer of this prefix',
        );
      });

      then(
        'the record still names the duplicate — the one a printed kill reaches',
        () => {
          expect(rows.record?.pid).toEqual(PID_OF_TEST + 1);
        },
      );
    });
  });
});
