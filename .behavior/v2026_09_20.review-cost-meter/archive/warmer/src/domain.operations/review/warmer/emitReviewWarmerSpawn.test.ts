import { given, then, useBeforeAll, when } from 'test-fns';

import { asReviewWarmerRecordPath } from './asReviewWarmerRecordPath';
import { emitReviewWarmerSpawn } from './emitReviewWarmerSpawn';
import {
  MINUTES_OF_WARMER_BOOT,
  type ReviewWarmerSpawn,
} from './genReviewWarmer';
import type { ReviewWarmerPrefix } from './ReviewWarmerRecord';

/**
 * .what = the prefix every warmer in this suite keeps warm
 * .why = it keys the record a not-yet-printed pid is read from
 */
const PREFIX_OF_TEST: ReviewWarmerPrefix = {
  head: 'head-of-test',
  brain: 'test/brain',
};

/**
 * .what = runs the emitter and hands back exactly what it printed to STDERR
 * .why = the rendered text is the contract here — the one moment a driver can
 *        learn a detached spender exists. an assertion on a return value would
 *        prove naught, since the operation returns void by design.
 *
 * .note = it captures `console.error`, since `rhx review`'s stdout is parsed by
 *         the route guard for a numeric verdict (contract.reviewer-output), so a
 *         warmer aside belongs on the stream no parser reads. `console.log` is
 *         left unpatched deliberately, so the helper cannot capture a line that
 *         regressed back onto stdout — a spy over both streams would join them
 *         into one string and hide the regression.
 */
const getOneStderr = (input: {
  reviewer: string;
  spawn: ReviewWarmerSpawn;
}): string => {
  const lines: string[] = [];
  const errBefore = console.error;
  console.error = (...args: unknown[]) => void lines.push(args.join(' '));
  try {
    emitReviewWarmerSpawn(input);
  } finally {
    console.error = errBefore;
  }
  return lines.join('\n');
};

describe('emitReviewWarmerSpawn', () => {
  given('[case1] a warmer that spawned', () => {
    const stdout = useBeforeAll(async () => ({
      text: getOneStderr({
        reviewer: 'repo-rules',
        spawn: {
          act: 'spawned',
          prefix: PREFIX_OF_TEST,
          pid: 4242,
          why: '3 pokes, 15m apart',
        },
      }),
    }));

    when('[t0] a driver reads the review`s stdout', () => {
      then('it renders the tree a reader can act on', () => {
        expect(stdout.text).toContain('🦉 warmer: awake — 3 pokes, 15m apart');
        expect(stdout.text).toContain('├─ reviewer: repo-rules');
        expect(stdout.text).toMatchSnapshot();
      });

      then('🔴 it names the PID — the only handle to stop the spender', () => {
        // a warmer a driver cannot stop is a spender they can only escape by
        // uninstall of the tool
        expect(stdout.text).toContain('pid: 4242');
      });

      then('and the plan, so the bound is stated before it is spent', () => {
        expect(stdout.text).toContain('3 pokes, 15m apart');
      });

      then('🔴 and BOTH next moves — stop this one, or never spawn one', () => {
        // a driver did not ask for this process by name, so this surface is the
        // only place to learn how to end it. a pid alone answers "which
        // process"; it does not answer "and what do I type"
        expect(stdout.text).toContain('kill 4242');
        expect(stdout.text).toContain('never spawn: drop --warmer');
      });
    });
  });

  given('[case2] a warmer that was already awake', () => {
    const stdout = useBeforeAll(async () => ({
      text: getOneStderr({
        reviewer: 'repo-rules',
        spawn: {
          act: 'found',
          prefix: PREFIX_OF_TEST,
          pid: 4242,
          why: 'a live warmer already covers this reviewer',
          live: { pokes: 3, everyMinutes: 15 },
          asked: { pokes: 3, everyMinutes: 15 },
        },
      }),
    }));

    when('[t0] a driver reads the review`s stdout', () => {
      then('it renders distinctly from a fresh spawn', () => {
        expect(stdout.text).toContain(
          '🦉 warmer: already awake — repo-rules, 3 pokes, 15m apart',
        );
        expect(stdout.text).not.toContain('warmer: awake');
        expect(stdout.text).toMatchSnapshot();
      });

      then('🔴 it reads `already awake`, never `awake`', () => {
        // the whole reason a `found` prints at all: a silent `found` reads
        // exactly like a silent `spawned`, and only one means a new spender
        expect(stdout.text).toContain('already awake');
      });

      then('🔴 it STATES the bound it deferred to', () => {
        // `found` is the common case across a route (bar 14 — spawn is a
        // findsert), so a `found` with no bound leaves bar 11's "declared up
        // front" met on round 1 only
        expect(stdout.text).toContain('3 pokes, 15m apart');
      });

      then('and it does NOT cry divergence where the plans agree', () => {
        // a caveat a driver sees every round is one they learn to skip
        expect(stdout.text).not.toContain('NOT applied');
        expect(stdout.text).not.toContain('asked:');
      });

      then('🔴 and it COLLAPSES to one line — a no-op costs one line', () => {
        // the `found` where the asked plan was applied is the only branch that
        // asks naught of the driver — a warmer they were already told about is
        // still alive, on the plan they wanted. a seven-line tree on every round
        // of an eleven-lane guard trains a driver to skip the block that carries
        // the other two branches (rule.require.treestruct-output's minimalism,
        // nielsen 8).
        //
        // trimmed first: the render opens with a blank line to part it from the
        // review output above, and the claim is about lines of content
        expect(stdout.text.trim().split('\n')).toHaveLength(1);
      });

      then('and the one line still carries both facts a driver needs', () => {
        // the clamp on the collapse: a line count alone is satisfied by a
        // collapse that dropped the bound and the stop move, the failure the
        // seven-line tree exists to prevent (rule.require.clamp-edge-cases)
        expect(stdout.text).toContain('repo-rules');
        expect(stdout.text).toContain('kill 4242');
      });
    });
  });

  given('[case4] a live warmer whose plan differs from what was asked', () => {
    const stdout = useBeforeAll(async () => ({
      text: getOneStderr({
        reviewer: 'repo-rules',
        spawn: {
          act: 'found',
          prefix: PREFIX_OF_TEST,
          pid: 4242,
          why: 'a live warmer already covers this reviewer',
          live: { pokes: 3, everyMinutes: 15 },
          asked: { pokes: 10, everyMinutes: 5 },
        },
      }),
    }));

    when('[t0] a driver raised --warmer mid-route', () => {
      then('🔴 it names the plan that was DISCARDED', () => {
        // the findsert is correct (bar 14) and the silence is not: the driver
        // asked for 10x,5m, gets 3x,15m, and reads "already awake" — which
        // scans as confirmation their plan is live (rule.forbid.failhide)
        expect(stdout.text).toContain('asked: 10 pokes, 5m apart');
        expect(stdout.text).toContain('NOT applied');
      });

      then('it still states what IS live, so both are on the page', () => {
        expect(stdout.text).toContain('bound: 3 pokes, 15m apart');
      });

      then(
        '🔴 it names the fix — a re-plan needs the live one dead first',
        () => {
          expect(stdout.text).toContain('to re-plan: kill 4242');
        },
      );

      then('the whole tree matches the snapshot', () => {
        expect(stdout.text).toContain(
          '├─ asked: 10 pokes, 5m apart  🟡 NOT applied — a live warmer keeps its own plan',
        );
        expect(stdout.text).toContain('├─ to re-plan: kill 4242, then re-run');
        expect(stdout.text).toMatchSnapshot();
      });
    });
  });

  given('[case6] a live warmer that has not yet recorded its PID', () => {
    /**
     * .why = `0` is the one number that must never reach a driver: `kill 0`
     * signals the caller's entire process group, so a driver who copy-pastes the
     * one documented stop command would kill their own shell, editor, and guard
     * run — 0.wish bar 4's defect one layer down, an unknown rendered as a fact,
     * except the manufactured fact is an executable command.
     *
     * it is reachable in the ordinary boot window: a round writes the warmer's
     * record with no pid, and the child beats its own pid in moments later. a
     * second round inside that window finds the record live and pid-less.
     */
    const stdout = useBeforeAll(async () => ({
      text: getOneStderr({
        reviewer: 'repo-rules',
        spawn: {
          act: 'found',
          prefix: PREFIX_OF_TEST,
          pid: null,
          why: 'a live warmer already covers this reviewer',
          live: { pokes: 3, everyMinutes: 15 },
          asked: { pokes: 10, everyMinutes: 5 },
        },
      }),
    }));

    when('[t0] a driver reads the review`s stdout', () => {
      then('🔴 it offers NO kill command at all', () => {
        // the discriminator, and it is stated as a negative on purpose: a positive
        // assertion about the replacement text would still pass if a `kill 0` sat
        // one line below it
        expect(stdout.text).not.toContain('kill 0');
        expect(stdout.text).not.toMatch(/kill \d/);
      });

      then('🔴 and the pid row reads ABSENT, never `0`', () => {
        // a `pid: 0` row reads as a fact a driver may act on, and it is the one
        // number that must never be acted on
        expect(stdout.text).not.toContain('pid: 0');
        expect(stdout.text).toContain('not yet recorded');
      });

      then('and it still names a next move that WORKS', () => {
        // a refusal with no fix is half an error (rule.require.errors-name-the-fix).
        // `--warmer off` needs no pid, so it is reachable in exactly this case
        expect(stdout.text).toContain('never spawn: drop --warmer');
      });

      then(
        '🔴 it names the record the pid lands in — no paid review re-run to learn it',
        () => {
          expect(stdout.text).toContain(
            `once the warmer boots (≤${MINUTES_OF_WARMER_BOOT}m), read \`pid\` from ${asReviewWarmerRecordPath({ reviewer: 'repo-rules', prefix: PREFIX_OF_TEST })}, then kill it`,
          );
          expect(stdout.text).not.toContain('to print it');
        },
      );

      then('🔴 and the re-plan line drops its kill too', () => {
        // this line is the more dangerous of the two to get wrong: it reads as a
        // routine re-plan rather than a teardown, so a driver runs it with less care
        expect(stdout.text).toContain('to re-plan: stop the live warmer');
        expect(stdout.text).not.toContain('to re-plan: kill');
      });

      then('it renders the whole tree a reader can act on', () => {
        expect(stdout.text).toContain('├─ pid: — (not yet recorded)');
        expect(stdout.text).toContain(
          'pid not yet recorded — once the warmer boots',
        );
        expect(stdout.text).toMatchSnapshot();
      });
    });
  });

  given('[case3] a warmer that refused to spend', () => {
    const stdout = useBeforeAll(async () => ({
      text: getOneStderr({
        reviewer: 'repo-rules',
        spawn: {
          act: 'refused',
          malfunction: true,
          why: 'no prompt head at .log/x/input.prompt.head.md — a warmer cannot replay a prompt it cannot read; the review ran unwarmed — re-run to retry, or inspect .log/x',
        },
      }),
    }));

    when('[t0] a driver reads the review`s stdout', () => {
      then('it says so plainly, with the reason', () => {
        expect(stdout.text).toContain(
          'no prompt head at .log/x/input.prompt.head.md',
        );
        expect(stdout.text).toContain('the review ran unwarmed');
        expect(stdout.text).toMatchSnapshot();
      });

      then(
        '🔴 a fault opens under its class, so a driver knows who must act',
        () => {
          expect(stdout.text).toContain('💥 MalfunctionError: warmer: none');
        },
      );

      then('a fault opens under the owl frame, as the warn branch does', () => {
        expect(stdout.text).toContain('🦉 woah there');
      });

      then('🔴 it is not silent — a refusal is the loudest outcome', () => {
        // to a cost-conscious driver, "the warmer did NOT spend" is the most
        // valuable line on the surface. a silent refusal reads as a spawn
        expect(stdout.text).toContain('warmer: none');
      });

      then('and it carries no pid, because no process exists', () => {
        expect(stdout.text).not.toContain('pid:');
      });
    });
  });

  given('[case7] a warmer this run cannot serve — no fault, no spend', () => {
    const stdout = useBeforeAll(async () => ({
      text: getOneStderr({
        reviewer: '(none)',
        spawn: {
          act: 'refused',
          malfunction: false,
          why: 'this run carries no lane identity, so there is no prefix to key a warmer on; the review ran unwarmed and its verdict stands — drop --warmer, since a hand run has no lane to warm',
        },
      }),
    }));

    when('[t0] a driver reads the review`s stdout', () => {
      then('it opens under the warn frame, never an error class', () => {
        // the run went on and its verdict stands, so no class that means halted
        // may head it (rule.require.qualified-error-headers)
        expect(stdout.text).toContain(
          '🟡 warn: warmer: none — this run carries no lane identity',
        );
        expect(stdout.text).not.toContain('ConstraintError');
        expect(stdout.text).not.toContain('MalfunctionError');
      });

      then('the whole tree matches the snapshot', () => {
        expect(stdout.text).toContain(
          'so there is no prefix to key a warmer on',
        );
        expect(stdout.text).not.toContain('pid:');
        expect(stdout.text).toMatchSnapshot();
      });
    });
  });
});
