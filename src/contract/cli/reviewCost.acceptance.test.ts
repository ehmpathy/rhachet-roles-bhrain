import { spawnSync } from 'child_process';
import * as fs from 'fs';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import { priceSum } from 'iso-price';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';
import { pathToFileURL } from 'url';

import { IS_CACHEABLE_SECTION } from '@src/domain.objects/Reviewer/PromptSectionChars';
import { DIR_OF_REVIEW_LOGS } from '@src/domain.operations/review/asReviewLogsDir';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';

/**
 * .what = acceptance tests for the review._.cost cli contract
 * .why = this is the command a human runs to learn what review cost, so its OUTPUT
 *        is the deliverable — not the report objects behind it. a contract-grain
 *        test (rule.require.test-coverage-by-grain): it spawns the real built cli
 *        through the package's public export subpath, no mocks, and snaps what the
 *        human actually sees.
 *
 * .note = the axis itself is under test, not merely the three reports. the whole
 *         claim of `F1` is that ONE command over `--of run|tree|grove` expresses a
 *         breadth the old command set could not — so `[case1]` exercises `run`, the
 *         position that had no surface at all, and `[case4]` clamps the refusal that
 *         makes the axis discoverable.
 *
 * .note = the ABSENCE cases still matter most. a figure is only honest if a run
 *         whose spend was never recorded refuses to render as `$0.00`, and if an
 *         empty corpus names its fix rather than exiting silent. both are snapped.
 *
 * .how = imports by absolute path (rule.require.blackbox-via-selflink), so the spawn
 *        cwd is free to be the fixture root rather than this repo.
 *
 * .note = the `@src` imports here are SETUP and VERIFY reads, which the blackbox rule
 *         sanctions (rule.require.acceptance.blackbox: the ACTION goes through the
 *         contract; setup and verify may reach internals). they are deliberate — a seam
 *         clamp asserted against a hand-typed literal would pass while the published
 *         seam drifted from the one the renderer reads.
 */
const CLI_MODULE_URL = pathToFileURL(
  require.resolve('rhachet-roles-bhrain/cli/review._.cost'),
).href;
const CLI_COMMAND = `import(${JSON.stringify(
  CLI_MODULE_URL,
)}).then(m => m.reviewCost())`;

/**
 * .what = runs the cli via node -e from a given cwd, with given args
 * .why = mirrors how `rhx review._.cost` reaches it
 *
 * .note = spawnSync, not execFileSync, so stderr is captured on BOTH paths — the
 *         empty-corpus and bad-`--of` cases exit 2 and write their whole guidance
 *         to stderr
 */
const runCli = (input: {
  cwd: string;
  args?: string[];
}): { stdout: string; stderr: string; exitCode: number } => {
  const args = input.args ?? [];
  const result = spawnSync('node', ['-e', CLI_COMMAND, '--', ...args], {
    cwd: input.cwd,
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  return {
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
    exitCode: result.status ?? 1,
  };
};

/**
 * .what = asserts a grove walk exited clean AND spoke its status on stderr
 * .why = `stderr === ''` was the old shape of "clean", and it is now FALSE by design:
 *        a walk that probes every tree on the machine reports its progress there,
 *        because a minutes-long silent wait is a blocker (`rule.require.status-feedback`).
 *
 *        the assertion is not weakened by the change — it is SPLIT, and each half
 *        is stronger than the line it replaces:
 *          - stderr carries the status transcript, and NO stack trace
 *          - stdout carries the payload, and NO status line
 *
 *        a bare `toEqual('')` could state neither. it passed for a command that said
 *        not one word in four minutes, and it would have passed just as readily had
 *        the progress landed on stdout and made `--json` unparseable.
 *
 * .note = the `└─ folded` reach is deliberate: it is the LAST line the walk emits, so
 *         its presence proves the stream ran to completion rather than died mid-walk.
 */
const expectGroveExitedCleanAndSpoke = (input: {
  run: { stdout: string; stderr: string; exitCode: number };
}): void => {
  expect(input.run.exitCode).toEqual(0);
  expect(input.run.stderr).toContain('price every tree under');
  expect(input.run.stderr).toContain('└─ folded');
  expect(input.run.stderr).not.toContain('Error:');
  expect(input.run.stdout).not.toContain('folded');
};

/**
 * .what = swaps the per-run temp root for a stable placeholder
 * .why = the reports echo the root they read, and a temp root carries a timestamp
 *        and a random suffix — so an unstabilized snapshot would diff on every run
 *        and teach a reviewer to ignore it, which is worse than no snapshot at all
 *
 * .note = fails loud if the root is absent from the output: that would mean the
 *         report no longer states what it read, which is a real regression and must
 *         not be masked behind a placeholder that still matches (rule.forbid.failhide)
 *
 * .note = the root arrives in TWO forms, and both must be swapped. the cli echoes
 *         the root it READ: where the caller passed `--at`, that is the path verbatim;
 *         where it defaulted to `process.cwd()`, node reports it RESOLVED — and
 *         `genTempDir` hands back a symlink into `/tmp`. a stabilizer that knew only
 *         the symlink form threw on the very cases that exercise the default.
 */
const asStableRoot = (input: { stdout: string; root: string }): string => {
  const real = fs.realpathSync(input.root);
  if (!input.stdout.includes(input.root) && !input.stdout.includes(real))
    throw new UnexpectedCodePathError(
      'report does not state the root it read',
      {
        expected: [input.root, real],
        stdout: input.stdout,
        hint: 'the report stopped to echo the root it read; restore the root line in the render before the snapshot is trusted',
      },
    );
  return input.stdout
    .split(input.root)
    .join('<temp-root>')
    .split(real)
    .join('<temp-root>');
};

/**
 * .what = stabilizes a REFUSAL's stderr for a snapshot
 * .why = every negative path this command can take writes its whole guidance to
 *        stderr, and that guidance is a caller-visible contract variant — so it is
 *        snapped, never merely `toContain`'d
 *        (`rule.require.contract-snapshot-exhaustiveness`).
 *
 *        an assertion can only see the line it names. `toContain('fix:')` passes
 *        for a refusal whose fix line was reworded, whose hint was dropped, and
 *        whose tree alignment collapsed — so the reviewer who reads the PR diff
 *        sees no change at all. the snapshot is what puts the whole block in front
 *        of them.
 *
 * .note = unlike `asStableRoot` it does NOT demand the root be present. most
 *         refusals name no path at all — a bad `--of` rejects before any corpus is
 *         read — so a presence check here would fail the very cases it stabilizes.
 *         the roots it is handed are swapped where they appear, and where they do
 *         not, the text is already stable.
 *
 * .note = the roots are swapped LONGEST-FIRST, and that sort is load-bearing
 *         rather than tidy. `genTempDir` hands back a dir NESTED UNDER this repo
 *         (`<repo>/.temp/genTempDir.symlink/…`), so a shorter needle swapped first
 *         would eat the longer one and leave behind
 *         `<temp-root>/.temp/…2026-09-23T13-33-30.707Z.<slug>.4359f950` — a
 *         timestamp and a random suffix that diff on EVERY run. the longest match
 *         is always the most specific, so this sort holds however the paths nest.
 *
 * .note = a refusal that names THIS CLONE's own path is REFUSED, never swapped.
 *         `asRefusalOfAbsentTreeLogs` walks up from the spawn CWD, so a case spawned
 *         at `process.cwd()` echoes whichever ancestor of this checkout happens to
 *         hold review logs.
 *
 *         a placeholder swap would hide that, and it is the wrong repair — the
 *         snapshot would still assert a hint that appears only BECAUSE this working
 *         copy has been reviewed. on a fresh CI checkout no ancestor holds logs, the
 *         hint is withheld, and the snapshot reddens for a reason the contract never
 *         changed (`rule.require.hermetic-tests`).
 *
 *         so it THROWS, and names the fix. a case that wants the walk-up hint
 *         builds its own reviewed tree and spawns beneath it, as `[case7]` does —
 *         the fixture owns the ancestor, so the render is equal on every machine.
 */
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const asStableRefusal = (input: {
  stderr: string;
  roots?: (string | undefined)[];
}): string => {
  const stable = (input.roots ?? [])
    .filter((one): one is string => typeof one === 'string')
    .flatMap((one) => [one, fs.existsSync(one) ? fs.realpathSync(one) : one])
    .sort((a, b) => b.length - a.length)
    .reduce((text, one) => text.split(one).join('<temp-root>'), input.stderr)
    .trimEnd();

  [REPO_ROOT, fs.realpathSync(REPO_ROOT)].forEach((one) => {
    if (!stable.includes(one)) return;
    throw new UnexpectedCodePathError(
      'refusal names this clone’s own path, so the snapshot would be machine-specific',
      {
        found: one,
        why: 'the walk-up hint reads the spawn cwd, and this case spawned inside the repo',
        stderr: stable,
        hint: 'spawn from a fixture tree (see [case7]), never from process.cwd()',
      },
    );
  });

  return stable;
};

/**
 * .what = seeds one review run under a tree, at a chosen honesty grade
 * .why = the three grades are the contract's central claim, so a fixture must be able
 *        to mint each one exactly as `stepReview` leaves it on disk:
 *          metered = args + prompt + metrics
 *          unknown = args + prompt, NO metrics (a brain may have been billed)
 *          refused = args only (died at validation, so nil cost is a FACT)
 *
 * .note = `compiled` mints `metrics.compiled.json` beside the rest — the artifact
 *         that makes a per-input census possible at all.
 *
 *         it is read by BOTH the `run` and `grove` breadths: `run` renders its
 *         rows exactly, and `grove` folds them over every prompt it could read
 *         (`asGrovePromptInputs`). an earlier note here claimed `run` alone read
 *         it, which is why a fixture author could believe the grove cases did not
 *         need it.
 *
 *         which breadth answers *"which input bought this?"* is declared ONCE,
 *         by `--help`, and clamped by the snapshot. it is not restated here.
 */
const setOneRun = (input: {
  tree: string;
  name: string;
  route: string;
  slug: string;
  grade: 'metered' | 'unknown' | 'refused';
  input_: number;
  cacheGet: number;
  compiled?: boolean;
  /**
   * the ATTRIBUTION grade the writer stamped on its own census — a separate
   * axis from `grade`, which prices the run.
   *
   * .why = `compiled: true` alone mints a census with NO stated attribution, and
   *        that reads as `ungraded` (the ~2,700 runs already on disk predate the
   *        field). so a fixture that wants the `UNATTRIBUTED` caveat must say
   *        so out loud — which is exactly the honesty the grade itself enforces
   */
  attribution?: 'attributed' | 'unattributed';
  /**
   * the guard iteration this run belongs to, `i001` by default.
   *
   * .why = the ROUND is the second axis of the `--trace` cross-tab, and every
   *        extant fixture seeds one round — so a corpus built from them can only
   *        ever render a single column, and a one-column cross-tab proves the
   *        render ran rather than that it CROSSES two axes. a case that grades the
   *        flag has to be able to seed two.
   */
  round?: string;
  /**
   * the per-dimension bill a metered run records beside its total.
   *
   * .why = the amount a cache saved is priced from the run's OWN full rate
   *        (`getOneCacheSavedPrice`), and an artifact with `total` alone is unpriced —
   *        so a fixture with no dimensions could never render a priced `saved`
   */
  costOf?: { input: string; cacheRead: string };
  /**
   * where the compiled run's target mass came from — a placed locus by DEFAULT,
   * since every run compiled from this release on writes one.
   *
   * .why = the tree and grove render a directory to prune from this row alone; a
   *        fixture that never wrote it could only ever render the ABSENT state, and
   *        the measured answer would reach the cli untested. `null` mints a run
   *        compiled before the row existed, so the absent state stays covered too.
   */
  locus?: { path: string; chars: number }[] | null;
  /**
   * whether the run's `input.prompt.md` is on disk — true by default.
   *
   * .why = a pruned log keeps its compiled metrics and drops the megabyte prompt, and
   *        that run reached the brain all the same. `false` mints that state, so the
   *        cli can be shown to price it `unknown`, never a `refused` $0
   */
  prompt?: boolean;
}): void => {
  const dir = path.join(input.tree, '.log', 'bhrain', 'review', input.name);
  fs.mkdirSync(dir, { recursive: true });

  const round = input.round ?? 'i001';
  const leaf = `5.1.execution.from_vision._.review.${round}.abc1234.r000._.given.by_peer.${input.slug}.report.md`;
  fs.writeFileSync(
    path.join(dir, 'input.args.json'),
    JSON.stringify({
      args: {
        output: path.join(input.route, '.reviews', 'peer', leaf),
        focus: 'push',
      },
      scope: { ruleFiles: ['a.md'], refFiles: [], targetFiles: ['x.ts'] },
    }),
  );

  if (input.grade === 'refused') return;
  if (input.prompt !== false)
    fs.writeFileSync(path.join(dir, 'input.prompt.md'), '# review task');

  // all EIGHT named inputs, and they sum to `prompt.chars` exactly.
  // `getOnePromptSectionCharsFromCompiled` throws on an artifact whose rows disagree
  // with its own stated total — deliberately, because a census that under-reports
  // must never read as a whole one. so a fixture that omits an input is not a
  // lighter fixture; it is a malformed artifact, and the reader is right to refuse it
  if (input.compiled)
    fs.writeFileSync(
      path.join(dir, 'metrics.compiled.json'),
      JSON.stringify({
        prompt: {
          chars: 100_000,
          ...(input.attribution ? { attribution: input.attribution } : {}),
        },
        inputs: {
          rules: { chars: 20_000, count: 2 },
          refs: { chars: 10_000, count: 1 },
          conversation: { chars: 5_000, count: 1 },
          targetDiffs: { chars: 15_000, count: 3 },
          targetFiles: { chars: 49_000, count: 3 },
          // the head and its markup — ~1% of the prompt, which is the overhead a
          // real run measures. only `markup` folds into `scaffold`
          instructions: { chars: 600, count: 1 },
          outputFormat: { chars: 300, count: 1 },
          markup: { chars: 100, count: 1 },
        },
        // three target files whose mass sums to `targetFiles` above, over two
        // directories — one a root-level `blackbox/` file, the shape the rollup
        // must fold to its parent rather than key to itself
        ...(input.locus === null
          ? {}
          : {
              locus: input.locus ?? [
                { path: 'src/domain.operations/invoice/a.ts', chars: 30_000 },
                { path: 'src/domain.operations/invoice/b.ts', chars: 12_000 },
                { path: 'blackbox/invoice.acceptance.test.ts', chars: 7_000 },
              ],
            }),
      }),
    );

  if (input.grade === 'unknown') return;
  fs.writeFileSync(
    path.join(dir, 'metrics.realized.json'),
    JSON.stringify({
      tokens: {
        input: input.input_,
        inputCacheCreation: 0,
        inputCacheRead: input.cacheGet,
        output: 1_000,
      },
      // a run with dimensions records ALL four, and its total IS their sum — the
      // shape a breakdown that measures the bill has. the meter prices a cache's
      // saved amount only off a breakdown that reconciles with its total
      // (`isRunCostBreakdownReconciled`), so a fixture whose parts disagree with
      // its total would mint the openrouter shape — a spec-rate estimate — by accident
      cost: input.costOf
        ? {
            input: input.costOf.input,
            cacheWrite: '$0',
            cacheRead: input.costOf.cacheRead,
            output: '$0.0100',
            total: priceSum(
              input.costOf.input,
              input.costOf.cacheRead,
              '$0.0100',
            ),
          }
        : { total: '$0.2500' },
    }),
  );
};

/**
 * .what = seeds a tree whose runs span all three honesty grades
 * .why = one fixture shape reused by the run, tree, and grove cases, so the three
 *        breadths are demonstrably read over the SAME corpus at different reaches
 */
const setOneTree = (input: { tree: string }): void => {
  const route = '.behavior/v2026_09_18.feat-demo';

  // a REAL guard, at the path a run's relative route points at. the level axis
  // is the one figure the meter joins from OUTSIDE the log corpus, so a fixture
  // with no guard would render "(no level — guard unread)" for every row and
  // prove only that the absence path works. this seeds the PRESENT path too, so
  // the published entrypoint is demonstrably able to reach a guard and read it —
  // the one step `getAllReviewerLevels.integration.test.ts` cannot cover, since
  // it calls the operation rather than the cli
  const guardDir = path.join(input.tree, route);
  fs.mkdirSync(guardDir, { recursive: true });
  fs.writeFileSync(
    path.join(guardDir, '5.1.execution.from_vision.guard'),
    [
      'reviews:',
      '  peer:',
      '    - slug: repo-rules',
      '      run: rhx review --rules a',
      '      level: 1',
      '    - slug: mech-failhides',
      '      run: rhx review --rules b',
      '      level: 1',
      // L3 on purpose — two levels, so the axis renders more than one row and
      // a reader can see the corpus PARTED rather than merely labeled
      '    - slug: arch-smell-scopeleaks',
      '      run: rhx review --rules c',
      '      level: 3',
    ].join('\n'),
  );

  setOneRun({
    tree: input.tree,
    name: '2026-09-18T00-00-00-000Z.pid1.aaa',
    route,
    slug: 'repo-rules',
    grade: 'metered',
    input_: 400_000,
    cacheGet: 100_000,
  });
  setOneRun({
    tree: input.tree,
    name: '2026-09-18T00-00-01-000Z.pid1.bbb',
    route,
    slug: 'mech-failhides',
    grade: 'unknown',
    input_: 0,
    cacheGet: 0,
  });
  setOneRun({
    tree: input.tree,
    name: '2026-09-18T00-00-02-000Z.pid1.ccc',
    route,
    slug: 'arch-smell-scopeleaks',
    grade: 'refused',
    input_: 0,
    cacheGet: 0,
  });
};

describe('reviewCost.acceptance', () => {
  given(
    '[case1] a tree whose LATEST run compiled a prompt and recorded its spend',
    () => {
      const scene = useBeforeAll(async () => {
        const tree = genTempDir({ slug: 'review-cost-cli-case1' });
        setOneTree({ tree });
        // the newest dir by name, so a lexical sort finds it — and it carries a
        // compiled census, which is the whole point of the `run` breadth
        setOneRun({
          tree,
          name: '2026-09-18T00-00-03-000Z.pid1.ddd',
          route: '.behavior/v2026_09_18.feat-demo',
          slug: 'repo-rules',
          grade: 'metered',
          input_: 200_000,
          cacheGet: 300_000,
          compiled: true,
        });
        return { tree, run: runCli({ cwd: tree, args: ['--of', 'run'] }) };
      });

      when('[t0] the run is priced', () => {
        then('it exits clean', () => {
          // stderr FIRST. an exit code names no cause, so a bare
          // `toEqual(0)` reports `Expected: 0 / Received: 1` and leaves the
          // reader to re-run the cli by hand to learn why. the stack is already
          // captured — assert on it, and the failure names itself
          expect(scene.run.stderr).toEqual('');
          expect(scene.run.exitCode).toEqual(0);
        });

        then('it prices the LATEST run, never the first', () => {
          // the log dir name leads with an iso timestamp, so a lexical sort IS a
          // chronological one — the contract `getOneReviewRunMeterLatest` rests on
          expect(scene.run.stdout).toContain('00-00-03-000Z');
          expect(scene.run.stdout).not.toContain('00-00-00-000Z');
        });

        then('it names the run identity the guard gave it', () => {
          expect(scene.run.stdout).toContain('repo-rules');
          expect(scene.run.stdout).toContain('5.1.execution.from_vision');
        });

        then('🔴 the two cost levers lead the run, by default', () => {
          // the same block every breadth renders with no flag
          // (rule.require.report-both-cost-levers-with-trend-and-locus)
          expect(scene.run.stdout).toContain('levers — input DOWN · cache UP');
        });

        then(
          '🔴 it attributes THIS prompt to named inputs, exactly — not a fold over many',
          () => {
            // the whole reason `run` earns a position on the axis. `grove` also
            // attributes, but only as a SUM over the prompts it could read — a
            // share there cannot be traced back to the prompt that bought it.
            // which breadth answers what is declared by `--help`, and clamped by
            // the snapshot; it is not restated here
            expect(scene.run.stdout).toContain('composition');
            expect(scene.run.stdout).toContain('rules');
            expect(scene.run.stdout).toContain('refs');
            expect(scene.run.stdout).toContain('targetDiffs');
            expect(scene.run.stdout).toContain('targetFiles');
            expect(scene.run.stdout).toContain('scaffold');
          },
        );

        then(
          'every census row states which side of the cache seam it sat on',
          () => {
            // a section's share is only half the answer — `rules` at 30% costs
            // almost naught when cached, where `targetFiles` at 30% is re-paid
            // every round
            expect(scene.run.stdout).toContain('cacheable');
            expect(scene.run.stdout).toContain('per round');
          },
        );

        then('the whole report renders as the human sees it', () => {
          expect(
            asStableRoot({ stdout: scene.run.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] the same run is asked for as json', () => {
        // `--of` is a CLOSED axis, so `--json` must work at every position of it.
        // a flag that answers at two of three is `rule.forbid.surprises` in its
        // plainest form — and `run` is the position that had no surface at all, so
        // it is the one most likely to be built without the flag and never noticed
        const run = useBeforeAll(async () =>
          runCli({ cwd: scene.tree, args: ['--of', 'run', '--json'] }),
        );

        then('it exits clean and emits parseable json, never a tree', () => {
          expect(run.stderr).toEqual('');
          expect(run.exitCode).toEqual(0);
          expect(run.stdout).not.toContain('🦉');
          expect(() => JSON.parse(run.stdout)).not.toThrow();
        });

        then('the json carries the same run the tree render named', () => {
          const report = JSON.parse(run.stdout);
          expect(report.run.dir).toContain('00-00-03-000Z');
          expect(report.run.grade).toEqual('metered');
          expect(report.run.identity.slug).toEqual('repo-rules');
        });

        then(
          'the per-input census survives into the data, not only the render',
          () => {
            // the whole reason `run` earns a position — a consumer of --json must be
            // able to attribute the prompt, which no other breadth can answer
            const report = JSON.parse(run.stdout);
            expect(report.run.prompt.source).toEqual('compiled');
            expect(report.run.prompt.chars).toEqual(100_000);
            expect(report.run.prompt.sections).toEqual({
              rules: 20_000,
              refs: 10_000,
              conversation: 5_000,
              // a legacy undivided diff total reads as mutations: it was the edited
              // hunks the old census summed, so no addition or deletion is invented
              'targetDiffs.additions': 0,
              'targetDiffs.deletions': 0,
              'targetDiffs.mutations': 15_000,
              targetFiles: 49_000,
              // the two named head inputs carry rows of their own; only markup is residual
              instructions: 600,
              outputFormat: 300,
              scaffold: 100,
            });
          },
        );

        then(
          '🔴 and the CACHE SEAM survives the pipe, not only the tty',
          () => {
            // the defect this clamps: the tty marks each row `cacheable` /
            // `per round`, and the json carried chars ALONE — so a pipe
            // consumer had to re-declare the six-key split on their side, and a
            // copied decision drifts. a share cannot answer "which input do we cut?":
            // a large cacheable section is the cheap half, a small uncacheable one
            // the expensive half.
            //
            // asserted against the CONSTANT, never against a hand-typed literal.
            // a literal here would be a second copy of the very decision this key
            // exists to spare a consumer — it would pass while the published seam
            // drifted from the one the renderer reads.
            const report = JSON.parse(run.stdout);
            expect(report.seam).toEqual(IS_CACHEABLE_SECTION);

            // and the seam names EVERY section the census reports, so no row of
            // `sections` can arrive with no side of the seam to sit on
            expect(Object.keys(report.seam).sort()).toEqual(
              Object.keys(report.run.prompt.sections).sort(),
            );
          },
        );

        then('the json payload renders as a consumer receives it', () => {
          // every step of this journey carries a snapshot, this one included
          // (rule.require.snapshot-every-journey-step). the field assertions above
          // pin the figures a reader came for; only the snapshot shows the SHAPE —
          // which keys exist, how they nest, what a `null` looks like on the wire.
          // a consumer builds against the shape, so a silent key rename breaks
          // every one of them, and no field assertion above would catch it
          expect(
            asStableRoot({ stdout: run.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });

      when('[t2] the tree is priced over the same corpus', () => {
        const run = useBeforeAll(async () =>
          runCli({ cwd: scene.tree, args: ['--of', 'tree'] }),
        );

        then('it exits clean', () => {
          expect(run.stderr).toEqual('');
          expect(run.exitCode).toEqual(0);
        });

        then(
          'the census names every grade, so a total is read against it',
          () => {
            expect(run.stdout).toContain('metered');
            expect(run.stdout).toContain('refused');
            expect(run.stdout).toContain('unknown');
          },
        );

        then('🔴 the census COUNTS every grade, not merely names it', () => {
          // a `toContain('metered')` passes over a header that reads `0 metered`,
          // so the words prove the render and only the arithmetic proves the read.
          // this corpus holds 4 runs: 2 metered (aaa, ddd), 1 refused (ccc), and
          // 1 unknown (bbb) — and the header must say so
          expect(run.stdout).toContain(
            'runs: 4 (2 metered · 1 refused · 1 unknown 🟡)',
          );
        });

        then('the cache share is taken over PROMPT tokens', () => {
          // the denominator IS the claim, and a percentage cannot show it.
          // input 600k + cache.set 0 + cache.get 400k = 1.0M prompt tokens, so the
          // share reads 40.0%. an input-only denominator would read 66.7%, and one
          // that swept in the 2k of output would read 39.9% — so this single figure
          // parts the correct read from both of its near misses
          expect(run.stdout).toContain(
            'cache:     40.0% of prompt tokens served from cache',
          );
        });

        then('🔴 the two cost levers lead the report, by default', () => {
          // the wish's main deliverable as a human sees it: input size DOWN and
          // cache rate UP, both rendered with no flag
          // (rule.require.report-both-cost-levers-with-trend-and-locus)
          expect(run.stdout).toContain('levers — input DOWN · cache UP');
          expect(run.stdout).toContain('input:     500,000 prompt tokens/run');
        });

        then(
          'it rolls up by reviewer, level, stone, and round — never one total alone',
          () => {
            // a total hides which lane is dear; the roll-ups are the point
            expect(run.stdout).toContain('by reviewer');
            expect(run.stdout).toContain('by level');
            expect(run.stdout).toContain('by stone');
            expect(run.stdout).toContain('by round');
          },
        );

        then(
          '🔴 the level axis REACHES the guard, rather than merely report it absent',
          () => {
            // the one figure the meter joins from OUTSIDE the log corpus. every
            // other row is folded from artifacts the run itself wrote; this one
            // resolves a RELATIVE route against the tree, opens a guard, and parses
            // it. so a `toContain('by level')` alone would pass over a report that
            // reached no guard at all and rendered one honest "(guard unread)" row
            // — the section header proves the render, and only a real level proves
            // the read (the same failhide shape as `toContain('metered')` above)
            expect(run.stdout).toContain('L1');
            expect(run.stdout).toContain('L3');
            expect(run.stdout).not.toContain('guard unread');
          },
        );

        then('each level folds only the lanes the guard put there', () => {
          // the guard declares repo-rules + mech-failhides at L1 and
          // arch-smell-scopeleaks at L3. the corpus holds 4 runs — 3 of them L1
          // (aaa, bbb, ddd) and 1 L3 (ccc) — so the counts part the two levels
          const rowOfL1 = run.stdout
            .split('\n')
            .find((line) => line.includes('L1'));
          const rowOfL3 = run.stdout
            .split('\n')
            .find((line) => line.includes('L3'));
          expect(rowOfL1).toContain('3 runs');
          expect(rowOfL3).toContain('1 run');
        });

        then('the whole report renders as the human sees it', () => {
          expect(
            asStableRoot({ stdout: run.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });

      when('[t3] the same tree is asked for as json', () => {
        // `--of` is a CLOSED axis and `--json` rides it, so the flag owes an
        // answer at EVERY position. `run` is clamped at [t1] and `grove` at
        // [case2][t1] — `tree` sat between two covered neighbours and was the one
        // position no case exercised, which is exactly where a flag rots unseen
        // (rule.require.behavior-intent-coverage)
        const run = useBeforeAll(async () =>
          runCli({ cwd: scene.tree, args: ['--of', 'tree', '--json'] }),
        );

        then('it exits clean and emits parseable json, never a tree', () => {
          expect(run.stderr).toEqual('');
          expect(run.exitCode).toEqual(0);
          expect(run.stdout).not.toContain('🦉');
          expect(() => JSON.parse(run.stdout)).not.toThrow();
        });

        then('🔴 the honesty grades survive into the data', () => {
          // the render at [t2] states `4 (2 metered · 1 refused · 1 unknown)`.
          // a consumer must be able to read that same census off the wire, or the
          // json is a total with its caveat stripped — which is the one shape
          // `rule.forbid.failhide` forbids most plainly
          const { report } = JSON.parse(run.stdout);
          expect(report.corpus.runs).toEqual({
            total: 4,
            metered: 2,
            refused: 1,
            unknown: 1,
            accounted: 3,
          });
        });

        then(
          '🔴 and this breadth publishes the cache seam its census needs',
          () => {
            // the seam is a LEGEND over a per-input census, and `tree` now carries
            // one (`report.inputs`). a census with no legend hands a consumer six
            // keys and no word on which side of the cache each sat, so the seam
            // rides with the census at every breadth that folds one
            const parsed = JSON.parse(run.stdout);
            expect(parsed.seam).toBeDefined();
            expect(Object.keys(parsed.seam).sort()).toEqual(
              Object.keys(parsed.report.inputs.sections).sort(),
            );
          },
        );

        then(
          '🔴 an axis position carries the same figures as its render',
          () => {
            // the tree render pins `40.0% of prompt tokens served from cache`; the
            // json must carry the identical rate, as a number rather than a string.
            // two surfaces over one report that disagree is the drift a shared
            // report object exists to make impossible
            const { report } = JSON.parse(run.stdout);
            expect(report.corpus.cacheHitRate).toEqual(0.4);
            expect(report.corpus.tokens).toEqual({
              input: 600_000,
              cacheSet: 0,
              cacheGet: 400_000,
              output: 2_000,
            });
          },
        );

        then('🔴 the tree breadth carries the per-input census', () => {
          // "which input bought this?" is owed at every breadth
          // (rule.require.report-both-cost-levers-with-trend-and-locus). the tree
          // folds the same census the grove does, so a consumer reads where the
          // prompt chars sat, beside how many runs could be read to say so
          const { report } = JSON.parse(run.stdout);
          expect(report.inputs).toBeDefined();
          expect(report.inputs.read + report.inputs.unread).toBeGreaterThan(0);
          expect(report.inputs.sections).toBeDefined();
        });

        then('the json payload renders as a consumer receives it', () => {
          expect(
            asStableRoot({ stdout: run.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] a grove whose runs span all three honesty grades', () => {
    const scene = useBeforeAll(async () => {
      const root = genTempDir({ slug: 'review-cost-cli-case2' });
      const tree = path.join(root, 'repo.beav.feat-demo');
      fs.mkdirSync(tree, { recursive: true });
      setOneTree({ tree });

      // a second tree that never reviewed — its count is part of the answer
      fs.mkdirSync(path.join(root, 'repo.beav.feat-quiet'), {
        recursive: true,
      });

      return {
        root,
        run: runCli({ cwd: root, args: ['--of', 'grove', '--at', root] }),
      };
    });

    when('[t0] the grove is priced', () => {
      then('it exits clean AND speaks its status on stderr', () => {
        expectGroveExitedCleanAndSpoke({ run: scene.run });
      });

      then(
        'the census names every grade, so a total is read against it',
        () => {
          // the central law, at the surface a human reads: 3 runs found, and the
          // reader can see only 1 of them could prove its spend
          expect(scene.run.stdout).toContain('3 found');
          expect(scene.run.stdout).toContain('1 metered');
          expect(scene.run.stdout).toContain('1 refused');
          expect(scene.run.stdout).toContain('1 unknown');
        },
      );

      then('an UNKNOWN lane renders its spend ABSENT, never as $0.00', () => {
        // the defect this clamps: a rollup that summed cost over metered runs
        // and fell back to `USD 0` when it found none — so `mech-failhides`, whose
        // one run compiled a prompt and then died before it wrote metrics, rendered
        // as a measured `$0.00`. the brain may genuinely have been billed for it
        const line = scene.run.stdout
          .split('\n')
          .find((one) => one.includes('mech-failhides'));
        expect(line).toContain('absent');
        expect(line).not.toContain('$0.00');
      });

      then('a REFUSED lane still renders $0 — its nil is a FACT', () => {
        // the opposite half of the same law, and the reason `absent` cannot simply
        // replace every zero: a refusal never reached the brain, so nil is known
        const line = scene.run.stdout
          .split('\n')
          .find((one) => one.includes('arch-smell-scopeleaks'));
        expect(line).toContain('$0');
        expect(line).not.toContain('absent');
      });

      then('a tree that never reviewed is counted, never dropped', () => {
        expect(scene.run.stdout).toContain('2 walked');
        expect(scene.run.stdout).toContain('1 never reviewed');
      });

      then('the route is recovered and keyed tree-relative', () => {
        expect(scene.run.stdout).toContain('.behavior/v2026_09_18.feat-demo');
        expect(scene.run.stdout).not.toContain('../');
      });

      then('the whole report renders as the human sees it', () => {
        expect(
          asStableRoot({ stdout: scene.run.stdout, root: scene.root }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] the grove is priced as json', () => {
      // the cli is SPAWNED ONCE and its stdout shared. this closure once ran
      // `runCli` on every call, and eight adjacent assertions called it — so one
      // report cost eight full grove walks, each a fresh `node -e` child process
      // that re-walked the filesystem (rule.forbid.redundant-expensive-operations).
      // every sibling `when` in this file already wraps its single `runCli` in
      // `useBeforeAll`; this block was the one that did not.
      //
      // the de-duplication also makes the assertions HONEST: eight separate
      // walks are eight separate reports, so `census`, `cost`, and the snapshot
      // were each graded against a different document. they now describe one.
      //
      // `asJson` survives as a parse of that one stdout — the spawn was the
      // expensive half, and a parse per call site keeps every reader below
      // unchanged
      const run = useBeforeAll(async () =>
        runCli({
          cwd: scene.root,
          args: ['--of', 'grove', '--at', scene.root, '--json'],
        }),
      );
      const asJson = (): ReturnType<typeof JSON.parse> =>
        JSON.parse(run.stdout);

      then('🔴 the status stream stays OFF the json document', () => {
        // the clamp that makes the stderr choice a decision rather than an accident.
        // the walk reports its progress while it runs (`rule.require.status-feedback`),
        // and `--json` writes a document a consumer pipes into `jq` — so the two
        // must never share a stream. one progress line on stdout and this parse
        // throws, which is why the purity is named here rather than left to the
        // incidental throw inside `asJson()` below
        expect(() => JSON.parse(run.stdout)).not.toThrow();
        expect(run.stdout).not.toContain('🦉');
        expect(run.stdout).not.toContain('folded');

        // and the status did not vanish to buy that purity — it moved
        expect(run.stderr).toContain('└─ folded');
      });

      then('🔴 and the CACHE SEAM legends the grove census too', () => {
        // the grove folds every run's per-input census into one `inputs.sections`,
        // so the same "which half do we pay for twice?" question is askable at this
        // breadth — and a consumer who pipes it needs the same legend, from the
        // same constant, never re-typed on their side
        const report = asJson();
        expect(report.seam).toEqual(IS_CACHEABLE_SECTION);
        expect(Object.keys(report.seam).sort()).toEqual(
          Object.keys(report.inputs.sections).sort(),
        );
      });

      then('an unknown run carries null spend, never a zero', () => {
        // the same law one layer down, in the DATA rather than the render: a
        // consumer of --json must not read a `USD 0` nobody measured
        const report = asJson();
        const unknownLane = report.byReviewer.find(
          (row: { key: string }) => row.key === 'mech-failhides',
        );
        expect(unknownLane.census).toEqual({
          metered: 0,
          refused: 0,
          unknown: 1,
        });
        expect(unknownLane.cost).toEqual(null);
      });

      then('a refused run carries a KNOWN nil, never an absence', () => {
        const report = asJson();
        const refusedLane = report.byReviewer.find(
          (row: { key: string }) => row.key === 'arch-smell-scopeleaks',
        );
        expect(refusedLane.cost).not.toEqual(null);
      });

      then('the census in json matches the census on stdout', () => {
        const report = asJson();
        expect(report.census).toEqual({ metered: 1, refused: 1, unknown: 1 });
        expect(report.runsFound).toEqual(3);
      });

      then(
        '🔴 an unknown run is EXCLUDED from the total, never summed as a nil',
        () => {
          // the two clamps above assert how an unknown run RENDERS. this one asserts
          // what it does to the ARITHMETIC, which is the half a render cannot show:
          // the grove holds 3 runs and exactly ONE could account for its spend, so
          // the total must equal that one lane's cost. a refusal adds a known zero;
          // an unknown adds no addend at all
          const report = asJson();
          const meteredLane = report.byReviewer.find(
            (row: { key: string }) => row.key === 'repo-rules',
          );
          expect(report.cost).toEqual(meteredLane.cost);
        },
      );

      then('the cache share is taken over PROMPT tokens', () => {
        // the denominator, asserted where a percentage cannot show it: input 400k
        // + cache.set 0 + cache.get 100k = 500k prompt tokens, so the rate is 0.2.
        // an input-only denominator would read 0.25
        const report = asJson();
        expect(report.rateOfCacheHit).toEqual(0.2);
      });

      then('the grove json payload renders as a consumer receives it', () => {
        // every step of this journey carries a snapshot, this one included
        // (rule.require.snapshot-every-journey-step). the field assertions above
        // pin the FIGURES a reader came for; only the snapshot shows the SHAPE —
        // which keys exist, how the four rollup axes nest, what a `null` cost
        // looks like on the wire. a consumer builds against the shape, so a
        // silent key rename breaks every one of them and no assertion above
        // would go red
        expect(
          asStableRoot({
            stdout: JSON.stringify(asJson(), null, 2),
            root: scene.root,
          }),
        ).toMatchSnapshot();
      });
    });

    when('[t2] the grove is priced with --limit', () => {
      // `--limit` is advertised in `--help` and bounds the RENDER, never the scan.
      // a flag a published surface names and no test exercises is a claim with no
      // clamp under it — so the bound and its disclosure are both asserted here.
      //
      // this asserts only the half that is SETTLED. whether `--limit` should also
      // bound the SCAN is reserved to `F2`, and the assertions below hold either way
      const run = useBeforeAll(async () =>
        runCli({
          cwd: scene.root,
          args: ['--of', 'grove', '--at', scene.root, '--limit', '1'],
        }),
      );

      then('it bounds each axis to the asked-for row count', () => {
        // the corpus carries 3 reviewer lanes; one survives the bound
        expect(run.stdout).toContain('repo-rules');
        expect(run.stdout).not.toContain('mech-failhides');
        expect(run.stdout).not.toContain('arch-smell-scopeleaks');
      });

      then(
        '🔴 it DISCLOSES what the bound cut, never truncates in silence',
        () => {
          // the same law the grades obey, at the row level: a report that quietly
          // dropped 2 of 3 lanes reads as a complete one, and the reader cannot tell.
          // `--limit` is a render bound, so it must say what it withheld
          expect(run.stdout).toContain('… and 2 more');
        },
      );

      then('the richest row is the one kept, never an arbitrary one', () => {
        // the rollups sort richest-first, so a bound keeps the rows a reader came
        // for. `repo-rules` is the only lane whose spend could be measured at all
        const lines = run.stdout.split('\n');
        const reviewerHeader = lines.findIndex((one) =>
          one.includes('by reviewer'),
        );
        expect(lines[reviewerHeader + 1]).toContain('repo-rules');
      });

      then('the bounded render is snapped as the human sees it', () => {
        // the journey's other unsnapped step. the assertions above pin WHICH
        // rows survive and THAT a disclosure line exists; only the snapshot shows
        // where the `… and 2 more` sits, how it is indented, and whether a bound
        // that cut two axes still reads as a coherent report. a dropped
        // disclosure line would leave every assertion above green
        expect(
          asStableRoot({ stdout: run.stdout, root: scene.root }),
        ).toMatchSnapshot();
      });
    });

    when('[t3] the grove is priced with a --limit that is not a count', () => {
      // the failhide this forbids, and it is this branch's own defect class:
      // `--limit abc` once parsed to `Number('abc')` = NaN, and NaN poisons BOTH
      // halves of the render in the same direction —
      //   `rows.slice(0, NaN)`       => []      , so every axis renders EMPTY
      //   `rows.length > NaN`        => false   , so the `… and N more` line is absent
      // a grove with 3 lanes rendered as a bare title with no rows and no
      //   disclosure. the report did not fail; it reported a corpus that does not
      //   exist. `--limit 0` and `--limit -5` land in the same place.
      //
      // a bad flag value must be caught at parse, with the valid set named
      // (rule.prefer.prevent-over-correct, rule.require.errors-name-the-fix)
      const run = useBeforeAll(async () =>
        runCli({
          cwd: scene.root,
          args: ['--of', 'grove', '--at', scene.root, '--limit', 'abc'],
        }),
      );

      then('🔴 it REFUSES, rather than render an empty grove', () => {
        expect(run.exitCode).toEqual(2);
        expect(run.stdout).not.toContain('by tree');
      });

      then('the error names the value, the bound, and the fix', () => {
        expect(run.stderr).toContain('--limit "abc" is not a row count');
        expect(run.stderr).toContain('valid: a whole number, 1 or greater');
        expect(run.stderr).toContain('fix:');
      });

      then('the refusal renders whole', () => {
        // the three assertions above pin three substrings; this puts the WHOLE
        // block in front of a reviewer, so a reflow, a lost hint line, or a
        // changed glyph shows in the diff (rule.require.snapshot-every-journey-step)
        expect(
          asStableRefusal({ stderr: run.stderr, roots: [scene.root] }),
        ).toMatchSnapshot();
      });
    });

    when('[t4] the grove is priced with --limit 0', () => {
      // the same failhide by a different door, and the one a reader is likeliest to
      // type by accident: `0` is a perfectly good number, and it renders every axis
      // empty with no disclosure. so the guard is on the RANGE, never merely on NaN
      const run = useBeforeAll(async () =>
        runCli({
          cwd: scene.root,
          args: ['--of', 'grove', '--at', scene.root, '--limit', '0'],
        }),
      );

      then(
        '🔴 it REFUSES — a bound of zero renders a grove that is not empty',
        () => {
          expect(run.exitCode).toEqual(2);
          expect(run.stderr).toContain('--limit "0" is not a row count');
        },
      );

      then('the refusal renders whole', () => {
        // snapped beside [t3]'s so a reader can see the two refusals are the SAME
        // shape with a different value — which is the claim this step makes
        expect(
          asStableRefusal({ stderr: run.stderr, roots: [scene.root] }),
        ).toMatchSnapshot();
      });
    });

    when('[t4b] the grove is priced with --limit beside --json', () => {
      // `--json` emits the whole report, so a `--limit` beside it bounded
      // naught — `--limit 1 --json` printed every row, accepted and inert. the
      // same silent no-op `--limit` is already refused for at `run` and `tree`
      const run = useBeforeAll(async () =>
        runCli({
          cwd: scene.root,
          args: ['--of', 'grove', '--at', scene.root, '--json', '--limit', '1'],
        }),
      );

      then('🔴 it REFUSES, rather than emit an unbounded document', () => {
        expect(run.exitCode).toEqual(2);
        expect(run.stdout).not.toContain('byTree');
        expect(run.stderr).toContain('--limit is not a flag --json takes');
      });

      then('the refusal renders whole', () => {
        expect(
          asStableRefusal({ stderr: run.stderr, roots: [scene.root] }),
        ).toMatchSnapshot();
      });
    });

    when('[t4c] the tree is priced with --trace beside --json', () => {
      // the twin of [t4b], and the clamp for i015 r024 nitpick.2: `--json` never
      // reads `trace`, so the flag rode accepted and inert
      const run = useBeforeAll(async () =>
        runCli({
          cwd: scene.root,
          args: [
            '--of',
            'tree',
            '--at',
            path.join(scene.root, 'repo.beav.feat-demo'),
            '--json',
            '--trace',
          ],
        }),
      );

      then(
        '🔴 it REFUSES, rather than emit a report the flag never shaped',
        () => {
          expect(run.exitCode).toEqual(2);
          expect(run.stderr).toContain('--trace is not a flag --json takes');
          expect(run.stdout).toEqual('');
        },
      );

      then('the refusal renders whole', () => {
        expect(
          asStableRefusal({ stderr: run.stderr, roots: [scene.root] }),
        ).toMatchSnapshot();
      });
    });

    when('[t5] the grove is priced from INSIDE a tree, with no --at', () => {
      // `--help` publishes `--at <dir>  where to read (run/tree: cwd · grove:
      // the parent of cwd)`, and every prior case passes `--at` by hand — so the
      // DEFAULT half of that published contract had no clamp at all. a published
      // default is a contract, and an unclamped one can walk the wrong root while
      // the render still looks perfectly well-formed.
      //
      // this is also the REAL invocation: a driver stands in their worktree and
      // types `rhx review._.cost --of grove`. they never pass `--at`
      const run = useBeforeAll(async () =>
        runCli({
          cwd: path.join(scene.root, 'repo.beav.feat-demo'),
          args: ['--of', 'grove'],
        }),
      );

      then('it exits clean AND speaks its status on stderr', () => {
        expectGroveExitedCleanAndSpoke({ run });
      });

      then(
        '🔴 the default reaches the SAME corpus the explicit --at did',
        () => {
          // the assertion that makes this a clamp rather than a smoke test: the
          // census here must equal `[t0]`'s, which was read with `--at <root>`.
          // a default that resolved one directory too high or too low would find
          // a DIFFERENT corpus and still render a tidy report
          expect(run.stdout).toContain('3 found');
          expect(run.stdout).toContain('1 metered');
          expect(run.stdout).toContain('1 refused');
          expect(run.stdout).toContain('1 unknown');
          expect(run.stdout).toContain('2 walked');
        },
      );

      then('the whole report renders as the human sees it', () => {
        // this is the REAL invocation — a driver in their worktree with no
        // `--at`. the five counts above prove the corpus; the snapshot proves the
        // RENDER, which is the half a count can never reach
        expect(
          asStableRoot({ stdout: run.stdout, root: scene.root }),
        ).toMatchSnapshot();
      });
    });

    when('[t6] a tree is priced with an explicit --at', () => {
      // the mirror of [t5]: `--at` rides the WHOLE `--of` axis per `--help`, and at
      // run/tree breadth only its DEFAULT (cwd) was ever exercised. so the flag had
      // a clamp at one position and a default at the other two, and no case proved
      // that `--at` overrides cwd at all
      const run = useBeforeAll(async () =>
        runCli({
          cwd: scene.root,
          args: [
            '--of',
            'tree',
            '--at',
            path.join(scene.root, 'repo.beav.feat-demo'),
          ],
        }),
      );

      then('it exits clean and reads the tree that --at named', () => {
        expect(run.stderr).toEqual('');
        expect(run.exitCode).toEqual(0);
        // cwd is the grove ROOT, which carries no review log of its own. so a
        // run that ignored `--at` would report an empty corpus — these 3 runs can
        // only have come from the directory the flag named
        expect(run.stdout).toContain('3');
      });

      then('🔴 the honesty census survives the override', () => {
        // the grades carry the weight here, and a wrong root would render its own
        // (empty) census just as confidently
        expect(run.stdout).toContain('1 metered');
        expect(run.stdout).toContain('1 refused');

        // ONE grade, ONE word, across every value of `--of`. `genReviewMeterStdout.test.ts`
        // carries the clamp that keeps this word matched to the grove census.
        expect(run.stdout).toContain('1 unknown 🟡');
        expect(run.stdout).not.toContain('unmetered');
      });

      then('the tree rollup renders as the human sees it', () => {
        // the mirror of [t5]'s snapshot: same journey, the other end of the `--at`
        // axis, so a reader can diff the two renders side by side
        expect(
          asStableRoot({
            stdout: run.stdout,
            root: path.join(scene.root, 'repo.beav.feat-demo'),
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case3] a corpus that has never run a review', () => {
    const scene = useBeforeAll(async () => {
      const root = genTempDir({ slug: 'review-cost-cli-case3' });
      fs.mkdirSync(path.join(root, 'repo.beav.feat-quiet'), {
        recursive: true,
      });
      // a SECOND shape of empty, and it takes a different branch. above, the
      // log dir is wholly ABSENT, so `getAllEntriesInDir` answers `null`. here it
      // is PRESENT and holds zero runs, so it answers `[]` — and `null` vs `[]`
      // is exactly the seam a reader would expect to be conflated
      const rootEmptied = genTempDir({ slug: 'review-cost-cli-case3-emptied' });
      const treeEmptied = path.join(rootEmptied, 'repo.beav.feat-swept');
      fs.mkdirSync(path.join(treeEmptied, '.log', 'bhrain', 'review'), {
        recursive: true,
      });
      return {
        root,
        rootEmptied,
        treeEmptied,
        runOfRun: runCli({ cwd: root, args: ['--of', 'run'] }),
        runOfTree: runCli({ cwd: root, args: ['--of', 'tree'] }),
        runOfGrove: runCli({
          cwd: root,
          args: ['--of', 'grove', '--at', root],
        }),
        emptiedOfTree: runCli({ cwd: treeEmptied, args: ['--of', 'tree'] }),
        emptiedOfGrove: runCli({
          cwd: rootEmptied,
          args: ['--of', 'grove', '--at', rootEmptied],
        }),
      };
    });

    when('[t0] each breadth is asked of an empty corpus', () => {
      then('every one exits 2 — a caller-must-fix constraint', () => {
        // an empty corpus is a FACT, not a malfunction: the caller pointed at a
        // place where no review ran (rule.require.exit-code-semantics)
        expect(scene.runOfRun.exitCode).toEqual(2);
        expect(scene.runOfTree.exitCode).toEqual(2);
        expect(scene.runOfGrove.exitCode).toEqual(2);
      });

      then('every one names the FIX, never only the symptom', () => {
        expect(scene.runOfRun.stderr).toContain('fix:');
        expect(scene.runOfTree.stderr).toContain('fix:');
        expect(scene.runOfGrove.stderr).toContain('fix: point --at');
      });

      then(
        'the grove refusal sits one blank row below its progress block, as a barred read does',
        () => {
          // the refusal opens with its own blank; a second blank stacked ahead of it
          // parted this refusal from its barred peer (rule.forbid.snapshot-visual-blemishes)
          expect(scene.runOfGrove.stderr).toContain('\n\n🦉 woah there');
          expect(scene.runOfGrove.stderr).not.toContain('\n\n\n🦉 woah there');
        },
      );

      then(
        'none reports a figure at all, rather than a corpus of zeroes',
        () => {
          // the failhide this forbids: a $0.00 total would read as "this machine
          // spent naught on reviews", which is a measurement nobody made
          expect(scene.runOfRun.stdout.trim()).toEqual('');
          expect(scene.runOfTree.stdout.trim()).toEqual('');
          expect(scene.runOfGrove.stdout.trim()).toEqual('');
        },
      );

      // the three refusals are SNAPPED, one per breadth, not merely asserted.
      // `toContain('fix:')` above cannot see whether the fix still names a
      // runnable command, whether the hint survived, or whether the tree still
      // aligns — so a reword of any of it would ship with this suite green
      // (rule.require.contract-snapshot-exhaustiveness).
      then('the run refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({
            stderr: scene.runOfRun.stderr,
            roots: [scene.root],
          }),
        ).toMatchSnapshot();
      });

      then('the tree refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({
            stderr: scene.runOfTree.stderr,
            roots: [scene.root],
          }),
        ).toMatchSnapshot();
      });

      then('the grove refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({
            stderr: scene.runOfGrove.stderr,
            roots: [scene.root],
          }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] the log root is PRESENT and holds zero runs', () => {
      then('🔴 it refuses exactly as an ABSENT one does', () => {
        // .why = the two reach the refusal by different branches — an absent dir
        //        answers `null`, an emptied one answers `[]` — and only one of
        //        the two was ever asserted. a `[]` that slipped past the refusal
        //        would render a corpus of zeroes, which is the one output this
        //        command exists to never print (rule.forbid.failhide)
        expect(scene.emptiedOfTree.exitCode).toEqual(2);
        expect(scene.emptiedOfTree.stdout.trim()).toEqual('');
        expect(scene.emptiedOfTree.stderr).toContain('fix:');
      });

      then('and the grove above it reports no priceable tree', () => {
        // the container half. `getAllReviewTrees` counts a tree by whether its
        // log dir is PRESENT, so an emptied one is the case where "a tree was
        // found" and "a run was found" part ways
        expect(scene.emptiedOfGrove.exitCode).toEqual(2);
        expect(scene.emptiedOfGrove.stdout.trim()).toEqual('');
        expect(scene.emptiedOfGrove.stderr).toContain('fix: point --at');
      });

      // and BOTH emptied-root refusals are snapped beside the absent-root ones
      // above — so a reviewer can read the two branches side by side and see for
      // themselves that `null` and `[]` refuse identically, which is the whole
      // claim of this `when` and the one an assertion cannot show
      then('the emptied-tree refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({
            stderr: scene.emptiedOfTree.stderr,
            roots: [scene.treeEmptied, scene.rootEmptied],
          }),
        ).toMatchSnapshot();
      });

      then('the emptied-grove refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({
            stderr: scene.emptiedOfGrove.stderr,
            roots: [scene.treeEmptied, scene.rootEmptied],
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case4] a human who does not name a breadth', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'review-cost-cli-case4' });
      return {
        absent: runCli({ cwd }),
        unknown: runCli({ cwd, args: ['--of', 'fleet'] }),
        retiredMeter: runCli({ cwd, args: ['--of', 'meter'] }),
        retiredCorpus: runCli({ cwd, args: ['--of', 'corpus'] }),
        typo: runCli({ cwd, args: ['--of', 'treee'] }),
      };
    });

    when('[t0] --of is absent', () => {
      then('it exits 2 rather than pick a breadth for the human', () => {
        // the three breadths read three different corpora at three different
        // costs, so a default would silently pick one — and the wrong one walks
        // every tree on the machine
        expect(scene.absent.exitCode).toEqual(2);
      });

      then('it lists the valid positions, so the axis is discoverable', () => {
        // rule.require.discoverability: an error that rejects input must name the
        // valid options, never merely report the rejection
        expect(scene.absent.stderr).toContain('run | tree | grove');
      });

      then(
        'it names each position, so a reader can choose without docs',
        () => {
          expect(scene.absent.stderr).toContain('ONE review invocation');
          expect(scene.absent.stderr).toContain(
            "this worktree's review history",
          );
          expect(scene.absent.stderr).toContain('every tree on this machine');
        },
      );

      then('it offers a copy-paste fix', () => {
        expect(scene.absent.stderr).toContain('rhx review._.cost --of tree');
      });

      // the axis-discovery block is what a new human meets FIRST, and it is
      // the densest treestruct this command emits — four assertions above reach
      // four of its lines and see none of its shape. snapped whole
      then('the absent-breadth refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.absent.stderr }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] --of names a RETIRED surface', () => {
      then('`fleet` is refused — it is a forbidden synonym for `grove`', () => {
        // a human with the old command in muscle memory must be told the new
        // word, never silently served the old behavior
        expect(scene.unknown.exitCode).toEqual(2);
        expect(scene.unknown.stderr).toContain('not a breadth');
      });

      then(
        '🔴 it names what BECAME of their word, not merely the legal set',
        () => {
          // .why = an assertion on `'grove'` alone has NO TEETH — the valid-set
          //        line prints `run | tree | grove` on every refusal, so it passes
          //        whether or not the rename was ever disclosed. the claim under
          //        test is that the message names the SUCCESSOR of the word the
          //        human typed (rule.require.errors-name-the-fix)
          expect(scene.unknown.stderr).toContain('renamed to `grove`');
        },
      );

      then(
        'each retired word gets its OWN answer, never one generic line',
        () => {
          // the three retirements resolve three different ways: `fleet` was
          // renamed across one axis position, `meter` was renamed AND lost its
          // breadth from the name, `corpus` was deleted outright. a single
          // "that name is retired" line would hide which happened
          expect(scene.retiredMeter.stderr).toContain('renamed to `tree`');
          expect(scene.retiredMeter.stderr).not.toContain('renamed to `grove`');
          expect(scene.retiredCorpus.exitCode).toEqual(2);
          expect(scene.retiredCorpus.stderr).toContain('deleted');
          expect(scene.retiredCorpus.stderr).not.toContain('renamed to');
        },
      );

      // the two retirement refusals are snapped SEPARATELY, because the claim
      // above is that they DIFFER — `fleet` was renamed across one axis position,
      // `meter` was renamed and lost its breadth from the name. two snapshots put
      // that difference in the diff; two `toContain`s only prove two substrings
      then('the `fleet` refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.unknown.stderr }),
        ).toMatchSnapshot();
      });

      then('the `meter` refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.retiredMeter.stderr }),
        ).toMatchSnapshot();
      });

      then('the `corpus` refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.retiredCorpus.stderr }),
        ).toMatchSnapshot();
      });
    });

    when('[t2] --of is a plain TYPO, not a retired word', () => {
      then(
        '🔴 it gets no rename hint — there is no word to have become one',
        () => {
          // .why = the discriminator. a retired name and a typo are different
          //        facts: the first earns a successor, the second earns only the
          //        valid set. to answer both alike would either strand the human
          //        who repeated a real word, or invent a history for a slip
          expect(scene.typo.exitCode).toEqual(2);
          expect(scene.typo.stderr).toContain('not a breadth');
          expect(scene.typo.stderr).not.toContain('was:');
        },
      );

      then('it still lists the valid positions', () => {
        expect(scene.typo.stderr).toContain('run | tree | grove');
      });

      // the typo refusal is snapped BESIDE the two retirement refusals above,
      // so the discriminator is visible rather than argued: a reviewer reads the
      // three blocks in one diff and sees which one carries a successor line
      then('the typo refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.typo.stderr }),
        ).toMatchSnapshot();
      });
    });

    when('[t3] the refusal is read BESIDE --help', () => {
      /**
       * the clamp `[t0]` could not be. `[t0]` asserts the refusal contains
       * `"this worktree's review history"` — and it passed while the refusal
       * printed exactly that and `--help` printed that PLUS ", rolled up by
       * reviewer, stone, round". a prefix assertion cannot see a dropped
       * suffix, so both surfaces drifted with a green suite over them.
       *
       * the claim under test is not "each surface names the axis" but
       *   "the two surfaces name it the SAME WAY" — which is the only form
       *   that goes red when one of them is re-inlined and edited alone.
       */
      const help = useBeforeAll(async () =>
        runCli({
          cwd: genTempDir({ slug: 'review-cost-cli-case4-help' }),
          args: ['--help'],
        }),
      );

      then(
        '🔴 every breadth reads IDENTICALLY in help and in the refusal',
        () => {
          // the full sentences, as one source now renders them. a re-inline that
          // drops a clause fails here and passes every `toContain` above
          // these are GOLDEN literals, deliberately not read off the source
          // const. to import it would test that the two surfaces AGREE and say
          // naught about what they agree on — so a clause silently deleted from
          // the one source would change both surfaces in step and stay green
          // here. written out, an edit to the axis reds this case and must be
          // mirrored by hand, which is the conscious step the clamp exists for.
          const DESCRIPTIONS = [
            'ONE review invocation — its cost AND what its prompt was made of',
            "this worktree's review history, rolled up by reviewer, level, stone, round",
            'every tree on this machine, rolled up by tree, route, stone, reviewer',
          ];
          for (const description of DESCRIPTIONS) {
            expect(help.stdout).toContain(description);
            expect(scene.absent.stderr).toContain(description);
          }
        },
      );

      then('🟡 and the refusal stays aligned as a tree', () => {
        // the descriptions render through `padEnd`, so a longer breadth word
        // would silently shear the column (rule.require.treestruct-output)
        const rows = scene.absent.stderr
          .split('\n')
          .filter((line) => /^ {3}├─ (run|tree|grove):/.test(line));
        expect(rows).toHaveLength(3);
        const offsets = rows.map((row) => row.indexOf(':') + 1);
        // every description starts at one column, whatever its word's length
        const starts = rows.map(
          (row, index) =>
            row.slice(offsets[index]!).search(/\S/) + offsets[index]!,
        );
        expect(new Set(starts).size).toEqual(1);
      });

      then('and the HELP surface renders whole', () => {
        // the two `then`s above assert that help and the refusal AGREE, and that
        //    the refusal aligns. neither looks at help's own layout, so a `--help`
        //    that rendered the three axes as one run-on line — with the right words
        //    in the right order — passes both. the refusal is already snapped at
        //    [t0]; this is its twin (rule.require.contract-snapshot-exhaustiveness)
        expect(help.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case5] a human who asks the command to explain itself', () => {
    const run = useBeforeAll(async () =>
      runCli({
        cwd: genTempDir({ slug: 'review-cost-cli-case5' }),
        args: ['--help'],
      }),
    );

    when('[t0] --help is passed', () => {
      then('it exits clean rather than read anything', () => {
        expect(run.exitCode).toEqual(0);
      });

      then('help states usage, every input, and an example', () => {
        // rule.require.help-on-demand: usage + inputs + a copy-paste example
        expect(run.stdout).toContain('  usage\n');
        expect(run.stdout).toContain('--of <breadth>');
        expect(run.stdout).toContain('--at <dir>');
        expect(run.stdout).toContain('--limit <n>');
        expect(run.stdout).toContain('--json');
        expect(run.stdout).toContain('  examples\n');
      });

      then('help teaches the axis, not merely the flags', () => {
        expect(run.stdout).toContain('  the axis\n');
        expect(run.stdout).toContain('--of run');
        expect(run.stdout).toContain('--of tree');
        expect(run.stdout).toContain('--of grove');
      });

      then('help teaches the three grades, so a figure is read right', () => {
        expect(run.stdout).toContain('metered');
        expect(run.stdout).toContain('refused');
        expect(run.stdout).toContain('unknown');
      });

      then(
        'help states "which input bought this?" at all three breadths',
        () => {
          // every breadth now answers it, so the help must not name a gap that
          // has closed. a stale "NOT answered" would send a reader away from the
          // tree census that ships (rule.forbid.surprises)
          expect(run.stdout).toContain('answered at all three breadths');
          expect(run.stdout).not.toContain('NOT answered');
          expect(run.stdout).not.toContain('a named gap');
        },
      );

      then(
        '🔴 help states the bound each roll-up carries, and where the locus lives',
        () => {
          // a roll-up attributes only the prompts it could read, so the help names
          // the unread count beside it; and the per-directory locus covers only
          // the runs that recorded it, which the help must say rather than let a
          // reader mistake a partial sum for the whole
          expect(run.stdout).toContain(
            "--of tree    by input, summed over this tree's runs",
          );
          expect(run.stdout).toContain(
            "--of grove   by input, summed over every tree's runs",
          );
          expect(run.stdout).toContain('unread');
          expect(run.stdout).toContain(
            'the runs that recorded where their target mass came from',
          );
          expect(run.stdout).not.toContain('they stay at --of run');
        },
      );

      then('🔴 help names no warmer — the lever was retired', () => {
        // a lapse names its own cure now, a shorter pause between rounds; a help
        // text that still taught `--warmer` would send a reader to a flag that refuses
        expect(run.stdout).not.toMatch(/warmer/i);
        expect(run.stdout).toContain('a shorter pause between rounds holds it');
      });

      then(
        'help carries no decorative circle, and no section header ends in a colon',
        () => {
          // every circle was noise a reader learned to skip, so a later one would
          // be skipped too
          const lines = run.stdout.split('\n');
          const circled = lines.filter((line) => /🔴|🟡/.test(line));
          expect(circled).toEqual([]);
          const headers = lines.filter((line) => /^ {2}\S.*:$/.test(line));
          expect(headers).toEqual([]);
        },
      );

      then('the help text renders as the human sees it', () => {
        expect(run.stdout).toMatchSnapshot();
      });
    });
  });

  given('[case6] a human who types a flag and forgets its value', () => {
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'review-cost-cli-case6' });
      return {
        atBare: runCli({ cwd, args: ['--of', 'tree', '--at'] }),
        atSwallows: runCli({ cwd, args: ['--at', '--of', 'tree'] }),
        limitBare: runCli({ cwd, args: ['--of', 'grove', '--limit'] }),
        ofBare: runCli({ cwd, args: ['--of'] }),
        // the three shapes that once ran CLEAN. `--limit` was read after the
        // run/tree early returns, so at those two breadths it was never
        // validated and never used — accepted in silence, whole or malformed
        limitAtRunMalformed: runCli({
          cwd,
          args: ['--of', 'run', '--limit', 'abc'],
        }),
        limitAtTreeBare: runCli({ cwd, args: ['--of', 'tree', '--limit'] }),
        limitAtTreeWellFormed: runCli({
          cwd,
          args: ['--of', 'tree', '--limit', '25'],
        }),
      };
    });

    when('[t0] --at is typed with no value', () => {
      then('it exits 2 rather than silently price the cwd', () => {
        // the failhide this clamps: `--at` read as `null`, and `null` fell
        // through `at ?? process.cwd()` to the default — so the command priced
        // the current directory while the human had plainly asked for another
        // one, and no line of output said so. an OMITTED flag may default; a
        // flag typed with its value forgotten may not (rule.forbid.failhide)
        expect(scene.atBare.exitCode).toEqual(2);
        expect(scene.atBare.stderr).toContain('--at was given with no value');
      });

      then('it names the fix, not merely the symptom', () => {
        // rule.require.errors-name-the-fix
        expect(scene.atBare.stderr).toContain('expects: a directory');
        expect(scene.atBare.stderr).toContain('--at ../other-worktree');
      });

      // `exitOnValuelessFlag` promises ONE shape for the three flags, so the
      // three refusals are snapped together (`--at` here, `--limit` and `--of`
      // below). that promise is a claim about their SHAPE, and three assertions
      // on three different substrings cannot grade a shape at all
      then('the valueless --at refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.atBare.stderr }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] --at is typed just before another flag', () => {
      then('the neighbour flag is not swallowed as a directory name', () => {
        // without the `--` check, `--at --of tree` reads `"--of"` as a
        // directory, AND the breadth flag vanishes — so the command fails
        // later, elsewhere, and names the wrong cause
        expect(scene.atSwallows.exitCode).toEqual(2);
        expect(scene.atSwallows.stderr).toContain(
          '--at was given with no value',
        );
      });

      // snapped beside `[t0]`'s, because the claim is that the SWALLOW case
      // resolves to the same refusal — and two identical snapshots prove it
      // where two `toContain`s on one substring do not
      then(
        'the swallowed-neighbour refusal renders as the human sees it',
        () => {
          expect(
            asStableRefusal({ stderr: scene.atSwallows.stderr }),
          ).toMatchSnapshot();
        },
      );
    });

    when('[t2] --limit is typed with no value', () => {
      then('it exits 2 rather than fall back to the default row count', () => {
        expect(scene.limitBare.exitCode).toEqual(2);
        expect(scene.limitBare.stderr).toContain(
          '--limit was given with no value',
        );
      });

      then('the valueless --limit refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.limitBare.stderr }),
        ).toMatchSnapshot();
      });
    });

    when('[t3] --of is typed with no value', () => {
      then('the slip is named as a slip, not as an absent flag', () => {
        // `--of` absent and `--of` valueless are different facts and must not
        // render alike: the first is "you have not chosen yet", the second is
        // "you meant to choose and the word did not land"
        expect(scene.ofBare.exitCode).toEqual(2);
        expect(scene.ofBare.stderr).toContain('--of was given with no value');
        expect(scene.ofBare.stderr).not.toContain('--of is required');
      });

      then('it still lists the valid positions', () => {
        expect(scene.ofBare.stderr).toContain('run | tree | grove');
      });

      // and this one snapped BESIDE `[case4][t0]`'s absent-`--of` refusal is
      // what makes the two-facts claim checkable: *"you have not chosen yet"* and
      // *"the word did not land"* must read differently, and only two snapshots
      // side by side in a diff can show that they do
      then('the valueless --of refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.ofBare.stderr }),
        ).toMatchSnapshot();
      });
    });

    when('[t4] --limit is carried by a breadth that has no rows', () => {
      /**
       * `--limit` was read AFTER the run/tree early returns, so at those two
       * breadths it was accepted and discarded — three shapes, all exit 0:
       *
       *   --of run  --limit abc   never validated
       *   --of tree --limit       never reached `exitOnValuelessFlag`
       *   --of tree --limit 25    well-formed, and bounded naught
       *
       * .why = the third is the one a sweep for "malformed input" misses, and
       *        it is the one a driver actually types. a flag accepted with no
       *        effect and no word said is the same failhide class as a figure
       *        printed over a corrupt measurement — the command claims to have
       *        honored an instruction it discarded.
       *
       * .note = `exitOnValuelessFlag`'s own doc promises *"one shape for the
       *         three flags, so a malformed input fails the same way whichever
       *         flag carried it"*. it held for `--of grove` alone.
       */
      then('🔴 a malformed --limit fails at run, as it does at grove', () => {
        expect(scene.limitAtRunMalformed.exitCode).toEqual(2);
      });

      // the run refusal carries its own `why` clause, so it is a distinct block
      // from the tree refusal snapped below — each breadth pins its own bytes
      then('the limit-not-for-run refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.limitAtRunMalformed.stderr }),
        ).toMatchSnapshot();
      });

      then('🔴 a valueless --limit fails at tree, as it does at grove', () => {
        expect(scene.limitAtTreeBare.exitCode).toEqual(2);
      });

      then('🔴 a WELL-FORMED --limit fails too — it would bound naught', () => {
        // the sharpest of the three: no part of it is malformed, so a check
        // aimed at bad values passes it straight through to a silent no-op
        expect(scene.limitAtTreeWellFormed.exitCode).toEqual(2);
      });

      then('the refusal names the breadth, and what --limit is FOR', () => {
        // rule.require.errors-name-the-fix — a bare "invalid flag" leaves the
        // driver to guess whether the flag is misspelled or misplaced
        expect(scene.limitAtTreeWellFormed.stderr).toContain(
          '--limit is not a flag "--of tree" takes',
        );
        expect(scene.limitAtTreeWellFormed.stderr).toContain(
          'bounds how many ROLLUP ROWS',
        );
        expect(scene.limitAtTreeWellFormed.stderr).toContain(
          '--of grove --limit 25',
        );
      });

      then(
        '🔴 the refusal tells the truth about tree — it rolls up, unbounded',
        () => {
          // a tree DOES roll up by reviewer, level, stone, round (`--help`). a refusal
          // that says it "renders no rollup" teaches a falsehood about the report the
          // driver just read
          expect(scene.limitAtTreeWellFormed.stderr).toContain(
            '--of tree takes no row bound — its rollups render every row',
          );
          expect(scene.limitAtTreeWellFormed.stderr).not.toContain(
            'renders no rollup',
          );
        },
      );

      // the WELL-FORMED case is the one snapped, deliberately: the other two
      // are malformed inputs any check would catch, where this one is legal at
      // every character and still wrong. its refusal is the whole lesson of the
      // `when`, so it is the one that must be legible in a PR diff
      then(
        'the limit-not-for-this-breadth refusal renders as the human sees it',
        () => {
          expect(
            asStableRefusal({ stderr: scene.limitAtTreeWellFormed.stderr }),
          ).toMatchSnapshot();
        },
      );
    });
  });

  given(
    '[case7] a tree WITH reviews, invoked from a nested subdirectory',
    () => {
      /**
       * the convention this clamps is that `--at` defaults to the BARE cwd, with
       * no walk up to the tree root. `emitCostOfRun` and `emitCostOfTree` both read
       * `path.join(cwd, DIR_OF_REVIEW_LOGS)` and stop there.
       *
       * .why = it was UNCLAMPED, so a reader could not tell the convention from an
       *        oversight — and the codebase carries a proven walk-up idiom
       *        (`getRepoRootWithFallback`) it deliberately does not reach for here.
       *        the peer `review.ts` command reads bare `process.cwd()` the same
       *        way, which is the evidence it is a house convention rather than a
       *        regression.
       *
       * .note = the case asserts the refusal is HONEST about it — it must echo the
       *         subdirectory it actually looked in, so a driver can see the reviews
       *         are elsewhere rather than conclude none were ever run
       *         (rule.require.errors-name-the-fix).
       *
       * a walk-up is a live question, not a settled one: `rule.forbid.cwd-outside-gitroot`
       *   says every write lands at the git root, so a nested read looks where the
       *   writer never writes. caught as
       *   `.dream/v2026_09_22.feat.review-cost-reads-the-bare-cwd-where-the-writer-writes-at-gitroot.md`
       *   rather than ridden along, because the change diverges from `review.ts`
       *   and no lane has ruled on the pair.
       */
      const scene = useBeforeAll(async () => {
        const tree = genTempDir({ slug: 'review-cost-cli-case7' });
        setOneTree({ tree });
        const nested = path.join(tree, 'src', 'domain.operations');
        fs.mkdirSync(nested, { recursive: true });
        // the bare root is CAPTURED rather than passed inline, so `[t3]` can
        // render its refusal stable. an uncaptured temp dir carries a timestamp
        // and a random suffix, and a snapshot over it would diff on every run
        const bare = genTempDir({ slug: 'review-cost-cli-case7-bare' });
        return {
          tree,
          bare,
          // the cli reports the REAL path, because a child process's cwd is
          // already de-symlinked by the os before the command ever reads it —
          // while `genTempDir` hands back a symlink. an assertion on `tree` would
          // compare two true names for one dir and read as a defect
          treeReal: fs.realpathSync(tree),
          nested,
          fromRoot: runCli({ cwd: tree, args: ['--of', 'tree'] }),
          fromNested: runCli({ cwd: nested, args: ['--of', 'tree'] }),
          // the SECOND caller of `asRefusalOfAbsentTreeLogs`. `emitCostOfRun` and
          // `emitCostOfTree` each call it on their own, so "the identical code
          // path" is a claim about two call sites rather than one — the exact
          // shape that bit `isTargetDiffSent` at its third, untested site
          fromNestedRun: runCli({ cwd: nested, args: ['--of', 'run'] }),
          // a tree with no reviews of its own AND none above it — the control
          // that parts "a hint was withheld" from "a hint is never printed"
          fromBare: runCli({ cwd: bare, args: ['--of', 'tree'] }),
        };
      });

      when('[t0] the same tree is priced from its root', () => {
        then('it reports the reviews', () => {
          expect(scene.fromRoot.stderr).toEqual('');
          expect(scene.fromRoot.exitCode).toEqual(0);
        });
      });

      when('[t1] the same tree is priced from a subdirectory', () => {
        then('🔴 it refuses — the cwd is read BARE, with no walk up', () => {
          expect(scene.fromNested.exitCode).toEqual(2);
          expect(scene.fromNested.stderr).toContain('no reviews to price');
        });

        then(
          'the refusal names the SUBDIRECTORY it looked in, never the root',
          () => {
            // the honesty half. a refusal that echoed the tree root would assert
            // it looked where the logs are and found none — a lie about a real
            // corpus. it must name the dir it actually read
            expect(scene.fromNested.stderr).toContain(
              path.join('src', 'domain.operations'),
            );
          },
        );

        then('and it names --at as the fix', () => {
          expect(scene.fromNested.stderr).toContain('point --at at a tree');
        });

        then('🔴 it names the TREE whose reviews it found above', () => {
          // .why = `looked in:` alone is honest and unhelpful. the writer is
          //        FORBIDDEN to log anywhere but the git root
          //        (rule.forbid.cwd-outside-gitroot), so a nested read misses by
          //        construction — and the bare refusal advised "run a review here
          //        first" about reviews that had just run
          //        (rule.require.errors-name-the-fix)
          expect(scene.fromNested.stderr).toContain('reviews DID run above');
          expect(scene.fromNested.stderr).toContain(scene.treeReal);
        });

        then('the hint is a COPY-PASTE command, not a direction', () => {
          expect(scene.fromNested.stderr).toContain(
            `rhx review._.cost --of tree --at ${scene.treeReal}`,
          );
        });

        then(
          '🔴 the hint changes no READ — the walk is the refusal, not the lookup',
          () => {
            // the assertion that settles the whole change: the exit code and the
            // `looked in:` line are byte-for-byte what they were before the hint.
            // a walk that fed the READ would have found the logs and exited 0,
            // which is the deferred half (`F10`), not this one
            expect(scene.fromNested.exitCode).toEqual(2);
            expect(scene.fromNested.stdout.trim()).toEqual('');
          },
        );

        // the richest refusal this command emits — a `looked in:` line, a
        // `reviews DID run above` hint, and a copy-paste command that carries the
        // breadth the caller asked for. six assertions above reach six of its
        // substrings and grade none of its layout
        then('the nested-cwd refusal renders as the human sees it', () => {
          expect(
            asStableRefusal({
              stderr: scene.fromNested.stderr,
              roots: [scene.tree, scene.treeReal],
            }),
          ).toMatchSnapshot();
        });
      });

      when('[t2] the SAME subdirectory is priced at `--of run`', () => {
        then('🔴 the hint reaches the second caller too', () => {
          // .why = `asRefusalOfAbsentTreeLogs` has TWO callers, `emitCostOfRun` and
          //        `emitCostOfTree`, and only one was clamped. an extracted
          //        decision binds only the call sites someone wired to it — the
          //        class this branch met three times, and the one place a
          //        "shares the identical code path" claim is checkable
          expect(scene.fromNestedRun.exitCode).toEqual(2);
          expect(scene.fromNestedRun.stderr).toContain('reviews DID run above');
          expect(scene.fromNestedRun.stderr).toContain(scene.treeReal);
        });

        then('🔴 and the copy-paste command names `run`, never `tree`', () => {
          // the discriminator. a hint that hardcoded `tree` would hand a driver
          // at `--of run` a command that answers a DIFFERENT question, which
          // reads as a fix and is a redirect (rule.require.errors-name-the-fix)
          expect(scene.fromNestedRun.stderr).toContain(
            `rhx review._.cost --of run --at ${scene.treeReal}`,
          );
        });

        // snapped beside `[t1]`'s, so the SECOND call site is graded on its
        // whole block rather than on the one word that differs between them
        then(
          'the run-breadth nested refusal renders as the human sees it',
          () => {
            expect(
              asStableRefusal({
                stderr: scene.fromNestedRun.stderr,
                roots: [scene.tree, scene.treeReal],
              }),
            ).toMatchSnapshot();
          },
        );
      });

      when('[t3] a tree with NO reviews anywhere above it is priced', () => {
        then(
          '🔴 no hint is offered — there is naught above to point at',
          () => {
            // the discriminator. a hint printed over an absent corpus would invent
            // a tree, which is the same class of lie the `looked in:` line refuses
            expect(scene.fromBare.exitCode).toEqual(2);
            expect(scene.fromBare.stderr).toContain('no reviews to price');
            expect(scene.fromBare.stderr).not.toContain(
              'reviews DID run above',
            );
          },
        );

        then('the bare refusal renders as the human sees it', () => {
          // the snapshot is STRONGER than the `not.toContain` above, which is
          // why it earns a place beside it rather than replaces it. the
          // assertion refuses ONE phrase; the snapshot pins the whole block, so
          // any hint at all — however reworded — reddens it. an ABSENCE is
          // exactly the claim a `toContain`-shaped check cannot hold, and this
          // `when`'s entire subject is an absence
          // (rule.require.contract-snapshot-exhaustiveness)
          expect(
            asStableRefusal({
              stderr: scene.fromBare.stderr,
              roots: [scene.bare],
            }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[case8] a grove whose by-input census can vouch for only some of its prompts',
    () => {
      /**
       * the honesty caveat at ACCEPTANCE grain, which it had never reached.
       *
       * .why = `UNATTRIBUTED` names the DENOMINATOR every share beneath it was
       *        summed over. without it a reader takes `rules 40%` for a statement
       *        about the grove, where it is a statement about the fraction of the
       *        grove whose census could vouch for itself — the exact
       *        absence-reads-as-a-fact defect this whole report is built to refuse.
       *
       *        it was clamped only in `genReviewGroveStdout.test.ts`, a unit suite
       *        over a hand-built report. so the CARVE was proven and the WALK was
       *        not: no test drove the real cli over a real corpus and showed the
       *        caveat survives the read, the fold, and the render
       *        (rule.require.test-coverage-by-grain — a contract surface owes an
       *        acceptance test, never a unit test on an internal renderer).
       *
       * .note = `[case2]`'s grove renders `absent (no prompt could be read, …)`,
       *         because NO run there is compiled. that is the all-unread branch,
       *         and it is a different claim: it says the census is empty, never
       *         that the census is partial. only a MIXED corpus reaches this one
       */
      const scene = useBeforeAll(async () => {
        const root = genTempDir({ slug: 'review-cost-cli-case8' });
        const tree = path.join(root, 'repo.beav.feat-mixed');
        fs.mkdirSync(tree, { recursive: true });
        const route = '.behavior/v2026_09_18.feat-demo';

        // one run whose census vouches for its own rows
        setOneRun({
          tree,
          name: '2026-09-18T00-00-00-000Z.pid1.aaa',
          route,
          slug: 'repo-rules',
          grade: 'metered',
          input_: 400_000,
          cacheGet: 100_000,
          compiled: true,
          attribution: 'attributed',
        });

        // one whose census read its own rows and could NOT vouch for them
        setOneRun({
          tree,
          name: '2026-09-18T00-00-01-000Z.pid1.bbb',
          route,
          slug: 'mech-failhides',
          grade: 'metered',
          input_: 200_000,
          cacheGet: 50_000,
          compiled: true,
          attribution: 'unattributed',
          // and compiled before the locus row existed — so the grove's locus is
          // weighed against 1 of 2 runs, the partial coverage a real grove carries
          locus: null,
        });

        return {
          root,
          run: runCli({ cwd: root, args: ['--of', 'grove', '--at', root] }),
        };
      });

      when('[t0] the grove is priced over the mixed corpus', () => {
        then('it exits clean AND speaks its status on stderr', () => {
          expectGroveExitedCleanAndSpoke({ run: scene.run });
        });

        then('the by-input census RENDERS, rather than reads absent', () => {
          // the precondition the caveat needs. if this fails, the case stopped
          // to exercise what it was written for, and every assertion below would
          // pass vacuously against an absent block
          expect(scene.run.stdout).toContain('by input');
          expect(scene.run.stdout).not.toContain('no prompt could be read');
        });

        then('🔴 the caveat names its own denominator, out loud', () => {
          expect(scene.run.stdout).toContain(
            '1 of 2 read runs are UNATTRIBUTED',
          );
        });

        then('and the three-way census is stated beside it', () => {
          // THREE counts, never two — `ungraded` is a run that predates the
          // grade, and to fold it into `unattributed` would report a silence as
          // a verdict
          expect(scene.run.stdout).toContain('1 attributed');
          expect(scene.run.stdout).toContain('1 unattributed');
          expect(scene.run.stdout).toContain('0 ungraded');
        });

        then(
          '🔴 the locus names a directory to prune, weighed against the runs that placed it',
          () => {
            // obligation 4 at the contract grain: a reader names WHERE to cut from
            // the default report alone, and the legacy run is counted, never zeroed
            // (rule.require.report-both-cost-levers-with-trend-and-locus)
            expect(scene.run.stdout).toContain(
              'target mass by directory — 49,000 chars over 2 directories, from 1 of 2 read runs',
            );
            expect(scene.run.stdout).toContain('src/domain.operations/invoice');
            // the root-level `blackbox/` file folds to its directory, never to itself
            expect(scene.run.stdout).not.toContain(
              'blackbox/invoice.acceptance.test.ts',
            );
          },
        );

        then('the whole report renders as the human sees it', () => {
          expect(
            asStableRoot({ stdout: scene.run.stdout, root: scene.root }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] every prompt in the grove CAN vouch for itself', () => {
        // the clamp in the other direction, and the one that gives [t0] its
        // teeth: a caveat that fired unconditionally would satisfy [t0] and be
        // worthless. this proves it is the UNATTRIBUTED count that fires it
        const clean = useBeforeAll(async () => {
          const root = genTempDir({ slug: 'review-cost-cli-case8-clean' });
          const tree = path.join(root, 'repo.beav.feat-clean');
          fs.mkdirSync(tree, { recursive: true });
          setOneRun({
            tree,
            name: '2026-09-18T00-00-00-000Z.pid1.aaa',
            route: '.behavior/v2026_09_18.feat-demo',
            slug: 'repo-rules',
            grade: 'metered',
            input_: 400_000,
            cacheGet: 100_000,
            compiled: true,
            attribution: 'attributed',
          });
          return {
            root,
            run: runCli({ cwd: root, args: ['--of', 'grove', '--at', root] }),
          };
        });

        then('no caveat fires', () => {
          expect(clean.run.stdout).not.toContain('UNATTRIBUTED');
        });

        then('and the census still states all three counts', () => {
          expect(clean.run.stdout).toContain('1 attributed');
          expect(clean.run.stdout).toContain('0 unattributed');
          expect(clean.run.stdout).toContain('0 ungraded');
        });

        then('the caveat-free report renders whole', () => {
          // an ABSENCE assertion cannot show a reader what they DO get, so this
          // step is exactly the one a `not.toContain` leaves unreadable. snapped
          // beside [t0]'s so the two are diffable: same journey, caveat vs none
          expect(
            asStableRoot({ stdout: clean.run.stdout, root: clean.root }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given('[case9] a tree whose LATEST run holds a CORRUPT artifact', () => {
    /**
     * the end-to-end proof that an `unknown` run tells a driver WHY.
     *
     * the defect string was computed, stored, and asserted in data — and read by no
     * renderer, so the whole pipe from `asReviewRunMeterOfDefect` to a human's
     * terminal was broken at its last hop and every clamp beneath it stayed green.
     *
     * so the clamp that matters is the one taken at the CONTRACT, where a driver
     * stands. the operation-grain cases prove the grade and the string; only this
     * one proves the string survives into what is printed.
     */
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'review-cost-cli-case9' });

      setOneRun({
        tree,
        name: '2026-09-18T00-00-00-000Z.pid1.aaa',
        route: '.behavior/v2026_09_18.feat-demo',
        slug: 'repo-rules',
        grade: 'metered',
        input_: 400_000,
        cacheGet: 100_000,
      });

      // the LATEST run, whose metrics artifact is present and unparseable. it must
      // sort last, or `--of run` reads the healthy row and the case proves naught
      const broken = path.join(
        tree,
        '.log',
        'bhrain',
        'review',
        '2026-09-18T00-00-09-000Z.pid1.zzz',
      );
      fs.mkdirSync(broken, { recursive: true });
      fs.writeFileSync(
        path.join(broken, 'input.args.json'),
        JSON.stringify({ args: { focus: 'push' }, scope: {} }),
      );
      fs.writeFileSync(
        path.join(broken, 'metrics.realized.json'),
        '{ this is not json',
      );

      return {
        tree,
        run: runCli({ cwd: tree, args: ['--of', 'run'] }),
        json: runCli({ cwd: tree, args: ['--of', 'run', '--json'] }),
        // the SAME mixed corpus, asked at the next breadth up. see `[t2]`
        rollup: runCli({ cwd: tree, args: ['--of', 'tree'] }),
      };
    });

    when('[t0] the corrupt run is priced', () => {
      then('it exits clean — a corrupt log is a REPORT, not a crash', () => {
        expect(scene.run.exitCode).toEqual(0);
      });

      then('🔴 the report NAMES the file at fault', () => {
        expect(scene.run.stdout).toContain('defect:');
        expect(scene.run.stdout).toContain('metrics.realized.json');
      });

      then('🔴 it does NOT read as a legitimate hand run', () => {
        // `identity: null` has two causes. the benign text over a corruption tells
        // a driver that naught went wrong (rule.forbid.failhide)
        expect(scene.run.stdout).not.toContain('a hand or review.by run');
        expect(scene.run.stdout).toContain('🟡 UNPARSED');
      });

      then('🔴 and its spend still reads absent, never $0', () => {
        expect(scene.run.stdout).toContain(
          'cost: —  🟡 unknown, not $0 — the brain may have charged',
        );
        expect(scene.run.stdout).not.toContain('cost: $0');
        // each lever reads a bare mark, and the block keys it once
        expect(
          scene.run.stdout.match(
            /— = unmeasured, not zero \(grade = unknown\)/g,
          )?.length,
        ).toEqual(1);
      });

      then('the whole report renders as the human sees it', () => {
        expect(
          asStableRoot({ stdout: scene.run.stdout, root: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] the same run is asked for as json', () => {
      then('it exits clean and emits parseable json', () => {
        expect(scene.json.exitCode).toEqual(0);
        expect(() => JSON.parse(scene.json.stdout)).not.toThrow();
      });

      then('🔴 the defect survives into the DATA, not only the render', () => {
        // a consumer that pipes `--json` into a dashboard must be able to reach
        // the cause too, or it rebuilds the same blind spot one layer out
        const payload = JSON.parse(scene.json.stdout);
        expect(payload.run.grade).toEqual('unknown');
        expect(payload.run.defect).toContain('metrics.realized.json');
      });

      then('🔴 and it carries NO cost, so no sum can absorb it', () => {
        const payload = JSON.parse(scene.json.stdout);
        expect(payload.run.cost).toEqual(null);
        expect(payload.run.tokens).toEqual(null);
      });

      then('the json payload renders as a consumer receives it', () => {
        // every step of this journey carries a snapshot, this one included
        // (rule.require.snapshot-every-journey-step). the three assertions above
        // pin the VALUES that matter; only the snapshot shows the SHAPE — so a
        // silent key rename on the defect payload goes red here, where none of
        // them would notice it. this case is the corrupt-artifact wire format,
        // which is exactly the shape a dashboard is likeliest to mis-read
        expect(
          asStableRoot({ stdout: scene.json.stdout, root: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('🔴 [t2] the SAME mixed corpus is priced at TREE breadth', () => {
      /**
       * the isolation was proven at `run` breadth and at the operation's own
       * grain, and never at the breadth a driver actually reads.
       *
       * `--of run` prices ONE run — so it proves the corrupt run reports, and
       * proves naught about whether a corrupt run POISONS ITS NEIGHBOURS. only a
       * breadth that SUMS can show that, because only a sum can absorb an
       * unmeasured run and read plausible afterward (rule.forbid.failhide).
       *
       * read the snapshot with `F13` in hand. the corrupt run lands in the
       * `(no guard identity — a hand or review.by run)` bucket here, because its
       * identity is genuinely unreadable — the same benign label `[t0]` forbids
       * at run breadth. it is NOT un-noticed: the `+1 unknown` caveat rides
       * on that very row. but the DEFECT STRING that names the file at fault
       * reaches no breadth above `run`, which is `F13`'s reserved row and its
       * dream, not a gap this case leaves open.
       */
      then('it exits clean — one corrupt log aborts no rollup', () => {
        expect(scene.rollup.exitCode).toEqual(0);
      });

      then('🔴 the census NAMES the run it could not price', () => {
        // the total is over 1 of 2 runs, and a total over part of a corpus is
        // not the total. the caveat has to ride beside the figure
        expect(scene.rollup.stdout).toContain('1 unknown 🟡');
        expect(scene.rollup.stdout).toContain('2 (1 metered');
      });

      then('🔴 and one word names that grade at EVERY breadth', () => {
        // the F9 defect, asked from the other side: `--of run` and `--of tree`
        // must not print two words for one `ReviewRunGrade`
        expect(scene.rollup.stdout).not.toContain('unmetered');
      });

      then('the healthy run still prices, so isolation is per-RUN', () => {
        // the whole point of the grade: the neighbour survives
        expect(scene.rollup.stdout).toContain('400.0k');
      });

      then('the rollup renders as the human sees it', () => {
        expect(
          asStableRoot({ stdout: scene.rollup.stdout, root: scene.tree }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case10] a log root the filesystem BARS', () => {
    /**
     * the last unrefused failure mode in this cli.
     *
     * every other bad input — an absent `--of`, a valueless flag, an out of range
     * `--limit`, an empty corpus — emits an owl block and exits 2. an unreadable
     * log root threw past all of them and reached a driver as a raw node stack.
     *
     * and it is the one failure that most resembles a FACT this command reports
     * on purpose: an absent log dir and a barred one both arrive as an empty read.
     * so the pair must answer differently, or the wall reads as "no reviews ran"
     * (rule.forbid.failhide).
     *
     * .note = the chmod is taken on the log root itself, so a `readdir` of it is
     *         refused while the tree around it stays legible — the exact shape a
     *         driver hits when a guard ran under another user.
     */
    const scene = useBeforeAll(async () => {
      // refuse by name under root, which reads through a 0o000 dir and would void the clamp
      if (process.getuid?.() === 0)
        throw new BadRequestError(
          'this case needs a non-root runner — root reads through chmod 0o000',
          {
            uid: process.getuid?.(),
            hint: 'run the acceptance suite as a non-root user — root reads through a 0o000 dir',
          },
        );

      // a GROVE root with one tree under it, so all three breadths reach the same
      // barred dir: `--of tree` and `--of run` read it directly, `--of grove`
      // descends to it
      const grove = genTempDir({ slug: 'review-cost-cli-case10' });
      const tree = path.join(grove, 'tree-one');
      const barred = path.join(tree, '.log', 'bhrain', 'review');
      fs.mkdirSync(barred, { recursive: true });
      fs.chmodSync(barred, 0o000);
      return { grove, tree, barred };
    });

    afterAll(() => {
      // restored so the temp cleanup can recurse into it
      try {
        fs.chmodSync(scene.barred, 0o755);
      } catch {
        // already gone, or never made — either way there is naught to restore
      }
    });

    when('[t0] the tree breadth reads it', () => {
      const run = useThen('it answers', () =>
        runCli({ cwd: scene.tree, args: ['--of', 'tree'] }),
      );

      then('🔴 it REFUSES rather than crashes', () => {
        expect(run.exitCode).toEqual(2);
        // the discriminator: an owl refusal, never a node stack
        expect(run.stderr).toContain('barred');
        expect(run.stderr).not.toContain('at Object.readdir');
      });

      then('🔴 it does NOT read as an empty corpus', () => {
        // the whole point of the pair. `no reviews to price` over a barred dir
        // would send a driver to run a review that already ran
        expect(run.stderr).not.toContain('no reviews to price');
      });

      then('it names the fix, not merely the symptom', () => {
        expect(run.stderr).toContain('fix:');
        expect(run.stderr).toContain('chmod');
      });

      then('the refusal renders as the human sees it', () => {
        // stabilized on the GROVE root, because the OS sentence names the barred
        // path in full and that path carries the temp dir's timestamp + suffix
        expect(
          asStableRoot({ stdout: run.stderr, root: scene.grove }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] the grove breadth walks into it', () => {
      const run = useThen('it answers', () =>
        runCli({
          cwd: scene.grove,
          args: ['--of', 'grove', '--at', scene.grove],
        }),
      );

      then('🔴 it refuses the same way, at every breadth', () => {
        // the wrapper is shared, so a divergence here means a breadth escaped it
        expect(run.exitCode).toEqual(2);
        expect(run.stderr).toContain('barred');
      });

      then('🔴 it does NOT report a grove that spent naught', () => {
        // the worst shape: a `$0.00` total over a corpus nobody could read
        expect(run.stdout).not.toContain('cost');
        expect(run.stderr).not.toContain('no review logs to price');
      });

      // `[t0]` snaps the tree breadth's barred refusal; this snaps the grove's,
      // so *"it refuses the same way, at every breadth"* is a claim a reviewer can
      // read rather than one they must take on a shared wrapper's word
      then('the grove refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: run.stderr, roots: [scene.grove] }),
        ).toMatchSnapshot();
      });
    });

    when('[t2] the run breadth reads it', () => {
      // `--of run` from the tree reads its latest run, which lists the same barred
      // log root `--of tree` lists — so it must refuse through the same wrapper
      const run = useThen('it answers', () =>
        runCli({ cwd: scene.tree, args: ['--of', 'run'] }),
      );

      then('🔴 it refuses the same way, at every breadth', () => {
        expect(run.exitCode).toEqual(2);
        expect(run.stderr).toContain('a directory on the read path is barred');
        expect(run.stderr).not.toContain('at Object.readdir');
      });

      then('🔴 it does NOT read as an absent run', () => {
        // `no review run to price` over a barred dir would send a driver to run a
        // review that already ran
        expect(run.stderr).not.toContain('no review run to price');
      });

      then('the run refusal renders as the human sees it', () => {
        expect(
          asStableRoot({ stdout: run.stderr, root: scene.grove }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case11] an --at pointed at a directory that is NOT there', () => {
    /**
     * the likeliest human slip on this flag, and the one input shape with no clamp:
     * a stale or mistyped `--at ../old-worktree`.
     *
     * `[case3]` covers a directory that is PRESENT and empty. this covers one that
     * is absent — a different errno on the same read path, and the third of the
     * three dispositions `getAllEntriesInDir` holds (absent · barred · defect).
     *
     * it must degrade into the same empty-corpus refusal, NOT a stack. the
     * behavior was inferred from a doc comment until this case asserted it.
     */
    const scene = useBeforeAll(async () => {
      // the REAL temp dir, never the symbolic one `genTempDir` answers, so the
      // `--at` the refusal echoes is the one path the snapshot swaps out below.
      //
      // .note = the walk up from `--at` climbs the real path
      //         (`getOneReviewedTreeAbove`, clamped by its own integration test's
      //         symlink case), so the symbolic form no longer reaches this checkout.
      //         the realpath here keeps the echoed path stable, and that alone
      const tree = fs.realpathSync(
        genTempDir({ slug: 'review-cost-cli-case11' }),
      );
      // `tree` rides along so the refusal snapshots can swap it out — the echoed
      // `--at` carries the temp dir's timestamp and random suffix, so an
      // unstabilized snapshot would diff on every run
      // a path that IS there and names a file — the slip of a `--at` aimed at a
      // file inside the tree rather than the tree itself
      const file = path.join(tree, 'a-file.txt');
      fs.writeFileSync(file, 'not a directory\n');
      return { tree, absent: path.join(tree, 'no-such-worktree'), file };
    });

    when('[t0] the tree breadth is asked for it', () => {
      // the cwd is the FIXTURE tree, never `process.cwd()`. the refusal walks
      // up from the spawn cwd (`asRefusalOfAbsentTreeLogs`), so a spawn inside this
      // checkout would print a `reviews DID run above` hint naming whichever
      // ancestor of THIS clone happens to have been reviewed — a render that
      // depends on the machine, and vanishes on a fresh CI checkout
      // (`rule.require.hermetic-tests`). the hint itself is `[case7]`'s subject,
      // where the fixture owns the reviewed ancestor
      const run = useThen('it answers', () =>
        runCli({
          cwd: scene.tree,
          args: ['--of', 'tree', '--at', scene.absent],
        }),
      );

      then('it refuses as an empty corpus, never as a crash', () => {
        expect(run.exitCode).toEqual(2);
        expect(run.stderr).toContain('no reviews to price');
      });

      then('🔴 and it ECHOES the path it was handed', () => {
        // so the human sees their own typo, rather than a default they never typed
        expect(run.stderr).toContain(scene.absent);
      });

      // the three breadths are snapped SEPARATELY, because the claim across
      // this case is that each names its own corpus word — `no reviews to price`
      // at tree, `no review run to price` at run, `no review logs to price` at
      // grove. three snapshots in one diff show a reviewer that the three stayed
      // distinct; three `toContain`s prove only that three substrings survived
      then('the tree refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: run.stderr, roots: [scene.tree] }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] the run breadth is asked for it', () => {
      // the fixture tree, for the reason `[t0]` states
      const run = useThen('it answers', () =>
        runCli({
          cwd: scene.tree,
          args: ['--of', 'run', '--at', scene.absent],
        }),
      );

      then('it refuses the same way', () => {
        expect(run.exitCode).toEqual(2);
        expect(run.stderr).toContain('no review run to price');
        expect(run.stderr).toContain(scene.absent);
      });

      then('the run refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: run.stderr, roots: [scene.tree] }),
        ).toMatchSnapshot();
      });
    });

    when('[t2] the GROVE breadth is asked for it', () => {
      /**
       * the third breadth, and the one this case was written without.
       *
       * `[case10]` clamps the grove's BARRED path; `[t0]`/`[t1]` clamp the tree
       * and run breadths' ABSENT path. that left grove × absent as the one cell
       * of the three-by-two board with no assertion — and its behavior lived in
       * a doc comment on `genReviewGroveReport` (*"an ABSENT grove root answers
       * an empty grove; an UNREADABLE one is a defect"*), which is the exact
       * "inferred from a doc comment" state this case's own header names.
       *
       * a fourth pass of this branch's recurrent species: a decision proven at
       * two call sites and assumed at the third.
       */
      const run = useThen('it answers', () =>
        runCli({
          cwd: scene.tree,
          args: ['--of', 'grove', '--at', scene.absent],
        }),
      );

      then('it refuses as an empty corpus, never as a crash', () => {
        expect(run.exitCode).toEqual(2);
        // the grove's own header — a DIFFERENT word than the tree breadths,
        // deliberately, because it walked many roots rather than one
        expect(run.stderr).toContain('no review logs to price');
      });

      then('🔴 and it reports ZERO trees, never a $0.00 grove total', () => {
        // the failhide this breadth's guard exists to refuse: an absent root
        // must not pass a `treesWithLogs` gate and render a corpus of zeroes
        expect(run.stdout).not.toContain('cost');
        expect(run.stderr).not.toContain('at Object.readdir');
      });

      then('🔴 and it ECHOES the path it was handed', () => {
        expect(run.stderr).toContain(scene.absent);
      });

      then('🔴 and it names the absent path in the tree and run words', () => {
        // one refusal for a bad `--at`, at all three breadths — never an empty
        // walk that reads "0 trees seen" as though the walk had found naught
        expect(run.stderr).toContain(
          '--at names a directory that is not there',
        );
      });

      then('the grove refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: run.stderr, roots: [scene.tree] }),
        ).toMatchSnapshot();
      });
    });

    when('[t3] --at names a FILE, not a directory', () => {
      const runs = useThen('each breadth answers', () => ({
        tree: runCli({
          cwd: scene.tree,
          args: ['--of', 'tree', '--at', scene.file],
        }),
        run: runCli({
          cwd: scene.tree,
          args: ['--of', 'run', '--at', scene.file],
        }),
        grove: runCli({
          cwd: scene.tree,
          args: ['--of', 'grove', '--at', scene.file],
        }),
      }));

      then('🔴 every breadth refuses with the file named as a file', () => {
        for (const run of [runs.tree, runs.run, runs.grove]) {
          expect(run.exitCode).toEqual(2);
          expect(run.stderr).toContain(
            `--at names a file, not a directory: ${scene.file}`,
          );
          expect(run.stderr).toContain(
            `point --at at the directory that holds it`,
          );
        }
      });

      then('the tree refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: runs.tree.stderr, roots: [scene.tree] }),
        ).toMatchSnapshot();
      });

      // the run twin has its own header (`no review run to price`), so it is a
      // distinct block a caller meets — snapped beside its tree and grove peers
      then('the run refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: runs.run.stderr, roots: [scene.tree] }),
        ).toMatchSnapshot();
      });

      then('the grove refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: runs.grove.stderr, roots: [scene.tree] }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case12] a tree with runs, priced from ANOTHER cwd via --at', () => {
    /**
     * `--of tree` already had this clamp; `--of run` did not, and the two share the
     * `at ?? process.cwd()` line. the asymmetry is the defect: a shared line proven
     * at one call site and assumed at the other is exactly the species this branch
     * repaired four times over (`isTargetDiffSent`, the target count, F11, the
     * cache seam).
     */
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'review-cost-cli-case12' });
      const elsewhere = genTempDir({
        slug: 'review-cost-cli-case12-elsewhere',
      });

      setOneRun({
        tree,
        name: '2026-09-18T00-00-00-000Z.pid1.aaa',
        route: '.behavior/v2026_09_18.feat-demo',
        slug: 'repo-rules',
        grade: 'metered',
        input_: 400_000,
        cacheGet: 100_000,
        compiled: true,
      });

      // a sub-dir of the tree: the default grove root is its PARENT, which is the
      // tree itself, so the walk visits the tree's children and finds no run
      const sub = path.join(tree, 'sub');
      fs.mkdirSync(sub, { recursive: true });

      return { tree, elsewhere, sub };
    });

    when('[t0] --of run is asked from a cwd with no logs of its own', () => {
      const run = useThen('it answers', () =>
        runCli({
          cwd: scene.elsewhere,
          args: ['--of', 'run', '--at', scene.tree],
        }),
      );

      then('🔴 it prices the tree it was POINTED at, not its own cwd', () => {
        expect(run.exitCode).toEqual(0);
        expect(run.stdout).toContain('repo-rules');
      });

      then('the figure is the measured one, not an absence', () => {
        expect(run.stdout).not.toContain('unknown, not $0');
        expect(run.stdout).not.toContain('unmeasured');
      });

      then('the report renders as the human sees it', () => {
        expect(
          asStableRoot({ stdout: run.stdout, root: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] --of grove is asked from a SUB-DIR of the reviewed tree', () => {
      const run = useThen('it refuses', () =>
        runCli({ cwd: scene.sub, args: ['--of', 'grove'] }),
      );

      then('it refuses as an empty grove, a constraint', () => {
        expect(run.exitCode).toEqual(2);
        expect(run.stderr).toContain('no review logs to price');
      });

      then('🔴 it names the tree where reviews DID run', () => {
        expect(run.stderr).toContain('🔭 but reviews DID run in a tree at: ');
      });

      then('🔴 it names the grove root that would answer', () => {
        expect(run.stderr).toContain(
          `did you mean: rhx review._.cost --of grove --at ${path.dirname(fs.realpathSync(scene.tree))}`,
        );
      });

      then('the refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({
            stderr: run.stderr,
            // the PARENT of the real tree, never of its symlink: the cli walks the
            // real path, and the symlink's parent sits inside this clone
            roots: [scene.tree, path.dirname(fs.realpathSync(scene.tree))],
          }),
        ).toMatchSnapshot();
      });
    });
  });

  given(
    '[case13] a tree whose log root holds an OLDER run and a newer one',
    () => {
      /**
       * `--of run` could reach exactly one run — the LATEST — so every historical
       * round had an artifact on disk and no surface at all. and `--of run` is the
       * one breadth that carries COMPOSITION, so *"which input bought the prompt of
       * the round that regressed?"* was unanswerable about any round but the newest.
       *
       * the two runs here are seeded to DIFFER in their measured figures, so an
       * assertion on WHICH was priced is falsifiable. a fixture with one run, or with
       * two that meter alike, would stay green whichever path the command honored.
       */
      const scene = useBeforeAll(async () => {
        const tree = genTempDir({ slug: 'review-cost-cli-case13' });
        const route = '.behavior/v2026_09_18.feat-demo';

        setOneRun({
          tree,
          name: '2026-09-18T00-00-00-000Z.pid1.aaa',
          route,
          slug: 'repo-rules',
          grade: 'metered',
          input_: 400_000,
          cacheGet: 100_000,
          compiled: true,
        });
        setOneRun({
          tree,
          name: '2026-09-19T00-00-00-000Z.pid1.bbb',
          route,
          slug: 'mech-failhides',
          grade: 'metered',
          input_: 400_000,
          cacheGet: 100_000,
          compiled: true,
        });

        return {
          tree,
          dirOfOlder: path.join(
            tree,
            DIR_OF_REVIEW_LOGS,
            '2026-09-18T00-00-00-000Z.pid1.aaa',
          ),
        };
      });

      when('[t0] the TREE is named, as it always could be', () => {
        const run = useThen('it answers', () =>
          runCli({ cwd: scene.tree, args: ['--of', 'run'] }),
        );

        then(
          'the LATEST run is priced — the extant behavior, unchanged',
          () => {
            expect(run.exitCode).toEqual(0);
            expect(run.stdout).toContain('mech-failhides');
            expect(run.stdout).not.toContain('repo-rules');
          },
        );

        then('the run report renders as the human sees it', () => {
          // this step is the BASELINE the journey's whole claim rests on — [t1] is
          // only meaningful against what the default renders. so the default's own
          // render is snapped, and the two are diffable
          expect(
            asStableRoot({ stdout: run.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] the OLDER run DIR is named at --at', () => {
        const run = useThen('it answers', () =>
          runCli({
            cwd: scene.tree,
            args: ['--of', 'run', '--at', scene.dirOfOlder],
          }),
        );

        then('🔴 THAT run is priced, never the latest', () => {
          // the assertion the whole surface exists for. both runs are on disk, both
          // meter clean, and both carry a composition — so the ONLY quantity that
          // parts them is which path the command honored
          expect(run.exitCode).toEqual(0);
          expect(run.stdout).toContain('repo-rules');
          expect(run.stdout).not.toContain('mech-failhides');
        });

        then(
          'its COMPOSITION is carried, which is why a run dir is addressable',
          () => {
            // a historical run's spend is already summed into `--of tree`. what only
            // `--of run` can answer is what its PROMPT was made of — so a surface that
            // reached the run and dropped the census would answer the cheap half.
            // so the named INPUTS are asserted, never the header alone: a header with
            // no rows beneath it is the render this axis exists to refuse
            expect(run.stdout).toContain('composition:');
            expect(run.stdout).toContain('scaffold');
            expect(run.stdout).toContain('targetFiles');
          },
        );

        then(
          'each input carries which side of the CACHE SEAM it sat on',
          () => {
            // the seam is the whole point of the census — a row with a share and no
            // seam says what an input cost and not whether it is re-paid every round
            expect(run.stdout).toContain('cacheable');
            expect(run.stdout).toContain('per round');
          },
        );

        then('the report renders as the human sees it', () => {
          expect(
            asStableRoot({ stdout: run.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });

      when(
        '[t2] a run dir whose NAME matches the mint but is not on disk',
        () => {
          const run = useThen('it answers', () =>
            runCli({
              cwd: scene.tree,
              args: [
                '--of',
                'run',
                '--at',
                path.join(
                  scene.tree,
                  DIR_OF_REVIEW_LOGS,
                  '2026-09-21T00-00-00-000Z.pid9.zzz',
                ),
              ],
            }),
          );

          then(
            '🔴 it refuses, rather than price a run that does not exist',
            () => {
              // the failhide this guards: `getOneReviewRunMeter` catches every absent
              // artifact to a null and grades the result `refused` — a nil spend that is a
              // FACT — so an unguarded read would render `$0.00` for a path the human
              // mistyped (rule.forbid.failhide)
              expect(run.exitCode).toEqual(2);
              expect(run.stdout).not.toContain('$0.00');
            },
          );

          then(
            'the refusal names the RUN, never "run a review here first"',
            () => {
              // the tree's fix is wrong here and would be acted on: it sends a human to
              // re-run a review, about a tree whose reviews already ran
              // (rule.require.errors-name-the-fix)
              expect(run.stderr).toContain('not on disk');
              expect(run.stderr).not.toContain('run a review here first');
            },
          );

          then('the refusal renders as the human sees it', () => {
            expect(
              asStableRoot({ stdout: run.stderr, root: scene.tree }),
            ).toMatchSnapshot();
          });
        },
      );

      when('[t3] that same run dir is handed to --of tree', () => {
        const run = useThen('it answers', () =>
          runCli({
            cwd: scene.tree,
            args: ['--of', 'tree', '--at', scene.dirOfOlder],
          }),
        );

        then('🔴 it refuses, and names --of run as the fix', () => {
          // it would refuse anyway — `asReviewLogsDir` re-appends the log root under a
          // run dir and finds naught. but the refusal it would REACH says "run a
          // review here first" about a dir that holds a finished review, and an error
          // that names the WRONG fix is worse than one that names none: it is acted on
          expect(run.exitCode).toEqual(2);
          expect(run.stderr).toContain('--of run');
          expect(run.stderr).not.toContain('run a review here first');
        });

        then('the refusal renders as the human sees it', () => {
          expect(
            asStableRoot({ stdout: run.stderr, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });

      when('[t4] that same run dir is handed to --of grove', () => {
        // a driver who copies a run path it just saw printed may reach for the grove
        const run = useThen('it answers', () =>
          runCli({
            cwd: scene.tree,
            args: ['--of', 'grove', '--at', scene.dirOfOlder],
          }),
        );

        then('🔴 it refuses, and names --of run as the fix', () => {
          expect(run.exitCode).toEqual(2);
          expect(run.stderr).toContain('--of grove reads more than one');
          expect(run.stderr).toContain('--of run');
        });

        then('the refusal renders as the human sees it', () => {
          expect(
            asStableRoot({ stdout: run.stderr, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  given('[case14] a tree whose reviews ran over TWO rounds', () => {
    /**
     * `--trace` is the newest flag on this cli, and it had NO case here at all —
     * neither its accept path nor either of its two refusals. the cross-tab it
     * renders was snapped at unit grain alone, which grades the renderer and says
     * naught about whether the flag reaches it (`F19`: a test grades the artifact
     * it was pointed at; a runthrough grades the artifact a human meets).
     *
     * .why = a flag the cli accepts and discards is the exact failhide `--limit`
     *        already taught this command — `review._.cost.ts` refuses `--trace`
     *        *"exactly as `--limit` is below and for the identical reason"*. that
     *        reason is only checkable where BOTH refusals are pinned.
     *
     * .note = the fixture seeds two ROUNDS on purpose. a one-round corpus renders a
     *         one-column cross-tab, which proves the render ran rather than that it
     *         crosses two axes — so the positive case would be green over a corpus
     *         that could not have shown a regression.
     */
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'review-cost-cli-case14' });
      const route = '.behavior/v2026_09_18.feat-demo';

      // round i001 — the first drive of the stone
      setOneRun({
        tree,
        name: '2026-09-18T00-00-00-000Z.pid1.aaa',
        route,
        slug: 'repo-rules',
        grade: 'metered',
        round: 'i001',
        input_: 400_000,
        cacheGet: 0,
        compiled: true,
      });
      // round i002 — the SAME lane, re-driven. its cache share differs from i001's,
      // so an assertion that the two rounds render apart is falsifiable
      setOneRun({
        tree,
        name: '2026-09-19T00-00-00-000Z.pid1.bbb',
        route,
        slug: 'repo-rules',
        grade: 'metered',
        round: 'i002',
        input_: 100_000,
        cacheGet: 300_000,
        compiled: true,
      });

      return {
        tree,
        traced: runCli({ cwd: tree, args: ['--of', 'tree', '--trace'] }),
        traceAtRun: runCli({ cwd: tree, args: ['--of', 'run', '--trace'] }),
        traceAtGrove: runCli({ cwd: tree, args: ['--of', 'grove', '--trace'] }),
      };
    });

    when('[t0] --trace rides the breadth that HAS two axes', () => {
      then('it answers clean', () => {
        expect(scene.traced.exitCode).toEqual(0);
      });

      then('🔴 BOTH rounds reach the render — the cross-tab crosses', () => {
        // the assertion the flag exists for. a render that reached one round would
        // be a rollup wearing a cross-tab's name
        expect(scene.traced.stdout).toContain('i001');
        expect(scene.traced.stdout).toContain('i002');
      });

      then('the traced report renders as the human sees it', () => {
        expect(
          asStableRoot({ stdout: scene.traced.stdout, root: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] --trace is carried by --of run', () => {
      then('🔴 it refuses, rather than accept a flag it would discard', () => {
        expect(scene.traceAtRun.exitCode).toEqual(2);
      });

      then('the refusal names what --trace is FOR, and where it goes', () => {
        // rule.require.errors-name-the-fix — a bare "unknown flag" leaves the driver
        // to guess whether the word is misspelled or merely misplaced
        expect(scene.traceAtRun.stderr).toContain(
          '--trace is not a flag "--of run" takes',
        );
        expect(scene.traceAtRun.stderr).toContain('CROSS-TAB');
        expect(scene.traceAtRun.stderr).toContain('--of tree --trace');
      });

      then('the refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.traceAtRun.stderr }),
        ).toMatchSnapshot();
      });
    });

    when('[t2] --trace is carried by --of grove', () => {
      then('🔴 it refuses BEFORE the walk, not after a four-minute one', () => {
        // the refusal sits above the breadth branch on purpose: a grove walk probes
        // every tree on the machine, so a check that fired after it would charge the
        // driver minutes to be told a flag was misplaced
        expect(scene.traceAtGrove.exitCode).toEqual(2);
        expect(scene.traceAtGrove.stderr).not.toContain(
          'price every tree under',
        );
      });

      then(
        '🔴 its WHY differs from --of run`s — grove folds, run reports one',
        () => {
          // two breadths, two reasons, and the refusal states the one that applies.
          // a shared "not this breadth" line would be true and teach naught
          expect(scene.traceAtGrove.stderr).toContain(
            '--trace is not a flag "--of grove" takes',
          );
          expect(scene.traceAtGrove.stderr).toContain(
            'it folds every round together',
          );
          expect(scene.traceAtGrove.stderr).not.toContain(
            'it reports a single run',
          );
        },
      );

      then('the refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.traceAtGrove.stderr }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case17] a human who misspells a flag', () => {
    // the failhide this clamps: `--jsno` was never read, so the tree rendered
    // where json was asked for, and a pipe into jq failed on the far side with a
    // parse error that never named the typo (rule.forbid.failhide)
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'review-cost-cli-case17' });
      return {
        typo: runCli({ cwd, args: ['--of', 'tree', '--jsno'] }),
        short: runCli({ cwd, args: ['--of', 'tree', '-j'] }),
      };
    });

    when('[t0] --jsno is typed where --json was meant', () => {
      then('it exits 2 before any corpus is read', () => {
        expect(scene.typo.exitCode).toEqual(2);
      });

      then('it names the flag it did not recognize', () => {
        expect(scene.typo.stderr).toContain('1 unknown flag: --jsno');
      });

      then('it names the flags it does read, and the fix', () => {
        // rule.require.errors-name-the-fix
        expect(scene.typo.stderr).toContain('--json');
        expect(scene.typo.stderr).toContain('rhx review._.cost --help');
      });

      then('the refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.typo.stderr }),
        ).toMatchSnapshot();
      });
    });

    when(
      '[t1] a short flag -j is typed, which this command does not read',
      () => {
        // `-h` is read, which teaches that short flags are read — so a typed `-j`
        // must be refused by name, exactly as `--jsno` is, never run as absent
        then('it exits 2 and names the short flag', () => {
          expect(scene.short.exitCode).toEqual(2);
          expect(scene.short.stderr).toContain('1 unknown flag: -j');
        });

        then(
          '🔴 the known list names the short flag the command does read',
          () => {
            // a known list that omits `-h` teaches there is no short form, when there is one
            expect(scene.short.stderr).toMatch(/known: .*--help -h/);
          },
        );

        then('the refusal renders as the human sees it', () => {
          expect(
            asStableRefusal({ stderr: scene.short.stderr }),
          ).toMatchSnapshot();
        });
      },
    );
  });

  given('[case18] a tree whose guard is MALFORMED', () => {
    // the clamp for i035 r011 blocker.1: a guard is hand-edited, and one malformed
    // guard once threw out of the level join as a raw stack and priced no run at all
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'review-cost-cli-case18' });
      setOneTree({ tree });
      // `level: 0` is refused at parse — overwrite the healthy guard with it
      fs.writeFileSync(
        path.join(
          tree,
          '.behavior/v2026_09_18.feat-demo',
          '5.1.execution.from_vision.guard',
        ),
        [
          'reviews:',
          '  peer:',
          '    - slug: repo-rules',
          '      run: rhx review --rules a',
          '      level: 0',
        ].join('\n'),
      );
      return { tree, run: runCli({ cwd: tree, args: ['--of', 'tree'] }) };
    });

    when('[t0] the tree is priced', () => {
      then('it still exits clean and prices every run', () => {
        expect(scene.run.exitCode).toEqual(0);
        expect(scene.run.stdout).toContain(
          'runs: 3 (1 metered · 1 refused · 1 unknown 🟡)',
        );
      });

      then('its runs read "(no level — guard unread)", never L1', () => {
        expect(scene.run.stdout).toContain('(no level — guard unread)');
        expect(scene.run.stdout).not.toContain('L1');
      });

      then('stderr names the guard to repair, and why', () => {
        expect(scene.run.stderr).toContain('🟡 warn: guard unread — ');
        expect(scene.run.stderr).toContain('5.1.execution.from_vision.guard');
        expect(scene.run.stderr).toContain('malformed — ');
        expect(scene.run.stderr).not.toContain('    at ');
      });

      then(
        '🔴 a notice the run proceeds past wears no error class, since it exits 0',
        () => {
          expect(scene.run.stderr).not.toContain('ConstraintError');
          expect(scene.run.stderr).not.toContain('woah there');
          expect(scene.run.stderr).toContain('🦉 heads up, the run goes on');
        },
      );

      then(
        '🔴 stderr names one error class, never the parser class beneath it',
        () => {
          expect(scene.run.stderr).not.toContain('BadRequestError');
        },
      );

      then('both streams render as the human sees them', () => {
        expect(
          asStableRoot({ stdout: scene.run.stdout, root: scene.tree }),
        ).toMatchSnapshot();
        expect(
          asStableRoot({ stdout: scene.run.stderr, root: scene.tree }),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case19] a human who types a flag in a form it did not read', () => {
    // three slips that each ran as though a word was never typed: a stray
    // positional was dropped, `--of=tree` was refused as an unknown flag named
    // `of=tree`, and a flag typed twice kept its first value in silence
    const scene = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'review-cost-cli-case19' });
      return {
        stray: runCli({ cwd, args: ['--of', 'tree', 'grove'] }),
        spaced: runCli({ cwd, args: ['--of', 'tree'] }),
        equals: runCli({ cwd, args: ['--of=tree'] }),
        twice: runCli({ cwd, args: ['--of', 'tree', '--of', 'grove'] }),
        atEmpty: runCli({ cwd, args: ['--of', 'tree', '--at='] }),
        atEmptySpaced: runCli({ cwd, args: ['--of', 'tree', '--at', ''] }),
      };
    });

    when('[t0] a bare word is typed beside the flags', () => {
      then('it exits 2 and names the stray word', () => {
        expect(scene.stray.exitCode).toEqual(2);
        expect(scene.stray.stderr).toContain('1 stray arg: "grove"');
      });

      then('it names the fix', () => {
        expect(scene.stray.stderr).toContain('rhx review._.cost --of tree');
      });

      then('the refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.stray.stderr }),
        ).toMatchSnapshot();
      });
    });

    when('[t1] --of=tree is typed in the equals form', () => {
      then('it is read exactly as --of tree is', () => {
        expect(scene.equals.stderr).not.toContain('unknown flag');
        expect(scene.equals.exitCode).toEqual(scene.spaced.exitCode);
        expect(scene.equals.stdout).toEqual(scene.spaced.stdout);
        expect(scene.equals.stderr).toEqual(scene.spaced.stderr);
      });
    });

    when('[t2] --of is typed twice with two values', () => {
      then('it exits 2 and names the repeated flag', () => {
        expect(scene.twice.exitCode).toEqual(2);
        expect(scene.twice.stderr).toContain(
          '1 flag typed more than once: --of',
        );
      });

      then('the refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.twice.stderr }),
        ).toMatchSnapshot();
      });
    });

    when('[t3] --at is typed with an EMPTY value', () => {
      // `--at=`, `--at ""`, and `--at "$X"` with `$X` unset each hand over `''`,
      // which slipped past `at ?? cwd` and priced the current directory in silence
      then('the equals form is refused as valueless', () => {
        expect(scene.atEmpty.exitCode).toEqual(2);
        expect(scene.atEmpty.stderr).toContain('--at was given with no value');
      });

      then(
        'the space form with an empty string is refused the same way',
        () => {
          expect(scene.atEmptySpaced.exitCode).toEqual(2);
          expect(scene.atEmptySpaced.stderr).toEqual(scene.atEmpty.stderr);
        },
      );

      then('the refusal renders as the human sees it', () => {
        expect(
          asStableRefusal({ stderr: scene.atEmpty.stderr }),
        ).toMatchSnapshot();
      });
    });
  });

  given(
    '[case22] a run whose prompt was pruned, its compiled metrics kept',
    () => {
      // the state a pruned log leaves: the megabyte prompt is gone, the compiled metrics
      // remain. the run reached the brain all the same, so
      // its spend is unrecorded — it must read `unknown`, never a `refused` $0
      const scene = useBeforeAll(async () => {
        const root = genTempDir({ slug: 'review-cost-cli-case22' });
        const tree = path.join(root, 'repo.beav.feat-pruned');
        fs.mkdirSync(tree, { recursive: true });
        const route = '.behavior/v2026_09_18.feat-demo';
        setOneTree({ tree });

        setOneRun({
          tree,
          name: '2026-09-18T04-00-00-000Z.pid1.ppp',
          route,
          slug: 'lane-pruned',
          grade: 'unknown',
          input_: 100_000,
          cacheGet: 0,
          compiled: true,
          prompt: false,
        });

        return { tree, atTree: runCli({ cwd: tree, args: ['--of', 'tree'] }) };
      });

      when('[t0] the tree is priced', () => {
        then('it exits clean', () => {
          expect(scene.atTree.stderr).toEqual('');
          expect(scene.atTree.exitCode).toEqual(0);
        });

        then('🔴 the pruned run reads unknown, never a refused $0', () => {
          const rowOfPruned = scene.atTree.stdout
            .split('\n')
            .find((line) => line.includes('lane-pruned'));
          expect(rowOfPruned).toBeDefined();
          expect(rowOfPruned).toContain('unknown (cost unrecorded, not zero)');
          expect(rowOfPruned).not.toContain('$0.000000');
        });

        then('and the report renders whole', () => {
          expect(
            asStableRoot({ stdout: scene.atTree.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });
    },
  );

  /**
   * .what = a tree whose latest run was refused at the overflow gate, priced by the
   *         default form and by its own run dir
   * .why = 🔴 CLAMP. the targets split — bodies against diffs — is what tells a driver
   *        which lever lifts an overflow, and it rendered only where `--at` named the run
   *        dir. the bare `--of run`, the form the help names first, priced the same run
   *        and left the split out with no word. the split now keys on the run's own dir,
   *        so every form of the same run renders the same split
   */
  given(
    '[case23] a tree whose LATEST run was refused at the overflow gate',
    () => {
      const scene = useBeforeAll(async () => {
        const tree = genTempDir({
          slug: 'review-cost-refused-split',
          git: true,
        });
        fs.mkdirSync(path.join(tree, 'src'), { recursive: true });
        fs.writeFileSync(path.join(tree, 'src', 'wave.ts'), 'x'.repeat(1_200));

        // a refused run writes its scope and no prompt
        const dir = path.join(
          tree,
          DIR_OF_REVIEW_LOGS,
          '2026-10-08T00-00-00-000Z.pid1.aaa',
        );
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(
          path.join(dir, 'input.args.json'),
          JSON.stringify({ args: { focus: 'push' }, scope: {} }),
        );
        fs.writeFileSync(
          asRunArtifactPath({ dir, artifact: 'scope' }),
          JSON.stringify({ targetFiles: ['src/wave.ts'] }),
        );
        fs.writeFileSync(
          asRunArtifactPath({ dir, artifact: 'scopeDebug' }),
          JSON.stringify({ args: { focus: 'push' } }),
        );
        return { tree, dir };
      });

      when(
        '[t0] it is priced with --at omitted, and with --at <rundir>',
        () => {
          const result = useThen('both forms run', async () => ({
            bare: runCli({ cwd: scene.tree, args: ['--of', 'run'] }),
            atDir: runCli({
              cwd: scene.tree,
              args: ['--of', 'run', '--at', scene.dir],
            }),
          }));

          then('both forms exit clean', () => {
            expect(result.bare.exitCode).toEqual(0);
            expect(result.atDir.exitCode).toEqual(0);
          });

          then('🔴 the bare form renders the targets split', () => {
            expect(result.bare.stdout).toContain('targets split:');
          });

          then('🔴 both forms render the SAME targets split block', () => {
            const asSplitBlock = (stdout: string): string[] => {
              const lines = stdout.split('\n');
              const start = lines.findIndex((line) =>
                line.includes('targets split:'),
              );
              return lines
                .slice(start)
                .filter(
                  (line, index) => index === 0 || line.startsWith('   │'),
                );
            };
            expect(asSplitBlock(result.bare.stdout)).toEqual(
              asSplitBlock(result.atDir.stdout),
            );
          });

          then('the bare form renders whole', () => {
            expect(
              asStableRoot({ stdout: result.bare.stdout, root: scene.tree }),
            ).toMatchSnapshot();
          });
        },
      );
    },
  );

  given(
    '[case25] four reviewers that each ran twice — one per prefix verdict',
    () => {
      /**
       * the arithmetic each lane rests on, stated before the fixture. every round
       * bills at `round(len / 4)` prompt tokens (`setOnePrefixRun`), and the meter
       * reads chars per token off the round itself, so each figure below is
       * arithmetic a reader can redo from the declared bytes:
       *
       *   served       'a' × 5,000 + 'ROUND-ONE-TAIL' → 'a' × 5,000 + 'ROUND-TWO-TAIL'
       *                shared = 5,000 + 6 (`ROUND-` matches) = 5,006 chars
       *                tokens = round(5,014 / 4) = 1,254; expected = round(5,006 /
       *                (5,014 / 1,254)) = 1,252 tok; cache.get 626 → reach 50.0%.
       *                the static head is 4,000 chars, so the prefix breaks in the tail
       *   missed       the same two prompts, and a cache.get of 0 — the prompt held,
       *                the cache served none
       *   self-cached  two prompts that part at byte 0, and a round billed 95% from
       *                cache with 0 input — a multi-turn run's read of its own turns
       *   over-reach   'c' × 1,000 shared, then 3,000 bytes apart; expected 250 tok,
       *                and a cache.get of 600 → reach 240.0%, past what the bytes hold
       */
      const route = '.behavior/v2026_09_18.feat-demo';
      const SHARED = 'a'.repeat(5_000);
      const scene = useBeforeAll(async () => {
        const tree = genTempDir({ slug: 'review-cost-cli-case25' });
        const lanes = [
          {
            slug: 'lane-served',
            minute: '00',
            prompts: [`${SHARED}ROUND-ONE-TAIL`, `${SHARED}ROUND-TWO-TAIL`],
            cacheGet: 626,
          },
          {
            slug: 'lane-missed',
            minute: '10',
            prompts: [`${SHARED}ROUND-ONE-TAIL`, `${SHARED}ROUND-TWO-TAIL`],
            cacheGet: 0,
          },
          {
            slug: 'lane-selfcached',
            minute: '20',
            prompts: [`x${SHARED}`, `y${SHARED}`],
            cacheGet: 1_200,
          },
          {
            slug: 'lane-overreach',
            minute: '30',
            prompts: [
              `${'c'.repeat(1_000)}${'d'.repeat(3_000)}`,
              `${'c'.repeat(1_000)}${'e'.repeat(3_000)}`,
            ],
            cacheGet: 600,
          },
        ];
        lanes.forEach((lane) =>
          lane.prompts.forEach((prompt, index) =>
            setOnePrefixRun({
              tree,
              name: `2026-09-23T10-${lane.minute}-0${index}-000Z.pid1.${lane.slug}`,
              route,
              slug: lane.slug,
              round: `i00${index + 1}`,
              prompt,
              head: 4_000,
              cacheGet: index === 0 ? 0 : lane.cacheGet,
              // the self-cached round bills no fresh input — its turns read their own
              input_: lane.slug === 'lane-selfcached' && index === 1 ? 0 : null,
            }),
          ),
        );

        // a grove of one reviewed tree, so the grove counts read beside the tree's
        const grove = genTempDir({ slug: 'review-cost-cli-case25-grove' });
        const groveTree = path.join(grove, 'repo.beav.feat-prefix');
        fs.mkdirSync(groveTree, { recursive: true });
        lanes.forEach((lane) =>
          lane.prompts.forEach((prompt, index) =>
            setOnePrefixRun({
              tree: groveTree,
              name: `2026-09-23T10-${lane.minute}-0${index}-000Z.pid1.${lane.slug}`,
              route,
              slug: lane.slug,
              round: `i00${index + 1}`,
              prompt,
              head: 4_000,
              cacheGet: index === 0 ? 0 : lane.cacheGet,
              input_: lane.slug === 'lane-selfcached' && index === 1 ? 0 : null,
            }),
          ),
        );

        // each lane's second round, priced by name
        const atRunOf = (input: { slug: string; minute: string }) =>
          runCli({
            cwd: tree,
            args: [
              '--of',
              'run',
              '--at',
              path.join(
                tree,
                DIR_OF_REVIEW_LOGS,
                `2026-09-23T10-${input.minute}-01-000Z.pid1.${input.slug}`,
              ),
            ],
          });
        return {
          tree,
          grove,
          served: atRunOf({ slug: 'lane-served', minute: '00' }),
          servedJson: runCli({
            cwd: tree,
            args: [
              '--of',
              'run',
              '--at',
              path.join(
                tree,
                DIR_OF_REVIEW_LOGS,
                '2026-09-23T10-00-01-000Z.pid1.lane-served',
              ),
              '--json',
            ],
          }),
          missed: atRunOf({ slug: 'lane-missed', minute: '10' }),
          selfCached: atRunOf({ slug: 'lane-selfcached', minute: '20' }),
          overReach: atRunOf({ slug: 'lane-overreach', minute: '30' }),
          first: runCli({
            cwd: tree,
            args: [
              '--of',
              'run',
              '--at',
              path.join(
                tree,
                DIR_OF_REVIEW_LOGS,
                '2026-09-23T10-00-00-000Z.pid1.lane-served',
              ),
            ],
          }),
          atTree: runCli({ cwd: tree, args: ['--of', 'tree'] }),
          atTreeJson: runCli({ cwd: tree, args: ['--of', 'tree', '--json'] }),
          atGrove: runCli({
            cwd: grove,
            args: ['--of', 'grove', '--at', grove],
          }),
          atGroveJson: runCli({
            cwd: grove,
            args: ['--of', 'grove', '--at', grove, '--json'],
          }),
        };
      });

      when('[t0] a round that shares a DECLARED prefix with its prior', () => {
        then('it exits clean', () => {
          expect(scene.served.stderr).toEqual('');
          expect(scene.served.exitCode).toEqual(0);
        });

        then('🔴 it names the verdict against its prior round', () => {
          expect(scene.served.stdout).toContain('├─ prefix vs i1: served');
        });

        then(
          '🔴 cache.get sits beside the reach over the expected prefix',
          () => {
            expect(scene.served.stdout).toContain(
              '├─ cache.get 626 tok · reach 50.0% of expected',
            );
          },
        );

        then('the expected prefix is the byte count, as tok est.', () => {
          expect(scene.served.stdout).toContain(
            '├─ expected 1.3k tok est. (5.0k chars shared with i1)',
          );
        });

        then('🟡 it says where the prefix breaks', () => {
          expect(scene.served.stdout).toContain('└─ prefix breaks in: tail');
        });

        then('no glyph marks a served round', () => {
          expect(scene.served.stdout).not.toContain('🔴 missed');
          expect(scene.served.stdout).not.toContain('🟡 over-reach');
        });

        then('the run renders whole', () => {
          expect(
            asStableRoot({ stdout: scene.served.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });

      when('[t1] the same round is asked for json', () => {
        then('🔴 the payload carries the same figures, unrounded', () => {
          const doc = JSON.parse(scene.servedJson.stdout);
          expect(doc.prefix.sharedChars).toEqual(5_006);
          expect(doc.prefix.expectedTokens).toEqual(1_252);
          expect(doc.prefix.detectedTokens).toEqual(626);
          expect(doc.prefix.reach).toBeCloseTo(0.5, 3);
          expect(doc.prefix.verdict).toEqual('served');
          expect(doc.prefix.breaksIn).toEqual('tail');
          expect(doc.prefix.headChars).toEqual(4_000);
        });

        then('the prior round is named by its stone and iteration', () => {
          const doc = JSON.parse(scene.servedJson.stdout);
          expect(doc.prefix.prior.iteration).toEqual(1);
          expect(doc.prefix.round.iteration).toEqual(2);
        });
      });

      when('[t2] a round whose prefix held and whose cache served none', () => {
        then('🔴 it reads missed, marked 🔴', () => {
          expect(scene.missed.stdout).toContain('├─ prefix vs i1: 🔴 missed');
          expect(scene.missed.stdout).toContain(
            '├─ cache.get 0 tok · reach 0.0% of expected',
          );
        });

        then('the run renders whole', () => {
          expect(
            asStableRoot({ stdout: scene.missed.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });

      when('[t3] a multi-turn round that read its own turns', () => {
        then('🔴 it reads self-cached, with no reach to state', () => {
          expect(scene.selfCached.stdout).toContain(
            '├─ prefix vs i1: self-cached',
          );
          expect(scene.selfCached.stdout).toContain('· reach — of expected');
        });

        then(
          '🔴 the prefix it shares is 0 chars, and it breaks in the head',
          () => {
            expect(scene.selfCached.stdout).toContain(
              '├─ expected 0 tok est. (0 chars shared with i1)',
            );
            expect(scene.selfCached.stdout).toContain(
              '└─ prefix breaks in: head',
            );
          },
        );

        then('the run renders whole', () => {
          expect(
            asStableRoot({ stdout: scene.selfCached.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });

      when('[t4] a round whose cache read more than the prefix holds', () => {
        then('🔴 it reads over-reach, marked 🟡', () => {
          expect(scene.overReach.stdout).toContain(
            '├─ prefix vs i1: 🟡 over-reach',
          );
          expect(scene.overReach.stdout).toContain(
            '├─ cache.get 600 tok · reach 240.0% of expected',
          );
        });

        then('the run renders whole', () => {
          expect(
            asStableRoot({ stdout: scene.overReach.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });

      when("[t5] a lane's first round", () => {
        then('🔴 it reads absent, never a 0% prefix', () => {
          expect(scene.first.stdout).toContain(
            '├─ prefix: —  (the first round of lane-served in this tree)',
          );
          expect(scene.first.stdout).not.toContain('of expected');
        });
      });

      when('[t6] the tree is priced', () => {
        then('it exits clean', () => {
          expect(scene.atTree.exitCode).toEqual(0);
        });

        then('🔴 one row under the cache lever counts every verdict', () => {
          expect(scene.atTree.stdout).toContain(
            '└─ prefix:    1 served · 🔴 1 missed · 1 self-cached · 🟡 1 over-reach · 0 unshared',
          );
        });

        then('the json carries the same counts and every pair', () => {
          const doc = JSON.parse(scene.atTreeJson.stdout);
          expect(doc.prefix.verdicts).toEqual({
            pairs: 4,
            served: 1,
            missed: 1,
            selfCached: 1,
            overReach: 1,
            unshared: 0,
            unmeasured: 0,
          });
          expect(doc.prefix.pairs).toHaveLength(4);
        });

        then('the tree renders whole', () => {
          expect(
            asStableRoot({ stdout: scene.atTree.stdout, root: scene.tree }),
          ).toMatchSnapshot();
        });
      });

      when('[t7] the grove is priced', () => {
        then('it exits clean AND speaks its status on stderr', () => {
          expectGroveExitedCleanAndSpoke({ run: scene.atGrove });
        });

        then('🔴 the grove row reads the same counts as its one tree', () => {
          expect(scene.atGrove.stdout).toContain(
            '└─ prefix:    1 served · 🔴 1 missed · 1 self-cached · 🟡 1 over-reach · 0 unshared',
          );
        });

        then('the json carries the same counts', () => {
          const doc = JSON.parse(scene.atGroveJson.stdout);
          expect(doc.prefix.verdicts.pairs).toEqual(4);
          expect(doc.prefix.verdicts.missed).toEqual(1);
        });

        then('the grove renders whole', () => {
          expect(
            asStableRoot({ stdout: scene.atGrove.stdout, root: scene.grove }),
          ).toMatchSnapshot();
        });
      });
    },
  );
});

/**
 * .what = seeds one review run whose prompt bytes, static head, and cache read are declared
 * .why = the prefix rows pair consecutive rounds of ONE reviewer and compare their prompts
 *        byte by byte, so a fixture must control the lane, the mint order, the bytes, and
 *        the bill at once. every round bills `round(len / 4)` prompt tokens, so the ratio
 *        the meter derives is the one each case states in prose
 *
 * .note = the compiled census names two rows that sum to the prompt's length, as the
 *         meter's reader demands of every compiled artifact
 */
const setOnePrefixRun = (input: {
  tree: string;
  name: string;
  route: string;
  slug: string;
  round: string;
  prompt: string;
  head: number;
  cacheGet: number;
  /** fresh input tokens — null bills the rest of the prompt as fresh input */
  input_: number | null;
}): void => {
  const dir = path.join(input.tree, DIR_OF_REVIEW_LOGS, input.name);
  fs.mkdirSync(dir, { recursive: true });

  // the guard identity rides the --output path, as a guard round writes it
  const leaf = `5.1.execution.from_vision._.review.${input.round}.abc1234.r000._.given.by_peer.${input.slug}.report.md`;
  fs.writeFileSync(
    asRunArtifactPath({ dir, artifact: 'args' }),
    JSON.stringify({
      args: {
        output: path.join(input.route, '.reviews', 'peer', leaf),
        focus: 'push',
      },
      scope: { ruleFiles: ['a.md'], refFiles: [], targetFiles: ['x.ts'] },
    }),
  );
  fs.writeFileSync(
    asRunArtifactPath({ dir, artifact: 'prompt' }),
    input.prompt,
  );
  fs.writeFileSync(
    asRunArtifactPath({ dir, artifact: 'compiled' }),
    JSON.stringify({
      prompt: { chars: input.prompt.length, cacheable: { head: input.head } },
      inputs: {
        rules: { chars: input.head, count: 1 },
        targetFiles: { chars: input.prompt.length - input.head, count: 1 },
      },
    }),
  );

  // the bill, at 4 chars per token over the whole prompt
  const promptTokens = Math.round(input.prompt.length / 4);
  fs.writeFileSync(
    asRunArtifactPath({ dir, artifact: 'realized' }),
    JSON.stringify({
      tokens: {
        input: input.input_ ?? promptTokens - input.cacheGet,
        inputCacheCreation: 0,
        inputCacheRead: input.cacheGet,
        output: 100,
      },
      cost: { total: '$0.0100' },
    }),
  );
};
