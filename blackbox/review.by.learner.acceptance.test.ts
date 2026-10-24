import { UnexpectedCodePathError } from 'helpful-errors';
import * as fs from 'fs';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import { DEFAULT_TEST_BRAIN_VIA_CLI } from '@src/.test/genTestBrainContext';
import { BRAIN_CALL_TEST_TIMEOUT_MS } from '@src/.test/infra/brainCallTestTimeout';
import {
  genReviewByFixture,
  invokeReviewByRoleViaRhx,
  invokeReviewBySkill,
  sanitizeRawReviewForSnapshot,
  sanitizeReviewByOutputForSnapshot,
} from './.test/invokeReviewBySkill';
import { maskApprovedOutcome } from './.test/maskApprovedOutcome';
import { maskConcernMagnitudes } from './.test/maskConcernMagnitudes';
import { maskVerdictCounts } from './.test/maskVerdictCounts';

/**
 * .what = the raw review chrome of a PASS case, with the brain's free choices masked
 * .why = on clean code the contract is `0 blockers` and exit 0. how many nitpicks the brain
 *        raises is its own choice, and it flips the vibe line and the summary's last row. a
 *        snapshot that pinned `not even a vole` went red in ci run 40052613926 when the brain
 *        drew one nitpick, with `0 blockers` and exit 0 both intact
 */
const asPassChrome = (input: { stdout: string }): string =>
  maskApprovedOutcome(
    maskConcernMagnitudes(sanitizeRawReviewForSnapshot(input.stdout)),
  );

const ASSETS_DIR = path.join(
  __dirname,
  '.test/assets/codebase-review-by-learner',
);

/**
 * .what = the scope every "clean" case reviews — the clean target AND the glossary its terms
 *         are itemized in
 * .why = the term-aggregation rubric's one rule makes a declared operation whose terms are not
 *        itemized a blocker. the shared `codebase-review-by/src/clean.ts` declares two
 *        operations and its fixture holds no glossary, so a model that rejected it read the rule
 *        correctly — and a test that pinned `exit 0` on it pinned a coin flip. here the target is
 *        clean by the rubric's own definition, and the glossary rides in scope so the reviewer
 *        can see that it is
 */
const PATHS_OF_CLEAN =
  '{src/clean.terms.ts,.agent/repo=.this/role=any/briefs/domain.terms/*.md}';

/**
 * .what = raise the per-test timeout above the 90s shared default (jest.acceptance.env.ts)
 * .why = every case drives a real brain review through the CLI, and [case-all] + [case-wrapper]
 *        drive BOTH rubrics — two brain calls in series. the CLI selects only the package's
 *        LISTED slugs, so these cases ride the bare tier (DEFAULT_TEST_BRAIN_VIA_CLI), whose
 *        default supply can land on a host that serves below its speed floor. measured
 *        2026-10-05: one-rubric cases ran up to 229s; two-rubric cases ran 105–453s, and one
 *        crossed 600s on a correct review. tests assert correctness, never latency, so the bound
 *        is the shared per-call bound × the calls in this file's heaviest case. scoped to THIS
 *        file so other acceptance suites keep the tighter default.
 */
const CALLS_IN_HEAVIEST_CASE = 2;
// eslint-disable-next-line no-undef
jest.setTimeout(BRAIN_CALL_TEST_TIMEOUT_MS * CALLS_IN_HEAVIEST_CASE);

/**
 * .what = config for probabilistic cases that invoke LLM review subprocesses
 * .why = LLM responses vary; retry keeps CI green while it still verifies the contract
 * @see .agent/repo=.this/role=any/briefs/rule.require.repeatable-for-llm-tests.md
 */
const REPEATABLE_CONFIG = {
  attempts: 3,
  // `'SOME'` locally would let a 2-of-3 defect read green on a developer's machine, the
  // cheapest place to diagnose it. CI keeps `'SOME'` so a probabilistic lane does not redden
  // a shared pipeline (rule.require.repeatable-for-llm-tests).
  criteria: process.env.CI ? 'SOME' : 'EVERY',
} as const;

/**
 * .what = reads each review file the cli named in its stdout, from the fixture cwd
 * .why = a refused review states its blocker only in the review file, and the fixture lives in
 *        a temp dir that is gone or out of reach once the run ends. without the body, a red
 *        verdict on a clean fixture cannot be told apart from a flake or a prompt regression
 */
const asReviewBodiesFromStdout = (input: {
  stdout: string;
  cwd: string;
}): string => {
  // collect the distinct review paths the cli printed
  const paths = [
    ...new Set(
      [...input.stdout.matchAll(/(?:review|given): (\.reviews\/\S+\.md)/g)].map(
        (match) => match[1]!,
      ),
    ),
  ];
  if (paths.length === 0) return '  (no review path in stdout)';

  // render each body, or say plainly that it is absent
  return paths
    .map((one) => {
      const abs = path.join(input.cwd, one);
      const body = fs.existsSync(abs)
        ? fs.readFileSync(abs, 'utf8').trimEnd()
        : '(absent on disk)';
      return [`--- ${one} ---`, body].join('\n');
    })
    .join('\n\n');
};

/**
 * .what = asserts the cli exited with the expected code, and shows its output when it did not
 * .why = `expect(cli.code).toBe(0)` reports `Expected: 0 / Received: 2` and discards every
 *        byte the subprocess wrote, so a failure here says a live review refused (or
 *        rubber-stamped) and never says why. this suite drives a real brain, so its failures
 *        most need a diagnosis (rule.require.failloud, rule.require.errors-name-the-fix).
 */
const assureCliExitedAs = (input: {
  cli: { code: number; stdout: string; stderr: string };
  cwd: string;
  code: number;
}): void => {
  if (input.cli.code === input.code) return;
  throw new UnexpectedCodePathError(
    [
      `the review cli exited ${input.cli.code}, expected ${input.code}`,
      '',
      'stderr:',
      input.cli.stderr.trimEnd() || '  (empty)',
      '',
      'stdout (tail):',
      input.cli.stdout.trimEnd().split('\n').slice(-20).join('\n') || '  (empty)',
      '',
      'reviews written:',
      asReviewBodiesFromStdout({ stdout: input.cli.stdout, cwd: input.cwd }),
    ].join('\n'),
    {
      code: input.cli.code,
      hint: 'read the stderr above: a `✋ ConstraintError:` names a fixture or flag to fix; a `💥 MalfunctionError:` names a brain or credential fault — unlock keyrack via `rhx keyrack unlock --owner ehmpath --env test` and rerun. a timeout or an empty stderr names a slow or hung brain call — rerun this file alone, or raise its per-test budget if it is red only under full-suite load. a clean exit where 2 was expected names a rubber-stamp — read the review body above',
    },
  );
};

/**
 * .what = asserts the cli exited clean (0)
 * .why = the common case of assureCliExitedAs, named for what the clean cases claim
 */
const assureCliExitedClean = (input: {
  cli: { code: number; stdout: string; stderr: string };
  cwd: string;
}): void => assureCliExitedAs({ ...input, code: 0 });

/**
 * .what = acceptance coverage for review.by against the REAL shipped learner role
 * .why = the demo fixture proves the engine; this proves review.by drives a real role's review
 *        set end-to-end. the learner ships two rubrics — term-application (3 rules: ambiguity,
 *        disadherence, inconsistency) and term-aggregation (1 rule: itemization). these cases
 *        cover BOTH grains the user asked for: each rubric alone via --for, and all rubrics at
 *        once. the fixture links the learner role so its rubrics.yml rule globs match.
 *
 * .note = the learner is linked beside reviewer via genReviewByFixture({ linkRoles: ['learner'] }),
 *         so `.agent/repo=bhrain/role=learner/briefs/…rule…md` matches in the temp cwd.
 */
describe('review.by.learner.acceptance', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // the ergonomic form — `rhx review.by --role learner` resolves the learner's OWN wrapper
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-wrapper] the clean `rhx review.by --role learner` form', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] rhx resolves the learner-owned review.by wrapper',
      () => {
        const res = useThen('the wrapper runs and delegates to the base', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-learner-wrapper',
            clone: ASSETS_DIR,
            linkRoles: ['learner'],
          });
          const cli = await invokeReviewByRoleViaRhx({
            role: 'learner',
            paths: PATHS_OF_CLEAN,
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli, cwd };
        });

        then('exit 0 — the wrapper resolved, no "no skill found" error', () => {
          // this is the crux of the wrapper pattern: `rhx review.by --role learner` MUST find the
          // learner's OWN review.by skill (its wrapper). if the learner shipped no wrapper, rhachet
          // would fail with `no skill "review.by" found with --role learner` and a nonzero exit.
          assureCliExitedClean({ cli: res.cli, cwd: res.cwd });
          expect(res.cli.stderr).not.toContain('no skill');
        });

        then('both learner rubrics ran via the delegated base', () => {
          // the mark is read PER RUBRIC: a bare `✓` anywhere would also match the
          // `0 nitpicks ✓` row a REJECTED rubric streams, so it proves naught about both
          expect(res.cli.stdout).toContain('r1 term-application ✓');
          expect(res.cli.stdout).toContain('r2 term-aggregation ✓');
        });

        then('the settled tree matches snapshot', () => {
          // the verdict is a brain's, and each attempt keys its own snapshot, so the clean
          // marks assert FIRST: a rejected attempt fails here, loud, before it ever reaches
          // toMatchSnapshot — else a `--resnap` would pin the rejected tree as truth
          expect(res.cli.stdout).toContain('r1 term-application ✓');
          expect(res.cli.stdout).toContain('r2 term-aggregation ✓');
          expect(
            sanitizeReviewByOutputForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // all rubrics at once — the full learner review set
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-all] the learner review set on clean code', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] review.by --role learner (no --for) runs both rubrics',
      () => {
        // the label says what the body proves, and no more: it ran to completion. whether
        // both rubrics passed is what the `then`s below decide (rule.forbid.failhide).
        const res = useThen('the cli runs to completion', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-learner-all',
            clone: ASSETS_DIR,
            linkRoles: ['learner'],
          });
          const cli = await invokeReviewBySkill({
            role: 'learner',
            paths: PATHS_OF_CLEAN,
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli, cwd };
        });

        then('exit 0', () => {
          assureCliExitedClean({ cli: res.cli, cwd: res.cwd });
        });

        then('BOTH rubrics appear in the tree, EACH with a pass mark', () => {
          // proves review.by enumerated the two-rubric set AND that the 3-rule term-application
          // rubric loaded all its rules (the multi-rule comma-join path) — never a malfunction.
          expect(res.cli.stdout).toContain('term-application');
          expect(res.cli.stdout).toContain('term-aggregation');
          expect(res.cli.stdout).not.toContain('malfunctioned');

          // a bare `toContain('✓')` cannot tell an approval from a rejection:
          // `genReviewByStdout` renders a passed rubric `r1 <slug> ✓` and a rejected one
          // `r1 <slug> ✗` + `N blockers`, but the peer-style row above it carries `0
          // nitpicks ✓` even on a rejected rubric. so the mark is checked per rubric
          // (rule.forbid.failhide).
          expect(res.cli.stdout).toContain('r1 term-application ✓');
          expect(res.cli.stdout).toContain('r2 term-aggregation ✓');
        });

        then('stdout STREAMS each rubric as an incremental peer-style row — no silent wait', () => {
          // the cli streams each rubric to stdout as the same incremental peer-style row
          // route.stone.set renders (formatGuardReviewerTree): a `r{n}: {slug}` header + a
          // `given:` line per rubric, so a human never sits at a silent terminal
          // (rule.require.status-feedback). assert both rubrics stream that way, so both the
          // feedback and its peer-review conformance stay covered.
          expect(res.cli.stdout).toContain('r1: term-application');
          expect(res.cli.stdout).toContain('r2: term-aggregation');
          // the peer-style `given:` line — proof it went through formatGuardReviewerTree, not a
          // bespoke progress line
          expect(res.cli.stdout).toContain(
            'given: .reviews/by=learner/rubric=term-application.md',
          );
        });

        then('the settled tree matches snapshot', () => {
          // the clean marks lead, for the reason [case-wrapper] states: a rejected
          // attempt must never be the tree a `--resnap` pins
          expect(res.cli.stdout).toContain('r1 term-application ✓');
          expect(res.cli.stdout).toContain('r2 term-aggregation ✓');
          expect(
            sanitizeReviewByOutputForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // per-rubric via --for — the application rubric alone
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-app] --for term-application on clean code', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] only the application rubric runs',
      () => {
        const res = useThen('the application rubric runs alone and passes', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-learner-app',
            clone: ASSETS_DIR,
            linkRoles: ['learner'],
          });
          const cli = await invokeReviewBySkill({
            role: 'learner',
            for: 'term-application',
            paths: PATHS_OF_CLEAN,
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli, cwd };
        });

        then('exit 0', () => {
          assureCliExitedClean({ cli: res.cli, cwd: res.cwd });
        });

        then('disintermediates to the RAW review; only term-application, aggregation isolated out', () => {
          // `--for` disintermediates to the base review's stdout (no review.by tree), so a route
          // guard peer slot wraps a normal review. rule.require.review-by-disintermediates.
          expect(res.cli.stdout).not.toContain('review.by --role'); // no review.by chrome
          expect(res.cli.stdout).toContain('term-application'); // via the base review's `review:` path
          expect(res.cli.stdout).not.toContain('term-aggregation'); // the other rubric never ran
        });

        then('the raw review chrome matches snapshot', () => {
          // a clean exit asserts FIRST: a timed-out or rejected run fails here, loud, before it
          // reaches toMatchSnapshot — else a `--resnap` pins a truncated tree as truth
          assureCliExitedClean({ cli: res.cli, cwd: res.cwd });
          expect(asPassChrome({ stdout: res.cli.stdout })).toMatchSnapshot();
        });
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // per-rubric via --for — the aggregation rubric alone
  // ─────────────────────────────────────────────────────────────────────────

  given('[case-agg] --for term-aggregation on clean code', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] only the aggregation rubric runs',
      () => {
        const res = useThen('the aggregation rubric runs alone and passes', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-learner-agg',
            clone: ASSETS_DIR,
            linkRoles: ['learner'],
          });
          const cli = await invokeReviewBySkill({
            role: 'learner',
            for: 'term-aggregation',
            paths: PATHS_OF_CLEAN,
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli, cwd };
        });

        then('exit 0', () => {
          assureCliExitedClean({ cli: res.cli, cwd: res.cwd });
        });

        then('disintermediates to the RAW review; only term-aggregation, application isolated out', () => {
          // `--for` disintermediates to the base review's stdout (no review.by tree), so a route
          // guard peer slot wraps a normal review. rule.require.review-by-disintermediates.
          expect(res.cli.stdout).not.toContain('review.by --role'); // no review.by chrome
          expect(res.cli.stdout).toContain('term-aggregation'); // via the base review's `review:` path
          expect(res.cli.stdout).not.toContain('term-application'); // the other rubric never ran
        });

        then('the raw review chrome matches snapshot', () => {
          // a clean exit asserts FIRST: a timed-out or rejected run fails here, loud, before it
          // reaches toMatchSnapshot — else a `--resnap` pins a truncated tree as truth
          assureCliExitedClean({ cli: res.cli, cwd: res.cwd });
          expect(asPassChrome({ stdout: res.cli.stdout })).toMatchSnapshot();
        });
      },
    );
  });

  // ─────────────────────────────────────────────────────────────────────────
  // detection — the application rubric BITES on a term-dirty file
  // ─────────────────────────────────────────────────────────────────────────
  // the fixture `src/dirty.terms.ts` holds two term defects:
  // - inconsistency: one concept, a surfer's reserved lesson slot, under three words —
  //   `Reservation` / `getHold` / `cancelAppointment`
  // - ambiguity: `session` is a surf lesson (`Session`) AND an auth login (`openSession`)
  // its `.what` docs state each symbol's domain sense, as production code would, so the defects
  // are visible from the target alone. they never label the file a test fixture: a target that
  // calls itself deliberate invites the reviewer to excuse it. and with no docs at all, the
  // test brain cannot tie the three words to one concept, and answers `no issues found`.

  given('[case-detect] --for term-application on a term-dirty file', () => {
    when.repeatably(REPEATABLE_CONFIG)(
      '[t0] the application rubric detects a term violation',
      () => {
        const res = useThen('it finds a blocker on the dirty terms', async () => {
          const cwd = await genReviewByFixture({
            slug: 'review-by-learner-detect',
            clone: ASSETS_DIR,
            linkRoles: ['learner'],
          });
          const cli = await invokeReviewBySkill({
            role: 'learner',
            for: 'term-application',
            paths: 'src/dirty.terms.ts',
            brain: DEFAULT_TEST_BRAIN_VIA_CLI,
            cwd,
          });
          return { cli, cwd };
        });

        then('exit 2 — the rubric bites, it does not rubber-stamp', () => {
          // dirty.terms.ts names one concept (reserved lesson slot) with three words and overloads
          // 'session' for two concepts. the rubric must find at least one blocker, as proof it truly
          // reviews rather than a pass of all input. (a real detection, not a fake-0/0.)
          assureCliExitedAs({ cli: res.cli, cwd: res.cwd, code: 2 });
        });

        then('the header shows the blocker-tier owl vibe + a parseable summary', () => {
          expect(res.cli.stdout).toContain('needs your talons');
          expect(res.cli.stdout).toMatch(/\d+\s*blockers?/i);
          expect(res.cli.stdout).toMatch(/\d+\s*nitpicks?/i);
          // the snapshot below masks the count, so the floor it owes is stated here: NONZERO,
          // since `\d+` alone would match `0 blockers`, which is a pass, not a detection
          expect(res.cli.stdout).toMatch(/\b[1-9]\d*\s*blockers?/i);
        });

        then('the blocker-tier raw review is stable (full snapshot)', () => {
          // the exit asserts FIRST, so a `--resnap` cannot pin a rubber-stamp as truth. the
          // counts are a brain's, so they are masked; the tree shape around them is real.
          // the mask is the one `review.by.guard-peer` uses — `[N] <noun> [GLYPH]`,
          // glyph masked too, since it keys on whether the count is zero
          expect(res.cli.code).toBe(2);
          expect(
            maskVerdictCounts(sanitizeRawReviewForSnapshot(res.cli.stdout)),
          ).toMatchSnapshot();
        });
      },
    );
  });
});
