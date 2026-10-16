import { execSync } from 'child_process';
import * as fs from 'fs';
import { getError, UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import {
  DEFAULT_TEST_BRAIN,
  genTestBrainContext,
} from '@src/.test/genTestBrainContext';
import { BRAIN_CALL_TEST_TIMEOUT_MS } from '@src/.test/infra/brainCallTestTimeout';
import { NAME_OF_RUN_ARTIFACT } from '@src/domain.operations/review/asRunArtifactPath';

import { stepReview } from './stepReview';

// eslint-disable-next-line no-undef
jest.setTimeout(BRAIN_CALL_TEST_TIMEOUT_MS);

/**
 * .what = git identity env for commits
 * .why = avoids a global git config requirement on cicd machines
 */
const GIT_ENV = {
  ...process.env,
  GIT_AUTHOR_NAME: 'Test User',
  GIT_AUTHOR_EMAIL: 'test@test.com',
  GIT_COMMITTER_NAME: 'Test User',
  GIT_COMMITTER_EMAIL: 'test@test.com',
};

/**
 * .what = the retry contract every llm-driven suite here carries
 * .why = `stepReview` reaches a live provider, so a transient refusal or a slow
 *        call can redden a claim the provider never participated in
 *        (rule.require.repeatable-for-llm-tests)
 *
 * 🟡 .note = the bound is declared, so a reader does not read more protection here
 *         than it gives. each case's brain call sits in its `useBeforeAll`, so it
 *         runs ONCE and the retries re-assert against one fixture. what that buys
 *         is resistance to a flaky ASSERTION; it does not re-drive a call that
 *         failed. the cases below are shaped so that matters little — every
 *         assertion reads an artifact `stepReview` wrote BEFORE the brain was
 *         reached, and each case wraps its call in `getError` for the same reason.
 *
 * @see .agent/repo=.this/role=any/briefs/rule.require.repeatable-for-llm-tests.md
 */
const REPEATABLE_CONFIG = {
  attempts: 3,
  criteria: process.env.CI ? 'SOME' : 'EVERY',
} as const;

/**
 * .what = writes a file, parents and all
 * .why = the fixtures are nested three deep under a route variant
 */
const setOneFile = (input: { at: string; text: string }): void => {
  fs.mkdirSync(path.dirname(input.at), { recursive: true });
  fs.writeFileSync(input.at, input.text, 'utf-8');
};

/**
 * .what = the seven target files, by whether the default exclusion keeps them
 * .why = one table, read by the fixture AND by every assertion — so a case can
 *        never grade a file the fixture did not write
 */
const TARGETS_DROPPED = [
  '.dream/v2026_09_24.fix.a-defect-nobody-repaired.md',
  'pnpm-lock.yaml',
  '.behavior/v2026_09_24.demo/0.wish.md',
  '.behavior/v2026_09_24.demo/.reviews/peer/1.vision._.given.by_peer.md',
] as const;

const TARGETS_KEPT = [
  'src/paddleOut.ts',
  '.behavior/v2026_09_24.demo/.seeds/inventory.of=seeds._.md',
  '.behavior/v2026_09_24.demo/1.vision.yield.md',
] as const;

/**
 * .what = a temp git repo whose `--diffs since-main` range holds both classes
 * .why = 🔴 the DIFFS side is the whole point. an exclusion expressed as a
 *        negative glob binds only the `--paths` side, so a fixture that reaches
 *        this filter through `--paths` would pass while the real defect ships.
 *        every guard-run lane in this repo is diffs-driven.
 */
const setOneRepoWithBothClasses = (input: { slug: string }): string => {
  const cwd = genTempDir({ slug: input.slug, git: false });

  // main holds the rubric alone, so every target below lands in the range
  setOneFile({
    at: path.join(cwd, 'rules/rule.name-the-actor.md'),
    text: '# rule.name-the-actor\n\nname the actor, then the act.\n',
  });
  execSync('git init --quiet', { cwd, stdio: 'pipe' });
  execSync('git add .', { cwd, stdio: 'pipe' });
  execSync('git commit -m base', { cwd, stdio: 'pipe', env: GIT_ENV });
  execSync('git branch -M main', { cwd, stdio: 'pipe' });
  execSync('git checkout -q -b feat/demo', { cwd, stdio: 'pipe' });

  // every target carries a UNIQUE marker, so a prompt assertion cannot pass on
  // a neighbour's bytes
  for (const target of [...TARGETS_DROPPED, ...TARGETS_KEPT])
    setOneFile({
      at: path.join(cwd, target),
      text: `marker-for ${target}\n\nthe wave was handled by the surfer.\n`,
    });

  return cwd;
};

/**
 * .what = the scope debug record the run wrote
 * .why = written BEFORE validation, so it is readable on a refusal too
 */
const getOneScopeDebug = (input: {
  cwd: string;
}): {
  args: { polluters: string };
  resolution: {
    targetFiles: string[];
    targetFilesDropped: string[];
    targetFilesAskedForByName: string[];
  };
} => {
  const root = path.join(input.cwd, '.log/bhrain/review');
  const runs = fs.readdirSync(root).sort();
  const latest = runs[runs.length - 1];
  if (!latest)
    throw new UnexpectedCodePathError('no review log dir under the fixture', {
      root,
      hint: 'the review never minted a log dir; check the stepReview call above threw no error and ran under this cwd',
    });
  return JSON.parse(
    fs.readFileSync(path.join(root, latest, 'input.scope.debug.json'), 'utf-8'),
  );
};

/**
 * .what = the filenames the run landed in its log dir, sorted
 * .why = the census `[t1]` grades the artifact-name grammar against. it reads the
 *        DIR rather than a list, so an artifact added from a bare literal shows
 *        up here whether or not anyone declared it
 */
const getAllArtifactsWritten = (input: { cwd: string }): string[] => {
  const root = path.join(input.cwd, '.log/bhrain/review');
  const runs = fs.readdirSync(root).sort();
  const latest = runs[runs.length - 1];
  if (!latest)
    throw new UnexpectedCodePathError('no review log dir under the fixture', {
      root,
      hint: 'the review never minted a log dir; check the stepReview call above threw no error and ran under this cwd',
    });
  return fs.readdirSync(path.join(root, latest)).sort();
};

/**
 * .what = the prompt the run actually sent
 * .why = the scope record states intent; the prompt is the evidence
 */
const getOnePromptSent = (input: { cwd: string }): string => {
  const root = path.join(input.cwd, '.log/bhrain/review');
  const runs = fs.readdirSync(root).sort();
  return fs.readFileSync(
    path.join(root, runs[runs.length - 1]!, 'input.prompt.md'),
    'utf-8',
  );
};

/**
 * 🔴 .mock = NONE. every case drives the REAL `stepReview` orchestrator over a
 * real git repo and a real `--diffs since-main` range.
 *
 * 🔴 .why no case depends on the brain's VERDICT =
 *   every claim this suite makes is settled BEFORE the provider is called.
 *   `setInputArtifacts` lands `input.scope.debug.json` and `input.prompt.md`
 *   at `stepReview.ts:849`; the `ask()` is at `:946`. so the scope is composed,
 *   the prompt is rendered, and both are on disk while the brain is still
 *   untouched.
 *
 *   ⇒ so each case reads those two artifacts and lets the brain call land
 *   wherever it lands. a provider outage, a spend cap, or a rate limit then
 *   cannot turn a green contract into a red suite — which matters most here,
 *   because a scope filter is exactly the kind of defect that must stay
 *   detectable when the money is off.
 *
 *   🟡 `[case1]` goes further and never reaches the brain at all: its scope
 *   resolves to zero files, and that refusal precedes the call outright.
 *
 * .why an integration suite rather than the unit clamp alone =
 *   `isTargetPolluter.test` grades the DECISION over path strings. it cannot see
 *   whether `stepReview` ever consults it, nor which of the two target sources
 *   the consult reaches. this suite drives the real orchestrator and reads what
 *   the prompt actually carried
 *   (rule.require.exclude-review-scope-polluters).
 */
describe('stepReview — the default scope exclusion', () => {
  const scene = useBeforeAll(async () => ({
    brain: await genTestBrainContext({ brain: DEFAULT_TEST_BRAIN }),
  }));

  given('[case1] a diff range that holds ONLY polluters', () => {
    const run = useBeforeAll(async () => {
      const cwd = genTempDir({ slug: 'review-polluters-only', git: false });
      setOneFile({
        at: path.join(cwd, 'rules/rule.name-the-actor.md'),
        text: '# rule.name-the-actor\n\nname the actor.\n',
      });
      execSync('git init --quiet', { cwd, stdio: 'pipe' });
      execSync('git add .', { cwd, stdio: 'pipe' });
      execSync('git commit -m base', { cwd, stdio: 'pipe', env: GIT_ENV });
      execSync('git branch -M main', { cwd, stdio: 'pipe' });
      execSync('git checkout -q -b feat/demo', { cwd, stdio: 'pipe' });
      for (const target of TARGETS_DROPPED)
        setOneFile({ at: path.join(cwd, target), text: 'marker\n' });

      /**
       * 🔴 the refusal's DETAIL lands on stderr, never on the error.
       *
       * `emitReviewRefusal` writes the tree; the `BadRequestError` beneath it
       * carries the headline alone. so a test that reads only `error.message`
       * proves the run HALTED and proves naught about whether the halt named
       * its fix — and to name the fix is the whole reason those lines exist
       * (rule.require.errors-name-the-fix).
       *
       * .note = deliberate mutation, in a scoped zone. `lines` accumulates via
       *         `push` and `console.error` is swapped for the call — both are
       *         mutations `rule.require.immutable-vars` forbids by default, and
       *         both are isolated to this block. a sink cannot accumulate
       *         immutably without a `let`, which is the worse of the two.
       *
       * .note = the swap is restored in a `finally`. a throw between the swap
       *         and the restore would otherwise leave every SIBLING case with a
       *         patched `console.error` — a hidden side effect across test
       *         boundaries, and one that would surface as an unrelated suite
       *         gone quiet rather than as a failure here
       *         (rule.forbid.hidden-side-effects).
       */
      const lines: string[] = [];
      const emitStderrBefore = console.error;
      console.error = (...args: unknown[]) => void lines.push(args.join(' '));

      const error = await (async () => {
        try {
          return await getError(
            stepReview(
              {
                rules: 'rules/**/*.md',
                diffs: 'since-main',
                output: path.join(cwd, 'review.md'),
                focus: 'push',
                goal: 'representative',
                cwd,
              },
              { brain: scene.brain },
            ),
          );
        } finally {
          console.error = emitStderrBefore;
        }
      })();

      return {
        cwd,
        error,
        stderr: lines.join('\n'),
        debug: getOneScopeDebug({ cwd }),
      };
    });

    /**
     * 🟡 .note = a bare `when`, and the ONE case here that earns it. this case
     *         asserts the refusal, which `stepReview` raises BEFORE it reaches a
     *         brain — proven by the `review.md` assertion below. so no provider
     *         participates, and `rule.require.repeatable-for-llm-tests` states its
     *         own carve-out for exactly that: *"tests error conditions before LLM
     *         invocation"*. the three cases beneath it DO reach a provider and each
     *         carries `when.repeatably`.
     */
    when('[t0] the review runs', () => {
      then('🔴 the scope resolves to zero — every target was dropped', () => {
        expect(run.error).toBeDefined();
        expect(run.error.message).toContain(
          'combined scope resolves to zero files',
        );
      });

      then('the drop is recorded by NAME, never as a count', () => {
        expect(run.debug.resolution.targetFilesDropped.sort()).toEqual(
          [...TARGETS_DROPPED].sort(),
        );
      });

      then('and the scope it carried is empty', () => {
        expect(run.debug.resolution.targetFiles).toEqual([]);
      });

      then('🟡 and NO brain was called — the refusal precedes it', () => {
        expect(fs.existsSync(path.join(run.cwd, 'review.md'))).toEqual(false);
      });

      /**
       * 🔴 the halt is the cheap half. a caller whose globs matched only route
       * paperwork sees a joined count above zero and a final count of zero —
       * which reads as a broken glob, so they re-tune a glob that was correct.
       *
       * ⇒ these four assertions are the only thing that parts a refusal from a
       * dead end. without them, the hint block could be deleted outright and
       * every assertion above stays green.
       */
      then('🔴 the refusal names the exclusion as the cause', () => {
        expect(run.stderr).toContain('polluters:');
        expect(run.stderr).toContain('dropped by default');
      });

      then('🔴 and it names the ESCAPE — the flag, verbatim', () => {
        expect(run.stderr).toContain('--polluters keep');
      });

      then('🔴 and it names the by-name exemption too', () => {
        expect(run.stderr).toContain('name them in --paths');
      });

      // .why = the allowlist is what a driver needs to know WHICH of their files
      //        survived; a count of drops alone cannot answer that
      then('🟡 and it states what a route KEEPS', () => {
        expect(run.stderr).toContain('.fulcrums/*._.md, .seeds/**, *.yield.md');
      });

      // .why = the phrases above pin what the refusal SAYS; this pins how it is
      //        laid out — the rails, the branch order, the blank line between the
      //        scope dump and the hint block. the temp dir and the log-dir stamp
      //        vary per run, so both are masked first
      then('the assembled refusal matches the snapshot', () => {
        const stderrStable = run.stderr
          .split(run.cwd)
          .join('$CWD')
          .replace(/\d{4}-\d{2}-\d{2}T[0-9-]+Z[.\w-]*/g, '$STAMP');
        expect(stderrStable).toContain(
          '✋ ConstraintError: combined scope resolves to zero files',
        );
        expect(stderrStable).toContain('─ polluters: 4 dropped by default');
        expect(stderrStable).toContain(
          '✨ did you know?\n   └─ inspect .log/bhrain/review/$STAMP/input.scope.debug.json',
        );
        expect(stderrStable).not.toContain('hint:');
        expect(stderrStable).toMatchSnapshot();
      });
    });
  });

  given('[case2] a diff range that holds both classes', () => {
    const run = useBeforeAll(async () => {
      const cwd = setOneRepoWithBothClasses({ slug: 'review-polluters-mixed' });

      // 🔴 the verdict is irrelevant here — the scope and the prompt are both on
      // disk before the brain is reached, so a provider failure must not redden
      // a claim the provider never participated in
      await getError(
        stepReview(
          {
            rules: 'rules/**/*.md',
            diffs: 'since-main',
            output: path.join(cwd, 'review.md'),
            focus: 'push',
            goal: 'representative',
            cwd,
          },
          { brain: scene.brain },
        ),
      );
      return {
        cwd,
        debug: getOneScopeDebug({ cwd }),
        prompt: getOnePromptSent({ cwd }),
        artifacts: getAllArtifactsWritten({ cwd }),
      };
    });

    when.repeatably(REPEATABLE_CONFIG)('[t0] the review runs', () => {
      then('the three allowlisted targets survive', () => {
        expect(run.debug.resolution.targetFiles.sort()).toEqual(
          [...TARGETS_KEPT].sort(),
        );
      });

      then('the four polluters are dropped', () => {
        expect(run.debug.resolution.targetFilesDropped.sort()).toEqual(
          [...TARGETS_DROPPED].sort(),
        );
      });

      then('🔴 and NOT ONE polluter reached the prompt', () => {
        for (const target of TARGETS_DROPPED)
          expect(run.prompt).not.toContain(`marker-for ${target}`);
      });

      then('🟡 while every allowlisted target DID', () => {
        for (const target of TARGETS_KEPT)
          expect(run.prompt).toContain(`marker-for ${target}`);
      });
    });

    /**
     * 🔴 .why = the CLAMP on the artifact-name grammar, and the only one that can
     *        bite. `asRunArtifactPath` opens *"every artifact a review run writes
     *        into its log dir"* — a claim about a set, which no test of the map's
     *        own contents can check, because a map cannot report what it omits.
     *
     *        ⚠️ and the claim was FALSE for as long as it stood, by SIX. four
     *        artifacts were written from bare literals inside `stepReview`'s own
     *        narrative (`input.scope.json`, `input.scope.debug.json`, and the two
     *        token breakdowns) and **two more from inside a named writer** —
     *        `setOutputArtifacts` re-typed `output.response.json` and
     *        `output.review.md` over a local `path.join`.
     *
     * 🔴 those last two are what earn this clamp rather than a careful re-read.
     *   the four were findable by eye: they sit in the orchestrator the concern
     *   named. the two inside a WRITER are not — a reader who audits the
     *   orchestrator for raw i/o finds a tidy `setOutputArtifacts({…})` call
     *   and stops, which is exactly what happened. ⇒ this case read the DIR, so
     *   it could not care where a write was typed.
     *
     * ⇒ it asserts the direction that catches the defect: every file the run
     *   LANDED is one the map NAMES. the inverse would be brittle here by
     *   construction — this case lets the brain call fail, so `metrics.realized`
     *   is legitimately absent on a provider outage.
     *
     * 🟡 proven red 2026-09-25, twice over.
     *   · on its FIRST run, against the two writer-typed literals above — 4 red,
     *     53 green. a clamp that bit a LIVE defect rather than a seeded one
     *   · and under a deliberate neuter (`setScopeArtifact` reverted to a bare
     *     `path.join` over a literal) — 6 red of 56, and the 50 green are the
     *     measurement that matters: no other case in this suite can see a write
     *     land under a name the grammar never declared
     */
    when.repeatably(REPEATABLE_CONFIG)(
      '[t1] a reader reaches for the artifact grammar',
      () => {
        then('🔴 every artifact the run wrote is one the map NAMES', () => {
          const named = new Set<string>(Object.values(NAME_OF_RUN_ARTIFACT));
          const unnamed = run.artifacts.filter((file) => !named.has(file));
          expect(unnamed).toEqual([]);
        });

        then('🟡 and the run wrote the four that were absent from it', () => {
          // the clamp above passes vacuously against an empty dir, so this one
          // proves the case exercises the four artifacts that carried the defect
          expect(run.artifacts).toContain(NAME_OF_RUN_ARTIFACT.scope);
          expect(run.artifacts).toContain(NAME_OF_RUN_ARTIFACT.scopeDebug);
          expect(run.artifacts).toContain(NAME_OF_RUN_ARTIFACT.tokensJson);
          expect(run.artifacts).toContain(NAME_OF_RUN_ARTIFACT.tokensMarkdown);
        });
      },
    );
  });

  given('[case3] the same range, under --polluters keep', () => {
    /**
     * .why = the default must never become a wall. a driver who reviews the
     *        route machinery itself has a real subject
     *        (rule.prefer.defaults-match-common-case)
     */
    const run = useBeforeAll(async () => {
      const cwd = setOneRepoWithBothClasses({ slug: 'review-polluters-keep' });

      // the verdict is irrelevant here too — see the note on [case2]
      await getError(
        stepReview(
          {
            rules: 'rules/**/*.md',
            diffs: 'since-main',
            polluters: 'keep',
            output: path.join(cwd, 'review.md'),
            focus: 'push',
            goal: 'representative',
            cwd,
          },
          { brain: scene.brain },
        ),
      );
      return {
        debug: getOneScopeDebug({ cwd }),
        prompt: getOnePromptSent({ cwd }),
      };
    });

    when.repeatably(REPEATABLE_CONFIG)('[t0] the review runs', () => {
      then('all seven targets survive', () => {
        expect(run.debug.resolution.targetFiles.sort()).toEqual(
          [...TARGETS_DROPPED, ...TARGETS_KEPT].sort(),
        );
      });

      then('naught is dropped', () => {
        expect(run.debug.resolution.targetFilesDropped).toEqual([]);
      });

      then('🟡 the by-name list is empty — a DIFFERENT reason', () => {
        // under `keep`, every polluter survives the mode, so none survives by
        // name. the empty list here and the populated one in [case4] are what
        // let a reader tell the two exemptions apart; `args.polluters` below
        // is the discriminator
        expect(run.debug.resolution.targetFilesAskedForByName).toEqual([]);
      });

      then('🔴 and the polluters DO reach the prompt', () => {
        for (const target of TARGETS_DROPPED)
          expect(run.prompt).toContain(`marker-for ${target}`);
      });

      then('the mode is recorded, so the run is self-explanatory', () => {
        expect(run.debug.args.polluters).toEqual('keep');
      });
    });
  });

  given('[case4] 🔴 a lane whose SUBJECT is the route deliverable', () => {
    /**
     * 🔴 the regression the default introduced, and the reason the exemption
     *    exists. this repo holds **78 binds across 38 guards** of exactly this
     *    shape — a stage lane that reviews the route's own artifact:
     *
     *      --diffs since-main --paths-with '$route/3.3.blueprint.*.md' --join intersect
     *
     *    under a side-blind drop the scope empties and the lane refuses before
     *    the brain is reached. so this case drives the real shape end to end:
     *    a `--paths` glob that names paperwork, intersected with a real
     *    `--diffs` range.
     *
     * 🟡 it is the INTEGRATION half of `getAllTargetsAskedForByName.test`. that
     *    clamp grades the decision over string lists; only this one proves
     *    `stepReview` consults it at all.
     */
    const run = useBeforeAll(async () => {
      const cwd = setOneRepoWithBothClasses({ slug: 'review-polluters-named' });

      await getError(
        stepReview(
          {
            rules: 'rules/**/*.md',
            diffs: 'since-main',
            paths: '.behavior/v2026_09_24.demo/0.wish.md',
            output: path.join(cwd, 'review.md'),
            focus: 'push',
            goal: 'representative',
            cwd,
          },
          { brain: scene.brain },
        ),
      );
      return {
        debug: getOneScopeDebug({ cwd }),
        prompt: getOnePromptSent({ cwd }),
      };
    });

    when.repeatably(REPEATABLE_CONFIG)('[t0] the review runs', () => {
      then('🔴 the named polluter SURVIVES — it is the subject', () => {
        expect(run.debug.resolution.targetFiles).toEqual([
          '.behavior/v2026_09_24.demo/0.wish.md',
        ]);
      });

      then('🔴 and naught is dropped — it never rode in', () => {
        expect(run.debug.resolution.targetFilesDropped).toEqual([]);
      });

      then('🔴 and the record says WHY it survived, by name', () => {
        // a drop list alone cannot answer "why is this polluter HERE?" — the
        // empty `targetFilesDropped` above is equally true of a broken filter.
        // this field is the one that parts the two
        expect(run.debug.resolution.targetFilesAskedForByName).toEqual([
          '.behavior/v2026_09_24.demo/0.wish.md',
        ]);
      });

      then('🟡 and it reached the prompt, so the lane can grade it', () => {
        expect(run.prompt).toContain(
          'marker-for .behavior/v2026_09_24.demo/0.wish.md',
        );
      });

      then('🟡 the mode is still the DEFAULT — no override was needed', () => {
        expect(run.debug.args.polluters).toEqual('drop');
      });
    });
  });
});
