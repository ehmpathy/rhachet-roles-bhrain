import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';
import { pathToFileURL } from 'url';

import { DEFAULT_TEST_BRAIN_VIA_CLI } from '@src/.test/genTestBrainContext';
import { getOneReviewWarmerRecord } from '@src/domain.operations/review/warmer/getOneReviewWarmerRecord';

/**
 * .what = acceptance tests for the refusal `review._.warmer` emits when its spawn
 *         hands it an incomplete flag set
 * .why = this entrypoint is reached by NO DRIVER. `rhx review` spawns it detached,
 *        with `stdio: 'ignore'` — so on a malformed spawn there is no terminal, no
 *        row, and no exception anybody sees. the refusal text IS the entire
 *        diagnosis, and it is read later, out of a log, by someone who never typed
 *        the command it describes.
 *
 *        ⇒ that is what makes the refusal's SHAPE load-bearing here rather than
 *        cosmetic. it must name which flags were absent (a reader cannot diff an
 *        argv they did not write), show the usage (there is no `--help` on a
 *        spawned child), and say who the caller is (a fix aimed at the human would
 *        send them to edit a command line that does not exist).
 *
 * .note = it exits 1, a MALFUNCTION. the caller is our own `rhx review`, so an
 *         incomplete spawn is a defect in that spawn's code — no input a human
 *         retypes can clear it (`rule.require.exit-code-semantics`), and the header
 *         names `💥 MalfunctionError` to match (`rule.require.qualified-error-headers`).
 *
 * .note = these cases cost ZERO brain: the flag check sits ahead of
 *         `genContextBrain`, so a refusal needs no credential and cannot spend.
 *         the env strip below is what proves it rather than assumes it.
 *
 * .how = imports by absolute path (rule.require.blackbox-via-selflink), so the
 *        spawn cwd is free to be a fixture root rather than this repo.
 */
const CLI_MODULE_URL = pathToFileURL(
  require.resolve('rhachet-roles-bhrain/cli/review._.warmer'),
).href;
const CLI_COMMAND = `import(${JSON.stringify(
  CLI_MODULE_URL,
)}).then(m => m.reviewWarmer())`;

const runWarmerCli = (input: {
  cwd: string;
  args: string[];
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync('node', ['-e', CLI_COMMAND, '--', ...input.args], {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    // stripped, so a refusal cannot accidentally pass by reaching a provider.
    // a warmer that got as far as a brain call would spend real money on a
    // cadence nobody asked for — the one outcome these cases exist to forbid.
    // OPENROUTER is the default brain's provider. the strip covers env-held keys
    // only; the real guarantee is that the flag check sits ahead of the brain
    env: {
      ...process.env,
      ANTHROPIC_API_KEY: '',
      OPENAI_API_KEY: '',
      OPENROUTER_API_KEY: '',
    },
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
};

describe('reviewWarmerSpawnRefusal.acceptance', () => {
  given('[case1] a spawn that hands it NO flags at all', () => {
    const ran = useBeforeAll(async () =>
      runWarmerCli({
        cwd: genTempDir({ slug: 'warmer-spawn-bare' }),
        args: [],
      }),
    );

    when('[t0] the child boots', () => {
      then('🔴 it exits 1 — a MALFUNCTION of our own spawn', () => {
        // the caller is `rhx review`, so the defect is in our code, never in an
        // input a human could retype
        expect(ran.exitCode).toEqual(1);
      });

      then(
        '🔴 and its header names the malfunction class, glyph to match',
        () => {
          expect(ran.stderr).toContain('💥 MalfunctionError: review._.warmer');
          expect(ran.stderr).not.toContain('ConstraintError');
        },
      );

      then('and it counts the absent flags, so the gap has a size', () => {
        expect(ran.stderr).toContain('5 flags it cannot use');
        expect(ran.stderr).toContain('absent: --reviewer');
      });

      then('🔴 and it NAMES every absent flag', () => {
        // the whole set is absent here, so this case cannot tell "names the
        // absent ones" from "names all five" — `[case2]` is what parts them.
        // what it DOES prove is that each flag appears at all
        expect(ran.stderr).toContain('--reviewer');
        expect(ran.stderr).toContain('--log-dir');
        expect(ran.stderr).toContain('--pokes');
        expect(ran.stderr).toContain('--every');
        expect(ran.stderr).toContain('--brain');
      });

      then(
        'and it shows the usage, since a spawned child has no --help',
        () => {
          expect(ran.stderr).toContain('usage');
          expect(ran.stderr).toContain('review._.warmer --reviewer <slug>');
        },
      );

      then(
        '🔴 and it says who the CALLER is, so the fix is aimed right',
        () => {
          // a fix aimed at the human would send them to edit a command line that
          // does not exist. the defect is in `rhx review`'s spawn
          expect(ran.stderr).toContain('no driver types this');
        },
      );

      then('🔴 it spent NAUGHT — no brain was reached', () => {
        // the flag check sits ahead of `genContextBrain`, and the env strip
        // above means a call that DID reach a provider would fail loud
        expect(ran.stderr).not.toContain('keyrack');
        expect(ran.stdout).toEqual('');
      });

      then('the refusal renders whole, diffable in the PR', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  /**
   * .why = the case that makes `[case1]`'s third `then` mean something. with
   *           every flag absent, "names the absent flags" and "names all five" are
   *           indistinguishable — which is exactly the defect this repair fixed, so
   *           a suite that could not tell them apart would pass over it unchanged.
   */
  given('[case2] a spawn that hands it all but ONE flag', () => {
    const ran = useBeforeAll(async () =>
      runWarmerCli({
        cwd: genTempDir({ slug: 'warmer-spawn-partial' }),
        args: [
          '--reviewer',
          'repo-rules',
          '--log-dir',
          '.log/bhrain/review/fixture',
          '--pokes',
          '3',
          '--every',
          '15',
          // `--brain` withheld. it has no default on purpose: a poke to a brain
          // the review did not use warms a different provider's replica, so a
          // defaulted brain would spend and report a hit while the next round
          // still met a cold one
        ],
      }),
    );

    when('[t0] the child boots', () => {
      then('it exits 1', () => {
        expect(ran.exitCode).toEqual(1);
      });

      then(
        '🔴 it names the ONE absent flag, and says "flag" not "flags"',
        () => {
          // the singular is asserted rather than left to the snapshot: a
          // `flag(s)` template reads as unfinished on the one surface whose whole
          // job is to read cleanly to someone who did not write the command
          expect(ran.stderr).toContain('1 flag it cannot use');
          expect(ran.stderr).toContain('absent: --brain');
        },
      );

      then('🔴 and it does NOT name the four that were supplied', () => {
        // the sharp half, and the assertion the old message could not pass: it
        // listed all five regardless, so a reader had to diff an argv they never
        // typed to find which one was missed
        const absentLine =
          ran.stderr.split('\n').find((line) => line.includes('absent:')) ?? '';
        expect(absentLine).not.toContain('--reviewer');
        expect(absentLine).not.toContain('--log-dir');
        expect(absentLine).not.toContain('--pokes');
        expect(absentLine).not.toContain('--every');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  /**
   * .why = a malformed count must never reach the cadence loop. `Number('abc')`
   *           is `NaN`, and a `NaN` bound in a detached child with no terminal
   *           would spin or stall in silence — so the refusal must catch it
   */
  given('[case3] a spawn whose --pokes is not a number', () => {
    const ran = useBeforeAll(async () =>
      runWarmerCli({
        cwd: genTempDir({ slug: 'warmer-spawn-nan' }),
        args: [
          '--reviewer',
          'repo-rules',
          '--log-dir',
          '.log/bhrain/review/fixture',
          '--pokes',
          'abc',
          '--every',
          '15',
          '--brain',
          DEFAULT_TEST_BRAIN_VIA_CLI,
        ],
      }),
    );

    when('[t0] the child boots', () => {
      then('🔴 it refuses before any cadence, with exit 1', () => {
        expect(ran.exitCode).toEqual(1);
      });

      then('and it names --pokes as the flag it could not use', () => {
        expect(ran.stderr).toContain('not a positive number: --pokes');
      });

      then('🔴 and it never calls a flag the spawn passed absent', () => {
        // `--pokes abc` WAS supplied. to name it absent would send the reader after
        // a flag the spawn already passed, rather than the value it passed wrong
        expect(ran.stderr).not.toContain('absent:');
      });

      then(
        '🔴 and its fix fits a malformed flag, not only an absent one',
        () => {
          // the fix line once read "a flag absent here is a defect in that spawn",
          // which misnamed the cause beside its own `not a positive number:` row
          expect(ran.stderr).not.toContain('a flag absent');
          expect(ran.stderr).toContain('a flag this');
          expect(ran.stderr).toContain(
            'spawn could not use is a defect in that spawn',
          );
        },
      );

      then('🔴 it spent NAUGHT — no brain was reached', () => {
        expect(ran.stderr).not.toContain('keyrack');
        expect(ran.stdout).toEqual('');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  /**
   * .why = `--every` is the second numeric flag, and it reaches the refusal through
   *        its own parse. a clamp on `--pokes` alone would let the two diverge, so
   *        each numeric flag is clamped on its own
   */
  given('[case4] a spawn whose --every is not a number', () => {
    const ran = useBeforeAll(async () =>
      runWarmerCli({
        cwd: genTempDir({ slug: 'warmer-spawn-nan-every' }),
        args: [
          '--reviewer',
          'repo-rules',
          '--log-dir',
          '.log/bhrain/review/fixture',
          '--pokes',
          '3',
          '--every',
          'abc',
          '--brain',
          DEFAULT_TEST_BRAIN_VIA_CLI,
        ],
      }),
    );

    when('[t0] the child boots', () => {
      then('🔴 it refuses before any cadence, with exit 1', () => {
        expect(ran.exitCode).toEqual(1);
      });

      then('and it names --every as the flag it could not use', () => {
        expect(ran.stderr).toContain('not a positive number: --every');
        expect(ran.stderr).not.toContain('not a positive number: --pokes');
      });

      then('🔴 it spent NAUGHT — no brain was reached', () => {
        expect(ran.stderr).not.toContain('keyrack');
        expect(ran.stdout).toEqual('');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  /**
   * .why = a child's first act is to beat its own pid into its prefix's watermark.
   *        where that write is refused, the child must die by its own named refusal,
   *        before any brain is reached. a plain file sits where the watermark dir must
   *        go, so the write is refused for real, with no mock
   */
  given('[case5] a lane whose watermark write is refused', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-spawn-watermark-refused' });
      const watermarks = path.join(
        cwd,
        '.agent/.cache/repo=bhrain/role=reviewer/skill=review/watermarks',
      );
      fs.mkdirSync(path.dirname(watermarks), { recursive: true });
      fs.writeFileSync(watermarks, 'not a dir\n');
      const ran = runWarmerCli({
        cwd,
        args: [
          '--reviewer',
          'repo-rules',
          '--log-dir',
          '.log/bhrain/review/fixture',
          '--pokes',
          '3',
          '--every',
          '15',
          '--brain',
          DEFAULT_TEST_BRAIN_VIA_CLI,
        ],
      });
      const ledgerPath = path.join(
        cwd,
        '.log/bhrain/review/fixture',
        'warmer.pokes.jsonl',
      );
      const ledger = fs.existsSync(ledgerPath)
        ? fs.readFileSync(ledgerPath, 'utf-8')
        : '';
      return { cwd, ran, ledger };
    });

    when('[t0] the child boots and tries to record its lane', () => {
      then('🔴 it exits 1 by its own refusal, never by a signal', () => {
        expect(scene.ran.exitCode).toEqual(1);
      });

      then('🔴 and it NAMES why it died unspent', () => {
        expect(scene.ran.stderr).toContain(
          '💥 MalfunctionError: review._.warmer could not record its lane',
        );
        expect(scene.ran.stderr).toContain('reviewer: repo-rules');
      });

      then('🔴 it spent NAUGHT — no brain was reached', () => {
        expect(scene.ran.stderr).not.toContain('keyrack');
      });

      then(
        '🔴 and its ledger holds ONE retire row that names the cause — detached, stderr is lost, so the ledger is the only trace a driver can read',
        () => {
          const rows = scene.ledger.trim().split('\n').filter(Boolean);
          expect(rows).toHaveLength(1);
          const row = JSON.parse(rows[0] ?? '{}');
          expect(row.act).toEqual('retire');
          expect(row.attempt).toEqual(0);
          expect(row.measured).toEqual(null);
          expect(row.why).toContain(
            'the warmer could not record its lane, so it cost naught',
          );
        },
      );

      then('the refusal renders whole, temp path masked', () => {
        // the temp root and the child's pid in the temp plan name vary per run
        expect(
          scene.ran.stderr
            .replace(/'[^']*(\/\.agent\/)/g, "'<cwd>$1")
            .replace(/\.\d+\.tmp'/g, ".<pid>.tmp'"),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case6] a spawn that hands all five flags AND one stray', () => {
    // the clamp for i015 r024 nitpick.3: the parser once skipped any flag outside
    // the five, so a stray rode beside a correct set, accepted and inert
    const ran = useBeforeAll(async () =>
      runWarmerCli({
        cwd: genTempDir({ slug: 'warmer-spawn-stray' }),
        args: [
          '--reviewer',
          'repo-rules',
          '--log-dir',
          '.log/bhrain/review/fixture',
          '--pokes',
          '3',
          '--every',
          '15',
          '--brain',
          DEFAULT_TEST_BRAIN_VIA_CLI,
          '--pokez',
          '9',
        ],
      }),
    );

    when('[t0] the child boots', () => {
      then('🔴 it exits 1 rather than skip the stray', () => {
        expect(ran.exitCode).toEqual(1);
      });

      then('🔴 and it names the stray flag, and no supplied one', () => {
        expect(ran.stderr).toContain('1 flag it cannot use');
        expect(ran.stderr).toContain('not a warmer flag: --pokez');
        expect(ran.stderr).not.toContain('absent:');
      });

      then('it spent NAUGHT — no brain was reached', () => {
        expect(ran.stderr).not.toContain('keyrack');
        expect(ran.stdout).toEqual('');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  /**
   * .why = the boot fault that sits past the flag check: a slug that no brains package
   *        registers, so `genContextBrain` throws a lookup fault. detached, stderr is
   *        lost — so the ledger row is the whole record, and it must be written for
   *        EVERY boot fault, then terminate the plan. a lone `fault` row would read as a
   *        warmer "still AWAKE" whose $0 is only a floor; a boot that never began has
   *        spent naught and is over.
   *
   *        the lookup fails before any provider call, so the case spends naught
   *
   * .note = a MALFUNCTION, exit 1 — the same class as every other boot refusal on
   *         this child. the brain choice arrives from the parent `rhx review`, which
   *         already booted it, so no input a human retypes can clear it here
   */
  given('[case8] a lane whose brain cannot boot', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'warmer-spawn-boot-fault' });
      const logDir = '.log/bhrain/review/fixture';
      const ran = runWarmerCli({
        cwd,
        args: [
          '--reviewer',
          'repo-rules',
          '--log-dir',
          logDir,
          '--pokes',
          '3',
          '--every',
          '15',
          '--brain',
          'nowhere/glm/flash/v0',
        ],
      });
      const ledgerPath = path.join(cwd, logDir, 'warmer.pokes.jsonl');
      const ledger = fs.existsSync(ledgerPath)
        ? fs.readFileSync(ledgerPath, 'utf-8')
        : '';
      // the record the child beat at boot, read back after it exited
      const record = await getOneReviewWarmerRecord({
        cwd,
        reviewer: 'repo-rules',
        prefix: { head: null, brain: 'nowhere/glm/flash/v0' },
      });
      return { ran, ledger, endedAt: record?.endedAt ?? null };
    });

    when('[t0] the child boots and its brain lookup fails', () => {
      then('🔴 it exits 1 — the boot fault still fails loud', () => {
        expect(scene.ran.exitCode).toEqual(1);
      });

      then('🔴 and the ledger holds exactly ONE row', () => {
        const rows = scene.ledger.trim().split('\n').filter(Boolean);
        expect(rows).toHaveLength(1);
      });

      then('🔴 and that row TERMINATES the plan, at attempt 0', () => {
        // `retire`, never a lone `fault`: the reader keys on a terminator, and a
        // fault alone would render the warmer as "still AWAKE" over a $0 floor
        const row = JSON.parse(scene.ledger.trim());
        expect(row.act).toEqual('retire');
        expect(row.attempt).toEqual(0);
        expect(row.measured).toEqual(null);
        expect(row.reviewer).toEqual('repo-rules');
      });

      then('🔴 its one echoed stdout row is the boot retire', () => {
        // the ledger row is echoed to stdout; it is the only output, and bills naught
        const rows = scene.ran.stdout.trim().split('\n').filter(Boolean);
        expect(rows).toHaveLength(1);
        const row = JSON.parse(rows[0] ?? '{}');
        expect(row.act).toEqual('retire');
        expect(row.measured).toEqual(null);
      });

      then('🔴 and the row names the boot as its cause', () => {
        const row = JSON.parse(scene.ledger.trim());
        expect(row.why).toContain(
          'the warmer could not boot its brain, so it cost naught',
        );
      });

      then('🔴 and the record it beat is stamped ended', () => {
        // `finally` still runs on a boot fault, so the next round reads it gone
        // and may spawn afresh
        expect(scene.endedAt).not.toEqual(null);
      });

      then('🔴 it exits 1 under a named refusal, never a raw stack', () => {
        expect(scene.ran.exitCode).toEqual(1);
        expect(scene.ran.stderr).toContain(
          '💥 MalfunctionError: review._.warmer could not boot its brain',
        );
        expect(scene.ran.stderr).toContain(
          "brain 'nowhere/glm/flash/v0' is not registered",
        );
        expect(scene.ran.stderr).not.toContain('    at ');
      });

      then('the refusal renders whole, temp path masked', () => {
        expect(
          scene.ran.stderr.replace(/'[^']*(\/\.agent\/)/g, "'<cwd>$1"),
        ).toMatchSnapshot();
      });
    });
  });
});
