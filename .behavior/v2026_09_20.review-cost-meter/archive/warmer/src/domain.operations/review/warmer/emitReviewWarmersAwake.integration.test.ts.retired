import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { emitReviewWarmersAwake } from './emitReviewWarmersAwake';
import { getOneInstantAfter } from './getOneInstantAfter';
import type {
  ReviewWarmerPrefix,
  ReviewWarmerRecord,
} from './ReviewWarmerRecord';
import { setReviewWarmerLane } from './setReviewWarmerLane';
import { setReviewWarmerRecord } from './setReviewWarmerRecord';

const PREFIX: ReviewWarmerPrefix = {
  head: 'head-of-test',
  brain: 'test/brain',
};

/**
 * .what = captures what the emit printed to stderr, and restores the console after
 * .why = the emit's whole contract is its rendered text. `console.log` stays unpatched,
 *        so a line that regressed onto stdout — where a `--json` document sits — would be
 *        invisible here and the cases below would go red
 */
const getOneEmitStderr = async (input: {
  cwd: string;
  reviewers: string[];
}): Promise<string> => {
  const lines: string[] = [];
  const errBefore = console.error;
  console.error = (...args: unknown[]): void => {
    lines.push(args.map(String).join(' '));
  };
  try {
    await emitReviewWarmersAwake(input);
  } finally {
    console.error = errBefore;
  }
  return lines.join('\n');
};

/**
 * .what = seeds one lane's prefix and its warmer record, as a round would
 * .why = liveness is the warmer's beat on its watermark, so the fixture is a record,
 *        never a live process
 */
const setOneWarmerRecord = async (input: {
  cwd: string;
  reviewer: string;
  pid: number | null;
  wakeInMinutes: number;
}): Promise<void> => {
  const now = new Date();
  const record: ReviewWarmerRecord = {
    plan: { pokes: 3, everyMinutes: 15 },
    pid: input.pid,
    spawnedAt: now.toISOString(),
    wakeBy: getOneInstantAfter({
      since: now,
      minutes: input.wakeInMinutes,
    }).toISOString(),
    pokedAt: null,
    endedAt: null,
  };
  await setReviewWarmerLane({
    cwd: input.cwd,
    reviewer: input.reviewer,
    lane: PREFIX,
  });
  await setReviewWarmerRecord({
    cwd: input.cwd,
    reviewer: input.reviewer,
    prefix: PREFIX,
    transit: () => ({ next: record, result: undefined }),
  });
};

describe('emitReviewWarmersAwake', () => {
  given(
    '[case1] a tree with two lanes awake and one whose warmer lapsed',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'warmers-awake-two' });
        await setOneWarmerRecord({
          cwd,
          reviewer: 'repo-rules',
          pid: 4242,
          wakeInMinutes: 15,
        });
        await setOneWarmerRecord({
          cwd,
          reviewer: 'mech-failhides',
          pid: null,
          wakeInMinutes: 15,
        });
        await setOneWarmerRecord({
          cwd,
          reviewer: 'arch-defects',
          pid: 7,
          wakeInMinutes: -60,
        });
        // a lane named by many runs is read once
        return {
          cwd,
          stderr: await getOneEmitStderr({
            cwd,
            reviewers: [
              'repo-rules',
              'repo-rules',
              'mech-failhides',
              'arch-defects',
            ],
          }),
        };
      });

      when('[t0] the tree report closes', () => {
        then('🔴 it names each lane still awake, once', () => {
          expect(scene.stderr).toContain('2 warmers still awake in this tree');
          expect(scene.stderr.split('repo-rules').length - 1).toEqual(1);
          expect(scene.stderr).toContain('mech-failhides');
        });

        then('🔴 a known pid gets its kill', () => {
          expect(scene.stderr).toContain('stop: kill 4242');
        });

        then('🔴 an unknown pid gets no kill, never `kill 0`', () => {
          expect(scene.stderr).not.toContain('kill 0');
          expect(scene.stderr).toContain('stop: pid not yet recorded');
        });

        then('the lanes sort by reviewer', () => {
          expect(scene.stderr.indexOf('├─ mech-failhides')).toBeLessThan(
            scene.stderr.indexOf('├─ repo-rules'),
          );
        });

        then(
          '🔴 the kill is caveated — a pid read from a record may be stale',
          () => {
            // the pid is never probed (a recycled pid fools a probe), so a crashed
            // warmer reads awake until its wake lapses; the driver must confirm first
            expect(scene.stderr).toContain(
              "└─ each pid is read from its warmer's record",
            );
            expect(scene.stderr).toContain(
              'confirm with `ps -p <pid>` before you kill',
            );
          },
        );

        then('a lapsed warmer is no spender, so it is not named', () => {
          expect(scene.stderr).not.toContain('arch-defects');
          expect(scene.stderr).not.toContain('kill 7');
        });

        then('the rendered block matches the snapshot', () => {
          expect(scene.stderr.split(scene.cwd).join('$CWD')).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] a tree whose lanes hold no live warmer', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmers-awake-none' });
      return {
        stderr: await getOneEmitStderr({ cwd, reviewers: ['repo-rules'] }),
      };
    });

    when('[t0] the tree report closes', () => {
      then('it is silent', () => {
        expect(scene.stderr).toEqual('');
      });
    });
  });
});
