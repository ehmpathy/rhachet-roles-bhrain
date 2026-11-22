import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { emitReviewWarmerDisowned } from './emitReviewWarmerDisowned';
import { getOneInstantAfter } from './getOneInstantAfter';
import type {
  ReviewWarmerPrefix,
  ReviewWarmerRecord,
} from './ReviewWarmerRecord';
import { setReviewWarmerLane } from './setReviewWarmerLane';
import { setReviewWarmerRecord } from './setReviewWarmerRecord';
import { CLOCK_OF_WALL, type WarmerClock } from './WarmerClock';

const REVIEWER = 'repo-rules';
const PREFIX: ReviewWarmerPrefix = {
  head: 'head-of-test',
  brain: 'test/brain',
};
const PID_OF_WARMER = 4242;

/**
 * .what = captures what the emit printed, and restores the console after
 * .why = the emit's whole contract is its rendered text — the only voice a
 *        detached spender has on the round that disowns it.
 *
 * .note = it captures `console.error`, since `rhx review`'s stdout is parsed by
 *         the route guard for a numeric verdict (contract.reviewer-output), so a
 *         warmer aside belongs on the stream no parser reads. `console.log` stays
 *         unpatched, so a line that regressed back onto stdout is invisible here
 *         and the silence cases below go red rather than green.
 */
const getOneEmitStderr = async (input: {
  cwd: string;
  clock?: WarmerClock;
}): Promise<string> => {
  const lines: string[] = [];
  const errBefore = console.error;
  console.error = (...args: unknown[]): void => {
    lines.push(args.map(String).join(' '));
  };
  try {
    await emitReviewWarmerDisowned(
      { cwd: input.cwd, reviewer: REVIEWER },
      { clock: input.clock ?? CLOCK_OF_WALL },
    );
  } finally {
    console.error = errBefore;
  }
  return lines.join('\n');
};

/**
 * .what = seeds this lane's prefix and one warmer record of it, as a round would
 * .why = liveness is the warmer's beat on its watermark, so the fixture is a record,
 *        never a live process
 */
const setOneWarmerRecord = async (input: {
  cwd: string;
  record: ReviewWarmerRecord;
}): Promise<void> => {
  await setReviewWarmerLane({
    cwd: input.cwd,
    reviewer: REVIEWER,
    lane: PREFIX,
  });
  await setReviewWarmerRecord({
    cwd: input.cwd,
    reviewer: REVIEWER,
    prefix: PREFIX,
    transit: () => ({ next: input.record, result: undefined }),
  });
};

/**
 * .what = a record as a warmer beats it, with a wake promised relative to now
 */
const asWarmerRecord = (input: {
  wakeInMinutes: number;
  endedAt: string | null;
}): ReviewWarmerRecord => {
  const now = new Date();
  return {
    plan: { pokes: 3, everyMinutes: 15 },
    pid: PID_OF_WARMER,
    spawnedAt: now.toISOString(),
    wakeBy: getOneInstantAfter({
      since: now,
      minutes: input.wakeInMinutes,
    }).toISOString(),
    pokedAt: null,
    endedAt: input.endedAt,
  };
};

describe('emitReviewWarmerDisowned', () => {
  given('[case1] a warmer from an earlier round that still beats', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-disowned-alive' });
      await setOneWarmerRecord({
        cwd,
        record: asWarmerRecord({ wakeInMinutes: 15, endedAt: null }),
      });
      return { stderr: await getOneEmitStderr({ cwd }) };
    });

    when('[t0] the driver passed --warmer off', () => {
      then('🔴 it SPEAKS — the spender is named, never left silent', () => {
        // the defect this clamps: `--warmer off` skipped the spawn AND the word,
        // so a driver took the one documented lever and the bill rolled on with
        // no cue at all (rule.forbid.failhide)
        expect(scene.stderr).toContain('warmer: off');
        expect(scene.stderr).toContain('STILL awake');
      });

      then('🔴 it names the KILL, so the driver can actually stop it', () => {
        // a warn with no fix strands them: the pid was printed rounds ago and
        // scrolled away (rule.require.errors-name-the-fix)
        expect(scene.stderr).toContain(`kill ${PID_OF_WARMER}`);
        expect(scene.stderr).toContain(`pid: ${PID_OF_WARMER}`);
      });

      then('it states WHY the flag did not stop it', () => {
        expect(scene.stderr).toContain(
          '--warmer off stops the next spawn, never a live warmer',
        );
      });

      then('it names the lane, so a multi-lane route is legible', () => {
        expect(scene.stderr).toContain(`reviewer: ${REVIEWER}`);
      });
    });

    when('[t1] a reviewer reads the rendered block', () => {
      then('it renders the tree a driver can act on', () => {
        // the pid is normalized to `<pid>`, so the snapshot reads the same shape
        // the driver sees whatever pid the os handed the warmer
        const normalized = scene.stderr
          .split(String(PID_OF_WARMER))
          .join('<pid>');
        expect(normalized).toContain(
          '🟡 warn: warmer: off — and a warmer from an earlier round is STILL awake',
        );
        // the review succeeded and the flag took — an error class here reads as a
        // refusal where the run went on (rule.require.qualified-error-headers)
        expect(normalized).not.toContain('ConstraintError');
        expect(normalized).toContain('└─ stop: kill <pid>');
        // the driver just passed `--warmer off`; to offer it again reads as
        // though the flag did not take
        expect(normalized).not.toContain('never spawn');
        expect(normalized).toMatchSnapshot();
      });
    });
  });

  given('[case2] a warmer whose promised wake long since lapsed', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-disowned-lapsed' });
      // a crashed warmer stops to beat: its last promise sits an hour in the past
      await setOneWarmerRecord({
        cwd,
        record: asWarmerRecord({ wakeInMinutes: -60, endedAt: null }),
      });
      return { stderr: await getOneEmitStderr({ cwd }) };
    });

    when('[t0] the driver passed --warmer off', () => {
      then('🔴 it is SILENT — a dead warmer must never cry wolf', () => {
        // to speak here would hand the driver a kill for a process that exited,
        // and teach them the line means naught
        expect(scene.stderr).toEqual('');
      });
    });
  });

  given('[case3] a lane that never had a warmer at all', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-disowned-absent' });
      return { stderr: await getOneEmitStderr({ cwd }) };
    });

    when('[t0] the driver passed --warmer off', () => {
      then('it is silent — `off` asked for quiet, and got it', () => {
        // a line on EVERY off round is a line a driver learns to skip, which
        // leaves it unread on the one round it fires for real
        expect(scene.stderr).toEqual('');
      });
    });
  });

  given('[case4] a warmer that stamped its own end', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-disowned-ended' });
      // its wake is still ahead, so only the end stamp can mark it gone
      await setOneWarmerRecord({
        cwd,
        record: asWarmerRecord({
          wakeInMinutes: 15,
          endedAt: new Date().toISOString(),
        }),
      });
      return { stderr: await getOneEmitStderr({ cwd }) };
    });

    when('[t0] the driver passed --warmer off', () => {
      then('🔴 it is SILENT — a warmer that ended is no spender', () => {
        expect(scene.stderr).toEqual('');
      });
    });
  });

  given(
    '[case5] a warmer alive by the wall, read through a clock two hours ahead',
    () => {
      const scene = useBeforeAll(async () => {
        const cwd = genTempDir({ slug: 'warmer-disowned-clock' });
        await setOneWarmerRecord({
          cwd,
          record: asWarmerRecord({ wakeInMinutes: 15, endedAt: null }),
        });
        const clockAhead: WarmerClock = {
          now: () => getOneInstantAfter({ since: new Date(), minutes: 120 }),
          sleep: async () => {},
        };
        return { stderr: await getOneEmitStderr({ cwd, clock: clockAhead }) };
      });

      when('[t0] the driver passed --warmer off', () => {
        then(
          '🔴 the liveness check reads the injected clock, never the wall',
          () => {
            // by the wall this warmer beats, so a wall read would speak; the injected
            // clock puts its promised wake far behind, so it reads dead and stays silent
            expect(scene.stderr).toEqual('');
          },
        );
      });
    },
  );
});
