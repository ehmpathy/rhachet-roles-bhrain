import { given, then, useThen, when } from 'test-fns';

import { setReviewWarmerOfRound } from './setReviewWarmerOfRound';

/**
 * .what = runs the round's warmer settle and captures what it said on stderr
 * .why = the warmer aside belongs on the stream no parser reads, so stderr is the
 *        observable. only a no-lane round is driven here: that branch spawns naught
 *        and touches no disk, so it stays a unit test
 */
const asStderrOfRound = async (
  input: Parameters<typeof setReviewWarmerOfRound>[0],
): Promise<{ stderr: string }> => {
  const lines: string[] = [];
  const errBefore = console.error;
  console.error = (...args: unknown[]) => void lines.push(args.join(' '));
  try {
    await setReviewWarmerOfRound(input);
  } finally {
    console.error = errBefore;
  }
  return { stderr: lines.join('\n') };
};

describe('setReviewWarmerOfRound', () => {
  given('[case1] a round with no lane identity', () => {
    when('[t0] the warmer was asked for (`--warmer on`)', () => {
      const round = useThen('the round settles', async () =>
        asStderrOfRound({
          cwd: '/nonexistent',
          lane: null,
          plan: { pokes: 12, everyMinutes: 15 },
          logDir: '/nonexistent/log',
        }),
      );

      then('it refuses aloud, and names the absent lane as the reason', () => {
        // the discriminator the wrapper acceptance test cannot reach: under `on`, a
        // no-lane round must SAY it spawned naught. a silent round would read as a
        // round that kept its lane warm
        expect(round.stderr).toContain('warmer: none');
        expect(round.stderr).toContain('carries no lane identity');
      });

      then('the aside matches the snapshot', () => {
        // every input is fixed, so the whole aside is stable — rails, indent, and why
        // the run went on, so the notice wears no class that means halted
        expect(round.stderr).toContain('🟡 warn: warmer: none');
        expect(round.stderr).not.toContain('ConstraintError');
        expect(round.stderr).not.toContain('MalfunctionError');
        expect(round.stderr).toMatchSnapshot();
      });

      then('it announces no spawn', () => {
        expect(round.stderr).not.toContain('warmer: awake');
      });
    });

    when('[t1] the warmer was not asked for (`--warmer off`)', () => {
      const round = useThen('the round settles', async () =>
        asStderrOfRound({
          cwd: '/nonexistent',
          lane: null,
          plan: null,
          logDir: '/nonexistent/log',
        }),
      );

      then('it says naught — there was no request to refuse', () => {
        expect(round.stderr).toEqual('');
      });
    });
  });

  given('[case2] a round whose lane recorded no brain', () => {
    when('[t0] the warmer was asked for (`--warmer on`)', () => {
      const round = useThen('the round settles', async () =>
        asStderrOfRound({
          cwd: '/nonexistent',
          lane: {
            root: '/nonexistent/.log/bhrain/review',
            slug: 'repo-rules',
            head: 'aaaa',
            brain: null,
          },
          plan: { pokes: 12, everyMinutes: 15 },
          logDir: '/nonexistent/log',
        }),
      );

      then('it refuses aloud, and names the absent brain as the reason', () => {
        // the warmer's brain comes from the lane alone; with none on record, a
        // poke would warm a guessed cache, so the round must say it spawned naught
        expect(round.stderr).toContain('recorded no brain');
      });

      then('the aside matches the snapshot', () => {
        expect(round.stderr).toContain(
          '🟡 warn: warmer: none — this run recorded no brain, so there is no cache to name for a warmer',
        );
        expect(round.stderr).toMatchSnapshot();
      });

      then('it announces no spawn', () => {
        expect(round.stderr).not.toContain('warmer: awake');
      });
    });
  });
});
