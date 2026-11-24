import { spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';
import { pathToFileURL } from 'url';

/**
 * .what = acceptance tests for the `--warmer` flag's REFUSALS
 * .why = `0.wish` bar 13: a malformed value refuses, never falls back silently.
 *        the parse is clamped a layer down (`asReviewWarmerPlan.test.ts`,
 *        `review.parseReviewArgs.test.ts`); the refusal is an exit code and a
 *        message, which only a spawned cli can show.
 *
 * .why it matters = a caller who typed a warmer plan asked for a spend. a silent
 *     fallback to the default (`off`) drops that ask unseen, and `1x,90m` — one poke
 *     past the ttl, which refreshes no bytes and bills in full — must be named, not
 *     swallowed.
 *
 * .note = these cases cost zero brain. the plan is parsed before `genContextBrain`,
 *         so a refusal needs no credential and no spend; the last `then` of
 *         `[case1]` asserts it.
 *
 * .how = imports by absolute path (rule.require.blackbox-via-selflink), so the spawn
 *        cwd is free to be a fixture root rather than this repo.
 */
const CLI_MODULE_URL = pathToFileURL(
  require.resolve('rhachet-roles-bhrain/cli/review'),
).href;
const CLI_COMMAND = `import(${JSON.stringify(
  CLI_MODULE_URL,
)}).then(m => m.review())`;

const runCli = (input: {
  cwd: string;
  args: string[];
}): { stdout: string; stderr: string; exitCode: number } => {
  const result = spawnSync('node', ['-e', CLI_COMMAND, '--', ...input.args], {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
    // stripped, so a refusal cannot accidentally pass by reaching a provider.
    // OPENROUTER is the default brain's provider, so its key is the one that
    // matters most. the strip covers env-held keys only; the real guarantee is
    // that each refusal fires ahead of `genContextBrain`
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

/**
 * .what = a tree with a rules file, so `--rules` is satisfied
 * .why = the warmer parse sits AFTER the required-arg check, so a fixture with no
 *        rules would exit 2 on the wrong error and the case would pass for a reason
 *        it does not name
 */
const genTreeWithRules = (input: { slug: string }): string => {
  const cwd = genTempDir({ slug: input.slug });
  fs.writeFileSync(path.join(cwd, 'rules.md'), '# rules\n\nbe kind.\n');
  return cwd;
};

describe('reviewWarmerFlag.acceptance', () => {
  given('[case1] a cadence past the cache ttl', () => {
    /**
     * `1x,90m` is the shape the single-token grammar exists to make visible: one
     * poke, 90 minutes out. it is legal arithmetic and a useless plan — 90m is past
     * `MINUTES_OF_CACHE_REACH`, so that poke lands on a prefix already evicted.
     */
    const ran = useBeforeAll(async () =>
      runCli({
        cwd: genTreeWithRules({ slug: 'warmer-flag-ttl' }),
        args: ['--rules', 'rules.md', '--warmer', '1x,90m'],
      }),
    );

    when('[t0] the driver runs it', () => {
      then('🔴 it REFUSES rather than falls back to the default', () => {
        expect(ran.exitCode).toEqual(2);
      });

      then('and says WHY a wide cadence buys no coverage', () => {
        // an error that rejects a value without the reason is half an error
        expect(ran.stderr).toContain('90m apart');
        expect(ran.stderr).toContain('past the cache ttl');
      });

      then('🔴 it spent NAUGHT — no review ran', () => {
        // the refusal sits before `genContextBrain`, so a driver who typos a plan
        // pays for no review at all
        expect(ran.stdout).not.toContain('blockers');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case2] a plan shape this cannot read', () => {
    const ran = useBeforeAll(async () =>
      runCli({
        cwd: genTreeWithRules({ slug: 'warmer-flag-shape' }),
        args: ['--rules', 'rules.md', '--warmer', 'yes-please'],
      }),
    );

    when('[t0] the driver runs it', () => {
      then('it refuses, and names the whole valid set', () => {
        // recognition over recall: the fix is the message, not the manual
        expect(ran.exitCode).toEqual(2);
        expect(ran.stderr).toContain('--warmer off | on | <k>x,<m>m');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case3] a poke count over the bound', () => {
    /**
     * the bound is enforced by the PARSER rather than by the caller's care,
     * because a warmer spends unattended. `100x` is one keystroke from `10x`, and
     * only one of the two is a bill someone notices.
     */
    const ran = useBeforeAll(async () =>
      runCli({
        cwd: genTreeWithRules({ slug: 'warmer-flag-count' }),
        args: ['--rules', 'rules.md', '--warmer', '100x,10m'],
      }),
    );

    when('[t0] the driver runs it', () => {
      then('it refuses, and states the bound it broke', () => {
        expect(ran.exitCode).toEqual(2);
        expect(ran.stderr).toContain('100 pokes');
        expect(ran.stderr).toContain('spends unattended');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case4] `--warmer off`, on a tree with no rules', () => {
    /**
     * `off` must stay reachable, and it must be READ rather than refused. this
     * asserts the narrow half a unit cannot: that `off` reaches the CLI as a legal
     * value and does NOT trip the warmer parser.
     *
     * .note = it exits 2 on the ABSENT RULES, which is the point — the run got past
     *         the warmer parse to a later, different refusal. a bad `--warmer` would
     *         have stopped it earlier, with a warmer message.
     */
    const ran = useBeforeAll(async () =>
      runCli({
        cwd: genTempDir({ slug: 'warmer-flag-off' }),
        args: ['--warmer', 'off'],
      }),
    );

    when('[t0] the driver runs it', () => {
      then('🔴 the refusal is about RULES, never about the warmer', () => {
        expect(ran.exitCode).toEqual(2);
        expect(ran.stderr).not.toContain('--warmer');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case5] a driver who does not yet know the warmer exists', () => {
    /**
     * .why = `0.wish` bar 13's purpose clause is not a parse claim: *"`off` must
     *        stay reachable: a warmer spends real money on a live provider, and any
     *        spender a driver cannot refuse"* is one they abandon the tool over.
     *
     *        `[case4]` proves `off` PARSES. it proves naught about whether a driver
     *        can FIND it — and a lever nobody can find is not reachable, whatever the
     *        parser accepts (rule.require.help-on-demand, rule.require.discoverability).
     *
     * .note = the flag contract has TWO hand-maintained copies in `review.ts` —
     *        `FLAGS_KNOWN` and this help text — and naught derives one from the other.
     *        so a later flag can be recognized at parse and undiscoverable in help.
     *        this clamps that agreement for the ONE flag that spawns a spender; the
     *        general invariant is unclamped and caught as a dream.
     *
     * ⇒ the third copy already drifted: `review.sh`'s header documented
     *   `--mode soft|hard` until 2026-09-25, a flag the parser now swallows and
     *   ignores. that copy is deleted; these two remain.
     */
    const ran = useBeforeAll(async () =>
      runCli({
        cwd: genTempDir({ slug: 'warmer-flag-help' }),
        args: ['--help'],
      }),
    );

    when('[t0] they run `--help`', () => {
      then('🔴 the spender is NAMED, so it can be refused', () => {
        // the whole reason this is an acceptance test rather than a string assert:
        // help is a surface a driver reads, and a `--warmer` row in it is the only
        // reason `off` is reachable at all
        expect(ran.stdout).toContain('--warmer');
        expect(ran.exitCode).toEqual(0);
      });

      then('🔴 and `off` is stated, never left to be inferred', () => {
        // a driver who learns a warmer exists and cannot learn how to stop it is
        // worse off than one who never read the line
        expect(ran.stdout).toMatch(/--warmer[\s\S]{0,200}off/);
      });

      then('and it says the warmer SPENDS, which is why off matters', () => {
        // `rule.require.discoverability` asks the label to reveal the affordance.
        // "keeps the cache warm" reads free; the cost is the reason to reach for off
        //
        // the window scopes this to the --warmer block, so a cost line stranded
        // under another flag fails. 400 against a measured ~300 leaves room to grow
        expect(ran.stdout).toMatch(/--warmer[\s\S]{0,400}lose money/);
        expect(ran.stdout).toMatch(/--warmer[\s\S]{0,400}every poke costs/);
        expect(ran.stdout).toMatch(/--warmer[\s\S]{0,400}on = \d+x,\d+m/);
      });

      then('🔴 it states no hand-typed dollar figure for `on`', () => {
        // a typed price goes stale the moment a rate or the plan moves; the help
        // states the pokes it sends and points at the measured cost instead
        expect(ran.stdout).not.toMatch(
          /--warmer[\s\S]{0,700}~\$[\d.]+ per lane/,
        );
      });

      then('🔴 it never claims the warmer is bound to one platform', () => {
        // the single-warmer lease refreshes its record at every wake; naught reads
        // `/proc`, so a `linux-only` line would mislead a mac driver into a refusal
        // the code never makes
        expect(ran.stdout).not.toContain('linux-only');
        expect(ran.stdout).not.toContain('/proc');
      });

      then(
        '🔴 it needs no credential — help precedes every brain reach',
        () => {
          // the env is stripped in `runCli`, so a help path that touched a provider
          // would fail loud here rather than bill on a `--help`
          expect(ran.stderr).toEqual('');
        },
      );

      /**
       * .why a SNAPSHOT beside the four structural asserts above = `0.wish` bar 8
       *     asks that *"every stdout surface is snapshotted — a reviewer can eyeball
       *     the diff in the PR."* the four asserts each pin one fact; none of them
       *     can see a reword, a dropped line, or a column that collapsed.
       *
       *     this surface earns it more than most: `review.sh`'s own header calls
       *     `--help` *"the AUTHORITATIVE flag list"* and deletes its own copy for
       *     that reason. an authoritative list nobody diffs is one that drifts, and
       *     the third copy of this contract already did exactly that
       *     (`--mode soft|hard`, live in a header for months after the parser had
       *     swallowed it).
       */
      then('🔴 and the whole flag list renders, diffable in the PR', () => {
        expect(ran.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case6] a bare `--warmer`, with no value after it', () => {
    /**
     * .why = this is the one refusal whose evidence spans TWO files, so neither
     *        unit can see it. the refusal lives in `asReviewWarmerPlan.ts`; the seam
     *        that makes it REACHABLE lives in `review.ts` — a valueless flag must
     *        arrive as `true` rather than `undefined`, because those two ask opposite
     *        questions of the parser:
     *
     *          `undefined` → the driver never typed --warmer  → take the default
     *          `true`      → the driver typed it and said naught → REFUSE
     *
     *        each half is unit-clamped on its own side (`asReviewWarmerPlan.test.ts`
     *        for the refusal, `review.parseReviewArgs.test.ts` for the seam). the WIRE
     *        between them is what this asserts, and it is a property only a spawn has.
     *
     * .the harm if the wire parts = a bare `--warmer` reads as an absent one, so it
     *     falls to the `off` default SILENTLY. a driver who typed the flag to turn the
     *     warmer on gets none, and no line says so — reached through the one door a
     *     malformed-value test cannot cover, because there is no value to malform.
     */
    const ran = useBeforeAll(async () =>
      runCli({
        cwd: genTreeWithRules({ slug: 'warmer-flag-valueless' }),
        args: ['--rules', 'rules.md', '--warmer'],
      }),
    );

    when('[t0] the driver runs it', () => {
      then('🔴 it REFUSES rather than falls back to the default', () => {
        expect(ran.exitCode).toEqual(2);
      });

      then(
        'and says it cannot tell `on` from a value they meant to type',
        () => {
          // the ambiguity IS the reason to refuse, so the message states it rather
          // than emits a bare "invalid value"
          expect(ran.stderr).toContain('no value');
          expect(ran.stderr).toContain('"on"');
        },
      );

      then('and names the whole valid set, so the fix is at hand', () => {
        expect(ran.stderr).toContain('--warmer off | on | <k>x,<m>m');
      });

      then('🔴 it spent NAUGHT — no review ran', () => {
        // an empty stdout, not merely one without a count: the refusal writes to
        // stderr alone, so any stdout at all would mean a review began
        expect(ran.stdout).toEqual('');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case7] a warmer asked of a `--mode plan` preview', () => {
    /**
     * .why = a plan run sends no prompt and ends `planned`, and a warmer spawns only on
     *        a round that `reviewed`. so `--warmer on --mode plan` parsed, validated, and
     *        then did naught — a spend the driver asked for and never got, with no word.
     *        a preview has no cache to keep warm, so the pair is refused at the door
     */
    const ran = useBeforeAll(async () =>
      runCli({
        cwd: genTreeWithRules({ slug: 'warmer-flag-mode-plan' }),
        args: ['--rules', 'rules.md', '--warmer', 'on', '--mode', 'plan'],
      }),
    );

    when('[t0] the driver runs it', () => {
      then('🔴 it REFUSES rather than ignores the warmer in silence', () => {
        expect(ran.exitCode).toEqual(2);
      });

      then('and says a preview has no cache to keep warm', () => {
        expect(ran.stderr).toContain('cannot run with --mode plan');
        expect(ran.stderr).toContain('no cache to keep warm');
      });

      then('🔴 it spent NAUGHT — no review ran', () => {
        expect(ran.stdout).toEqual('');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case8] a plan of zero pokes', () => {
    // the lower bound of the count: `0x` is `--warmer off` said the long way
    const ran = useBeforeAll(async () =>
      runCli({
        cwd: genTreeWithRules({ slug: 'warmer-flag-zero-pokes' }),
        args: ['--rules', 'rules.md', '--warmer', '0x,15m'],
      }),
    );

    when('[t0] the driver runs it', () => {
      then('it refuses, and names the plan it said the long way', () => {
        expect(ran.exitCode).toEqual(2);
        expect(ran.stderr).toContain('0 pokes');
        expect(ran.stderr).toContain('--warmer off said the long way');
      });

      then('🔴 it spent NAUGHT — no review ran', () => {
        expect(ran.stdout).not.toContain('blockers');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });

  given('[case9] a zero-minute cadence', () => {
    // the lower bound of the cadence: `0m` would spend the whole plan at one instant
    const ran = useBeforeAll(async () =>
      runCli({
        cwd: genTreeWithRules({ slug: 'warmer-flag-zero-cadence' }),
        args: ['--rules', 'rules.md', '--warmer', '3x,0m'],
      }),
    );

    when('[t0] the driver runs it', () => {
      then('it refuses, and says why a zero cadence buys no coverage', () => {
        expect(ran.exitCode).toEqual(2);
        expect(ran.stderr).toContain('0m cadence');
        expect(ran.stderr).toContain('spend the whole plan at once');
      });

      then('🔴 it spent NAUGHT — no review ran', () => {
        expect(ran.stdout).not.toContain('blockers');
      });

      then('the refusal renders whole', () => {
        expect(ran.stderr).toMatchSnapshot();
      });
    });
  });
});
