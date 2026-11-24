import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { isReviewLanePrefixSuperseded } from '@src/domain.operations/review/isReviewLanePrefixSuperseded';

import { getOneInstantAfter } from './getOneInstantAfter';
import { getOneReviewWarmerLane } from './getOneReviewWarmerLane';
import type {
  ReviewWarmerPrefix,
  ReviewWarmerRecord,
} from './ReviewWarmerRecord';
import { setReviewWarmerLane } from './setReviewWarmerLane';
import { setReviewWarmerOfRound } from './setReviewWarmerOfRound';
import { setReviewWarmerRecord } from './setReviewWarmerRecord';

const REVIEWER = 'repo-rules';
const BRAIN = 'test/brain';
const HEAD_PRIOR = 'head-prior';
const PREFIX_PRIOR: ReviewWarmerPrefix = { head: HEAD_PRIOR, brain: BRAIN };
const PID_OF_WARMER = 4242;

/**
 * .what = seeds a lane whose prior round spawned a warmer that still beats
 * .why = liveness is the warmer's beat on its watermark, so the fixture is a record,
 *        never a live process
 */
const setOnePriorWarmer = async (input: { cwd: string }): Promise<void> => {
  const now = new Date();
  const record: ReviewWarmerRecord = {
    plan: { pokes: 12, everyMinutes: 15 },
    pid: PID_OF_WARMER,
    spawnedAt: now.toJSON(),
    wakeBy: getOneInstantAfter({ since: now, minutes: 15 }).toJSON(),
    pokedAt: null,
    endedAt: null,
  };
  await setReviewWarmerLane({
    cwd: input.cwd,
    reviewer: REVIEWER,
    lane: PREFIX_PRIOR,
  });
  await setReviewWarmerRecord({
    cwd: input.cwd,
    reviewer: REVIEWER,
    prefix: PREFIX_PRIOR,
    transit: () => ({ next: record, result: undefined }),
  });
};

/**
 * .what = runs an `--warmer off` round on a given head, and captures its stderr
 * .why = the round's aside rides stderr, the stream no verdict parser reads
 */
const setOneOffRound = async (input: {
  cwd: string;
  head: string;
}): Promise<{ stderr: string }> => {
  const lines: string[] = [];
  const errBefore = console.error;
  console.error = (...args: unknown[]) => void lines.push(args.join(' '));
  try {
    await setReviewWarmerOfRound({
      cwd: input.cwd,
      lane: {
        root: path.join(input.cwd, '.log/bhrain/review'),
        slug: REVIEWER,
        head: input.head,
        brain: BRAIN,
      },
      plan: null,
      logDir: path.join(input.cwd, '.log/bhrain/review/run'),
    });
  } finally {
    console.error = errBefore;
  }
  return { stderr: lines.join('\n') };
};

describe('setReviewWarmerOfRound', () => {
  given(
    '[case1] 🔴 CLAMP. an `--warmer off` round on a new head, after a warmer of the old one',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'warmer-of-round-off-new-head' });
        await setOnePriorWarmer({ cwd });
        const round = await setOneOffRound({ cwd, head: 'head-next' });
        const lane = await getOneReviewWarmerLane({ cwd, reviewer: REVIEWER });
        return { round, lane };
      });

      when('[t0] the round settles', () => {
        then('🔴 the lane now names the new head as its current prefix', () => {
          // the defect this clamps: an off round wrote no lane, so the earlier warmer
          // still found its own prefix current and poked on at full price
          expect(scene.lane).toEqual({ head: 'head-next', brain: BRAIN });
        });

        then(
          '🔴 the earlier warmer reads its prefix as superseded, so it exits at its next wake',
          () => {
            expect(scene.lane).not.toBeNull();
            expect(
              isReviewLanePrefixSuperseded({
                asked: PREFIX_PRIOR,
                live: scene.lane ?? PREFIX_PRIOR,
              }),
            ).toBe(true);
          },
        );

        then(
          'the round names no warmer of the new prefix, since none is awake',
          () => {
            expect(scene.round.stderr).toEqual('');
          },
        );
      });
    },
  );

  given(
    '[case2] an `--warmer off` round on the same head as the warmer still awake',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'warmer-of-round-off-same-head' });
        await setOnePriorWarmer({ cwd });
        const round = await setOneOffRound({ cwd, head: HEAD_PRIOR });
        const lane = await getOneReviewWarmerLane({ cwd, reviewer: REVIEWER });
        return { round, lane };
      });

      when('[t0] the round settles', () => {
        then('the lane still names the same prefix', () => {
          expect(scene.lane).toEqual(PREFIX_PRIOR);
        });

        then('the warmer still awake on it is named, with its kill', () => {
          expect(scene.round.stderr).toContain('STILL awake');
          expect(scene.round.stderr).toContain(`kill ${PID_OF_WARMER}`);
        });

        then('the aside matches the snapshot', () => {
          expect(scene.round.stderr).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case3] an `--warmer off` round on a lane no warmer ever ran on',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'warmer-of-round-off-never-warmed' });
        const round = await setOneOffRound({ cwd, head: 'head-next' });
        const lane = await getOneReviewWarmerLane({ cwd, reviewer: REVIEWER });
        return { round, lane };
      });

      when('[t0] the round settles', () => {
        then(
          'no lane is recorded — the default round writes no watermark',
          () => {
            expect(scene.lane).toBeNull();
          },
        );

        then('it says naught', () => {
          expect(scene.round.stderr).toEqual('');
        });
      });
    },
  );
});
