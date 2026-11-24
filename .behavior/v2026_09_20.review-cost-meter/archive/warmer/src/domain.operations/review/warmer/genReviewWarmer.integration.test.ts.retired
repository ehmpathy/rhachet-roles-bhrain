import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { DEFAULT_TEST_BRAIN } from '@src/.test/genTestBrainContext';
import { DIR_OF_REVIEW_WATERMARKS } from '@src/domain.operations/review/watermark/asReviewWatermarkDir';

import { genReviewWarmer } from './genReviewWarmer';
import { getOneInstantAfter } from './getOneInstantAfter';
import { getOneReviewWarmerLane } from './getOneReviewWarmerLane';
import { getOneReviewWarmerRecord } from './getOneReviewWarmerRecord';
import type {
  ReviewWarmerPrefix,
  ReviewWarmerRecord,
} from './ReviewWarmerRecord';
import { setReviewWarmerLane } from './setReviewWarmerLane';
import { setReviewWarmerRecord } from './setReviewWarmerRecord';

// the brain is stubbed and never dispatched; it only rides the prefix, so the versionless test default serves
const BRAIN_OF_TEST = DEFAULT_TEST_BRAIN;
const PLAN_OF_TEST = { pokes: 3, everyMinutes: 15 };
const REVIEWER = 'repo-rules';

/**
 * .what = stops a spawned warmer, and tolerates one that already exited
 * .why = the child is detached, so a test that leaves one alive leaks a process
 *        that spends real money on a cadence. a kill of an already-dead pid is the
 *        expected case, never an error — the child boots into a temp cwd where the
 *        package export is unreachable, so it exits at once
 */
const killQuietly = (input: { pid: number }): void => {
  try {
    process.kill(input.pid);
  } catch {
    // already exited — which is what the temp cwd makes likely
  }
};

/**
 * .what = writes the one artifact a warmer replays, so a spawn is not refused
 * .why = `genReviewWarmer` refuses where the prompt head is absent, so every case
 *        that means to exercise a later branch must satisfy this one first
 */
const setOneRunLogDir = (input: { cwd: string }): string => {
  const logDir = path.join(input.cwd, '.log', 'bhrain', 'review', 'run-1');
  fs.mkdirSync(logDir, { recursive: true });
  fs.writeFileSync(path.join(logDir, 'input.prompt.head.md'), '# rules\n');
  fs.writeFileSync(path.join(logDir, 'input.prompt.md'), '# rules\n<target/>');
  return logDir;
};

/**
 * .what = seeds a lane's current prefix and one warmer record of it, as a live
 *         warmer would have beat it
 * .why = liveness is the warmer's beat on its watermark, so a fixture is a record,
 *        never a lookalike process
 */
const setOneLiveWarmer = async (input: {
  cwd: string;
  prefix: ReviewWarmerPrefix;
  pid: number | null;
  wakeInMinutes: number;
  pokedAt: string | null;
}): Promise<void> => {
  const now = new Date();
  await setReviewWarmerLane({
    cwd: input.cwd,
    reviewer: REVIEWER,
    lane: input.prefix,
  });
  const record: ReviewWarmerRecord = {
    plan: PLAN_OF_TEST,
    pid: input.pid,
    spawnedAt: now.toISOString(),
    wakeBy: getOneInstantAfter({
      since: now,
      minutes: input.wakeInMinutes,
    }).toISOString(),
    pokedAt: input.pokedAt,
    endedAt: null,
  };
  await setReviewWarmerRecord({
    cwd: input.cwd,
    reviewer: REVIEWER,
    prefix: input.prefix,
    transit: () => ({ next: record, result: undefined }),
  });
};

describe('genReviewWarmer', () => {
  given('[case1] a run whose prompt head was never written', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-no-head' });
      return {
        cwd,
        logDir: path.join(cwd, '.log', 'bhrain', 'review', 'gone'),
      };
    });

    when('[t0] a warmer is asked for', () => {
      const spawn = useThen('it answers', () =>
        genReviewWarmer({
          cwd: scene.cwd,
          reviewer: REVIEWER,
          plan: PLAN_OF_TEST,
          logDir: scene.logDir,
          brain: BRAIN_OF_TEST,
          head: null,
        }),
      );

      then('🔴 it REFUSES rather than warms a prompt it cannot read', () => {
        expect(spawn.act).toEqual('refused');
      });

      then('the refusal names the path it looked at', () => {
        expect(spawn.why).toContain('input.prompt.head.md');
      });

      then(
        '🔴 the record it wrote is stamped ended, so no round defers to it',
        async () => {
          const record = await getOneReviewWarmerRecord({
            cwd: scene.cwd,
            reviewer: REVIEWER,
            prefix: { head: null, brain: BRAIN_OF_TEST },
          });
          expect(record?.endedAt).not.toEqual(null);
        },
      );
    });
  });

  given('[case2] a LIVE warmer already covers this prefix', () => {
    const prefix = { head: null, brain: BRAIN_OF_TEST };
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-found' });
      const logDir = setOneRunLogDir({ cwd });
      await setOneLiveWarmer({
        cwd,
        prefix,
        pid: 4242,
        wakeInMinutes: 15,
        pokedAt: null,
      });
      return { cwd, logDir };
    });

    when('[t0] a second round asks for a warmer', () => {
      const spawn = useThen('it answers', () =>
        genReviewWarmer({
          cwd: scene.cwd,
          reviewer: REVIEWER,
          plan: { pokes: 10, everyMinutes: 5 },
          logDir: scene.logDir,
          brain: BRAIN_OF_TEST,
          head: null,
        }),
      );
      afterAll(() => {
        if (spawn.act === 'spawned') killQuietly({ pid: spawn.pid });
      });

      then('🔴 it FINDS the live one rather than stacks a second', () => {
        expect(spawn.act).toEqual('found');
      });

      then('it names the pid the warmer beat', () => {
        expect(spawn.act === 'found' && spawn.pid).toEqual(4242);
      });

      then('🔴 it carries the LIVE plan beside the asked one', () => {
        // a findsert keeps the live warmer's plan; the render must say the asked
        // plan was discarded (`0.wish` bar 11)
        expect(spawn.act === 'found' && spawn.live).toEqual(PLAN_OF_TEST);
        expect(spawn.act === 'found' && spawn.asked).toEqual({
          pokes: 10,
          everyMinutes: 5,
        });
      });
    });

    when('[t1] a DIFFERENT reviewer asks for a warmer', () => {
      const spawn = useThen('it answers', () =>
        genReviewWarmer({
          cwd: scene.cwd,
          reviewer: 'mech-failhides',
          plan: PLAN_OF_TEST,
          logDir: scene.logDir,
          brain: BRAIN_OF_TEST,
          head: null,
        }),
      );
      afterAll(() => {
        if (spawn.act === 'spawned') killQuietly({ pid: spawn.pid });
      });

      then('🔴 the record is per-reviewer, so it does not defer', () => {
        expect(spawn.act).toEqual('spawned');
      });
    });
  });

  given('[case3] a run with its artifacts on disk and no warmer alive', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-spawn' });
      return { cwd, logDir: setOneRunLogDir({ cwd }) };
    });

    when('[t0] a warmer is asked for', () => {
      const spawn = useThen('it spawns', () =>
        genReviewWarmer({
          cwd: scene.cwd,
          reviewer: REVIEWER,
          plan: PLAN_OF_TEST,
          logDir: scene.logDir,
          brain: BRAIN_OF_TEST,
          head: null,
        }),
      );
      afterAll(() => {
        if (spawn.act === 'spawned') killQuietly({ pid: spawn.pid });
      });

      then('it reports the plan it spawned with', () => {
        expect(spawn.act).toEqual('spawned');
        expect(spawn.why).toContain('3 pokes');
        expect(spawn.why).toContain('15m');
      });

      then(
        '🔴 it records the PLAN — the record the next round reads',
        async () => {
          const record = await getOneReviewWarmerRecord({
            cwd: scene.cwd,
            reviewer: REVIEWER,
            prefix: { head: null, brain: BRAIN_OF_TEST },
          });
          expect(record?.plan).toEqual(PLAN_OF_TEST);
          expect(record?.endedAt).toEqual(null);
        },
      );

      then('🔴 it records this prefix as the lane`s current one', async () => {
        expect(
          await getOneReviewWarmerLane({ cwd: scene.cwd, reviewer: REVIEWER }),
        ).toEqual({ head: null, brain: BRAIN_OF_TEST });
      });

      then(
        '🔴 so a second round inside the boot window FINDS it, never stacks',
        async () => {
          // the child has not yet beat its pid, so the second round reads the
          // record the first one wrote — the dedupe holds through the boot window
          const second = await genReviewWarmer({
            cwd: scene.cwd,
            reviewer: REVIEWER,
            plan: PLAN_OF_TEST,
            logDir: scene.logDir,
            brain: BRAIN_OF_TEST,
            head: null,
          });
          if (second.act === 'spawned') killQuietly({ pid: second.pid });
          expect(second.act).toEqual('found');
          expect(second.act === 'found' && second.live).toEqual(PLAN_OF_TEST);
        },
      );
    });
  });

  given('[case4] a CUSTOM plan, not the default shape', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-spawn-custom' });
      return { cwd, logDir: setOneRunLogDir({ cwd }) };
    });

    when('[t0] a warmer is asked for with it', () => {
      const spawn = useThen('it spawns', () =>
        genReviewWarmer({
          cwd: scene.cwd,
          reviewer: REVIEWER,
          plan: { pokes: 5, everyMinutes: 10 },
          logDir: scene.logDir,
          brain: BRAIN_OF_TEST,
          head: null,
        }),
      );
      afterAll(() => {
        if (spawn.act === 'spawned') killQuietly({ pid: spawn.pid });
      });

      then('🔴 it reports the plan it was GIVEN, never a default', () => {
        expect(spawn.act).toEqual('spawned');
        expect(spawn.why).toContain('5 pokes');
        expect(spawn.why).toContain('10m');
        expect(spawn.why).not.toContain('3 pokes');
      });
    });
  });

  given('[case5] a LIVE warmer of a PRIOR prompt head', () => {
    const prior = { head: 'aaaaaaaaaaaaaaaa', brain: BRAIN_OF_TEST };
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-stale-head' });
      const logDir = setOneRunLogDir({ cwd });
      await setOneLiveWarmer({
        cwd,
        prefix: prior,
        pid: 4242,
        wakeInMinutes: 15,
        pokedAt: null,
      });
      return { cwd, logDir };
    });

    when('[t0] a round with a new head asks for a warmer', () => {
      const spawn = useThen('it answers', () =>
        genReviewWarmer({
          cwd: scene.cwd,
          reviewer: REVIEWER,
          plan: PLAN_OF_TEST,
          logDir: scene.logDir,
          brain: BRAIN_OF_TEST,
          head: 'bbbbbbbbbbbbbbbb',
        }),
      );
      afterAll(() => {
        if (spawn.act === 'spawned') killQuietly({ pid: spawn.pid });
      });

      then('🔴 it spawns a warmer for the new head, never defers', () => {
        expect(spawn.act).toEqual('spawned');
      });

      then('it says the prior warmer retires at its next wake', () => {
        expect(spawn.why).toContain(
          'the warmer of the prior prompt head retires at its next wake',
        );
      });

      then(
        '🔴 the lane now names the new head — the prior warmer`s cue to exit',
        async () => {
          expect(
            await getOneReviewWarmerLane({
              cwd: scene.cwd,
              reviewer: REVIEWER,
            }),
          ).toEqual({ head: 'bbbbbbbbbbbbbbbb', brain: BRAIN_OF_TEST });
        },
      );
    });
  });

  given('[case6] a warmer of this prefix whose promised wake lapsed', () => {
    const prefix = { head: null, brain: BRAIN_OF_TEST };
    const pokedAt = new Date(Date.now() - 5 * 60_000).toISOString();
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-lapsed' });
      const logDir = setOneRunLogDir({ cwd });
      // a crashed warmer stops to beat: its promise sits an hour in the past
      await setOneLiveWarmer({
        cwd,
        prefix,
        pid: 4242,
        wakeInMinutes: -60,
        pokedAt,
      });
      return { cwd, logDir };
    });

    when('[t0] the next round asks for a warmer', () => {
      const spawn = useThen('it answers', () =>
        genReviewWarmer({
          cwd: scene.cwd,
          reviewer: REVIEWER,
          plan: PLAN_OF_TEST,
          logDir: scene.logDir,
          brain: BRAIN_OF_TEST,
          head: null,
        }),
      );
      afterAll(() => {
        if (spawn.act === 'spawned') killQuietly({ pid: spawn.pid });
      });

      then('🔴 a dead warmer never latches the lane — it spawns anew', () => {
        expect(spawn.act).toEqual('spawned');
      });

      then(
        '🔴 the fresh record keeps the prefix`s last poke, so the new warmer honors it',
        async () => {
          const record = await getOneReviewWarmerRecord({
            cwd: scene.cwd,
            reviewer: REVIEWER,
            prefix,
          });
          expect(record?.pokedAt).toEqual(pokedAt);
          expect(record?.pid).toEqual(null);
        },
      );
    });
  });

  given('[case7] a watermark store the filesystem refuses', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-watermark-refused' });
      const logDir = setOneRunLogDir({ cwd });
      // a plain file where the watermark dir must go: every write beneath it fails
      const at = path.join(cwd, DIR_OF_REVIEW_WATERMARKS);
      fs.mkdirSync(path.dirname(at), { recursive: true });
      fs.writeFileSync(at, 'not a dir\n');
      return { cwd, logDir };
    });

    when('[t0] a warmer is asked for', () => {
      const spawn = useThen('it returns rather than throws', () =>
        genReviewWarmer({
          cwd: scene.cwd,
          reviewer: REVIEWER,
          plan: PLAN_OF_TEST,
          logDir: scene.logDir,
          brain: BRAIN_OF_TEST,
          head: null,
        }),
      );
      afterAll(() => {
        if (spawn.act === 'spawned') killQuietly({ pid: spawn.pid });
      });

      then('🔴 it REFUSES as a malfunction, and the review stands', () => {
        expect(spawn.act).toEqual('refused');
        expect(spawn.act === 'refused' && spawn.malfunction).toEqual(true);
        expect(spawn.why).toContain('the review stands');
      });
    });
  });
});
