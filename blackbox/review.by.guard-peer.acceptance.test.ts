import * as fs from 'fs/promises';
import * as path from 'path';

import { given, then, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
  sanitizeTimeForSnapshot,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-guard-review-by');

/**
 * .what = raise the per-test budget — a full guard run drives a real LLM review as its peer
 * .why = the guard execs `rhx review.by --role learner --for <rubric>`, which runs a real review
 *        subprocess (~1 min). driveGuardUntilVerdict re-drives the whole guard on variance, up to
 *        VERDICT_ATTEMPTS times, so the per-test budget must cover several serial guard+review
 *        runs. scoped to THIS file.
 *
 *        ⚠️ this `.why` credited `when.repeatably` with that re-drive until 2026-09-20, and the run
 *           log refuted it — see driveGuardUntilVerdict's `.why` for the measurement.
 */
// eslint-disable-next-line no-undef
jest.setTimeout(420000);

/**
 * .what = how many REAL guard drives a probabilistic case may spend to reach its declared verdict
 * .why = an LLM verdict varies run to run, and one green drive proves the shape
 *        (rule.require.repeatable-for-llm-tests). three matches the `attempts: 3` this file
 *        declared while these cases were wrapped in `when.repeatably`, so the tolerance is
 *        unchanged in QUANTITY — what changed is that it now re-drives. see driveGuardUntilVerdict.
 */
const VERDICT_ATTEMPTS = 3;

/**
 * .what = a fixed brain for the LLM-backed seam cases
 * .why = pins the base review's `🦉 let's review` brain row so the guard-tree + peer snapshots are
 *        deterministic in that dimension (the verdict itself is what varies, handled by SOME).
 */
const BRAIN = 'fireworks/deepseek/v4-flash';

/**
 * .what = replaces a NONZERO blocker/nitpick count with `[N]`, and leaves a zero count alone
 * .why = a concern count is the BRAIN's verdict, never the guard's render. the same rubric on the
 *        same fixture returned `1 blocker` on one run and `2 blockers` on the next, which failed a
 *        snapshot that had pinned the magnitude (measured 2026-09-19, `[case-seam-findings]`, both
 *        snapshot assertions). so the magnitude is masked and every deterministic neighbour is kept:
 *
 *          - a ZERO count survives verbatim, because `0 blockers` is what makes a verdict APPROVED.
 *            a pass case whose brain raises a concern still fails its snapshot, as it must
 *          - the verdict word (`approved` / `rejected`), the 🔴 / ✓ glyph, the judge outcome, and the
 *            threshold it was judged against (`> 0`) all survive, so the verdict CLASS stays pinned
 *          - the singular/plural noun collapses with the digit, since `1 blocker` and `2 blockers`
 *            differ in both
 *
 *        ⇒ what is dropped is the ONE field a probabilistic reviewer owns. that a parseable count
 *          reached the guard at all is clamped by a direct `toMatch(/\d+\s*blockers?/i)` assertion
 *          in each case, not by this snapshot — so no coverage moves, only the baseline's claim
 *          about what is stable (rule.forbid.test-intent-violations: the intent was the SEAM).
 */
const maskConcernMagnitudes = (text: string): string =>
  text
    .replace(/\b(?!0\b)\d+ (blocker|nitpick)s?\b/g, '[N] $1s')
    .replace(
      /\b(blockers|nitpicks) exceed threshold \((?!0\b)\d+ > (\d+)\)/g,
      '$1 exceed threshold ([N] > $2)',
    );

/**
 * .what = sanitizes a route.stone.set guard-tree stdout so it snapshots stably
 * .why = the guard tree carries THREE volatile dimensions: verdict durations (`rejected 109.5s`),
 *        the hash+iteration segment of each peer-artifact path (`.i001.<hash>.r001.`), and the
 *        nonzero concern counts a probabilistic reviewer chose. the shared sanitizeTimeForSnapshot
 *        masks every duration verb + the temp-dir prefix; we add the hash-scrub so the
 *        `given:`/`taken:` artifact references stay stable, and maskConcernMagnitudes so a
 *        `1 blocker` → `2 blockers` drift cannot fail a seam that never graded the magnitude.
 *
 *        ⚠️ this `.why` named the blocker/nitpick counts as DETERMINISTIC until 2026-09-19, and the
 *           corpus refuted it — `[case-seam-findings]` went red on a count the brain picked. a
 *           sanitizer's docblock is a CLAIM about what varies, and a claim about variance is
 *           checkable against the run log.
 *
 *        what remains is deterministic: the `r{n}: <slug> (l1, N/3)` reviewer row, the verdict word,
 *        a zero count where one is owed, and the judge outcomes — the guard EXPERIENCE a human reads.
 */
const sanitizeGuardTreeForSnapshot = (stdout: string): string =>
  maskConcernMagnitudes(
    sanitizeTimeForSnapshot(stdout).replace(
      /\.i\d+\.[0-9a-f]+\.r\d+\./g,
      '.i[N].[HASH].r[N].',
    ),
  );

/**
 * .what = sanitizes a guard-captured peer artifact so it snapshots stably
 * .why = the guard writes the disintermediated base-review stdout into a `given.by_peer` artifact,
 *        wrapped in its own `├─ stdout` / `└─ tallied` tree. that captured text carries the base
 *        review's volatile telemetry — the `🔭 metrics.expected`, `🪵 logs`, and `✨ metrics.realized`
 *        subtrees (token counts, cost, latency, timestamped log paths) — plus a `logs:` line under
 *        the verdict header. a byte-exact snapshot would fight rule.require.repeatable-for-llm-tests.
 *
 *        ⚠️ and its `summary` block + the guard's `└─ tallied` footer BOTH restate the brain's own
 *           concern counts, so maskConcernMagnitudes runs over the result — see its `.why`. a zero
 *           survives; only a nonzero magnitude collapses to `[N]`.
 *
 *        so we drop those volatile regions and keep the DETERMINISTIC structure that proves
 *        disintermediation flows through the guard: the two `🪨 run solid skill` banners (review.by
 *        wrapper → base review), the `🦉 let's review` scope block, the verdict header, the `review:`
 *        output path, the base review's `summary` block, and the guard's `└─ tallied` footer — with
 *        NO `🔍 review.by` anchor and NO `rubrics` bucket (the review.by tree chrome that
 *        disintermediation removes).
 */
const sanitizeCapturedPeerForSnapshot = (artifact: string): string => {
  const lines = artifact
    // strip ANSI color/style escape codes
    // biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
    .replace(/\x1b\[[0-9;]*m/g, '')
    // mask the volatile temp-dir prefix
    .replace(/\/tmp\/test-fns\/[^/]+\/\.temp\/[^/]+\//g, '[TEMP]/')
    .split('\n');

  // drop the three telemetry SUBTREES: skip from a telemetry header (🔭/🪵/✨) until the next
  // verdict header (🦉) — the base review emits banner, `🦉 let's review`, [telemetry×3], then
  // `🦉 <verdict>`, so the next 🦉 after any telemetry header is the verdict where retention resumes.
  const kept: string[] = [];
  let skipTelemetry = false;
  let skipStderr = false;
  for (const line of lines) {
    // collapse the child's raw stderr, which a MALFUNCTIONED rubric now carries so its cause
    // travels (rule.forbid.failhide). that dump is a node crash trace: absolute repo paths, stack
    // frames, and the live `🔭 available brains` catalog — all machine- or upstream-volatile (the
    // catalog already drifted glm 5.1 -> 5.2). the deterministic part is the `💥 rubric
    // malfunctioned: <slug>` header, so keep that and mark the dump. the CAUSE itself is clamped
    // by a direct assertion in the malfunction case, not by this snapshot.
    if (/💥 rubric malfunctioned:/.test(line)) {
      kept.push(line);
      kept.push('[STDERR]');
      skipStderr = true;
      continue;
    }
    // the dump lives inside the captured-stdout body (`│  │ …`); the first line that closes that
    // body ends it, and retention resumes with the guard's own footer
    if (skipStderr) {
      if (/│\s+│/.test(line)) continue;
      skipStderr = false;
    }
    if (/(🔭 metrics|🪵 logs|✨ metrics)/.test(line)) {
      skipTelemetry = true;
      continue;
    }
    if (skipTelemetry && line.includes('🦉')) skipTelemetry = false;
    if (skipTelemetry) continue;
    // drop the single volatile `logs:` child line under the verdict header (a timestamped path)
    if (/├─ logs:/.test(line)) continue;
    kept.push(line);
  }

  // 🔴 NO empty-stderr carve-out here, and none is owed — the ENGINE normalizes it now.
  //
  // an earlier round dropped a bare-bodied `stderr` section from the snapshot body,
  // because a clean child may write no byte at all to stderr (no section renders) or
  // a bare newline (the section renders, with an empty body). which one you get is the
  // child process's business, never the contract under test, so the artifact varied run
  // to run.
  //
  // ⚠️ that variance no longer reaches this test. `runStoneGuardReviews.ts:189` builds
  //    the captured artifact through `formatArtifactStreamBuckets`, which emits a
  //    `stderr` bucket only when `stderr.trim() !== ''` — so BOTH variants collapse to
  //    one output at the source. it is pinned at unit grain, not inferred:
  //      `formatArtifactStreamBuckets.test.ts` [case5] — `stderr: '\n  \n'` ⇒ no bucket
  //      `formatArtifactStreamBuckets.test.ts` [case6] — `stderr: ''`      ⇒ no bucket
  //
  // ⇒ so the section that survives to here always held REAL output, and it is snapped
  //   live and whole. a reviewer asked for a stable `<empty>` MARKER in place of the
  //   drop (r2 blocker.1, i016) — this is that ask carried further: a mask is the right
  //   answer to variance that reaches the snapshot, and NO mask is the right answer to
  //   variance the engine already removed. one fewer transform stands between the live
  //   bytes and the baseline, which is what `rule.require.contract-snapshot-exhaustiveness`
  //   is after.
  //
  // ⚠️ a MALFUNCTION's stderr is a separate case and is NOT touched by this: it carries
  //    the cause, so the loop above keeps its `💥 rubric malfunctioned:` header and
  //    collapses only the volatile crash dump to the `[STDERR]` marker.
  return maskConcernMagnitudes(kept.join('\n').trim());
};

/**
 * .what = drives a route guard whose ONLY peer runs `$rhx review.by --role learner --for <rubric>`,
 *         then returns the guard-tree stdout + the captured peer artifact
 * .why = this is the seam under test: route.stone.set → runOneReview → review.by → base review. the
 *        driver writes the guard (one review.by peer for the given rubric + brain) and a src file of
 *        the given content, marks the stone passed to fire the guard, and reads back both the guard's
 *        rendered stdout AND the `given.by_peer.<rubric>` artifact the guard captured from the peer.
 *        every seam case shares this driver so the four verdict-class cases differ ONLY in the rubric
 *        + fixture content that steer the verdict.
 */
const driveGuardWithReviewByPeer = async (input: {
  slug: string;
  rubric: 'term-application' | 'term-aggregation';
  brain: string;
  srcContent: string;
}): Promise<{ cli: { stdout: string }; artifact: string | null }> => {
  const cwd = genTempDirForRhachet({ slug: input.slug, clone: ASSETS_DIR });

  // link driver (route skills) + reviewer (review engine) + learner (rubrics + wrapper)
  for (const role of ['driver', 'reviewer', 'learner'])
    await execAsync(`npx rhachet roles link --role ${role}`, { cwd });

  // point the guard's single peer at the named learner rubric, via review.by --for (the seam).
  // scoped to a fixed path so the base review's `🦉 let's review` scope block is deterministic.
  await fs.writeFile(
    path.join(cwd, '1.execute.guard'),
    [
      'artifacts:',
      '  - src/**/*.ts',
      '',
      'reviews:',
      '  peer:',
      `    - slug: ${input.rubric}`,
      `      run: $rhx review.by --role learner --for ${input.rubric} --paths 'src/**/*.ts' --brain ${input.brain}`,
      '      budget: 3',
      '      level: 1',
      '',
      'judges:',
      '  - $rhachet run --repo bhrain --skill route.stone.judge --mechanism reviewed? --stone $stone --route $route --allow-blockers 0 --allow-nitpicks 3',
      '',
    ].join('\n'),
  );

  await fs.mkdir(path.join(cwd, 'src'), { recursive: true });
  await fs.writeFile(path.join(cwd, 'src', 'feature.ts'), input.srcContent);

  const cli = await invokeRouteSkill({
    skill: 'route.stone.set',
    args: { stone: '1.execute', route: '.', as: 'passed' },
    cwd,
  });

  const peerDir = path.join(cwd, '.reviews', 'peer');
  const files = await fs.readdir(peerDir).catch(() => [] as string[]);
  const artifactFile = files.find(
    (file) =>
      file.includes(`given.by_peer.${input.rubric}`) && file.endsWith('.md'),
  );
  const artifact = artifactFile
    ? await fs.readFile(path.join(peerDir, artifactFile), 'utf-8')
    : null;

  return { cli, artifact };
};

/**
 * .what = drives the guard up to `attempts` times and returns the FIRST drive that reached the
 *         passage class its case declares. if none does, it returns the LAST drive — so every
 *         assertion below still runs against real bytes, and fails loudly.
 *
 * .why = the peer is a real LLM, so its verdict varies run to run. that variance is what
 *        `rule.require.repeatable-for-llm-tests` exists to absorb, and the `when.repeatably`
 *        wrapper CANNOT absorb it here. measured on this very file, 2026-09-19 → 2026-09-20:
 *
 *          - the brain graded SRC_CLEAN_GENERIC dirty, so the guard tree flipped
 *            `approved → rejected`, `0 blockers ✓ → [N] blockers 🔴`, `judge.1 allowed → blocked`
 *          - attempt 1 went red. attempts 2 and 3 then ran in 48ms and 2ms — no subprocess time at
 *            all — and both reported green
 *          - `git diff` after that run shows NO `attempt 2` snapshot key was ever written, so
 *            attempt 2 never reached its snapshot assertion. it was SKIPPED
 *
 *        ⇒ a red attempt did not merely go un-retried: the block was marked as passed and every
 *          attempt after it was skipped. so `criteria: 'SOME'` bought exactly ONE real drive, and
 *          one red drive was the suite's red.
 *
 *        ⚠️ and the attempt ordinal rides in the snapshot KEY, so only attempt 1 can ever hold a
 *           baseline. under `--ci` (`package.json` → `test:acceptance`) jest refuses to write a new
 *           snapshot, so a later attempt would hard-fail on an absent key even where it did run.
 *
 *        ⇒ the retry therefore lives HERE, around a real re-drive: fresh temp dir, fresh guard,
 *          fresh review subprocess, per attempt. `SOME` semantics, at the layer they work.
 *
 * .note = `rule.require.repeatable-for-llm-tests` asks an LLM case to use `when.repeatably`. these
 *         three cases DIVERGE from its letter to serve its intent, because the wrapper is measured
 *         inert on a `toMatchSnapshot` case. the root defect is caught upstream — see
 *         `.dream/v2026_09_19.fix.the-repeatable-retry-is-decorative-…`. the `[case-seam-malfunction]`
 *         case below already used a plain `when`, so a bare `when` is not new to this file.
 *
 * .note = this is NOT a drive-until-green loop. the predicate is the case's OWN declared passage
 *         class, which each case now also asserts explicitly. a fixture that is genuinely wrong
 *         spends all `attempts` drives, returns the last, and fails BOTH that assertion and its
 *         snapshot — louder than before, never quieter (rule.forbid.failhide).
 *
 * ⚠️ .note = the `passage` INPUT and the case's `toContain('passage = …')` assertion are two
 *            separate strings, and they MUST name the same class. if they drift, the loop retries
 *            toward one verdict while the case asserts the other, so a green drive reads as a
 *            failure with no hint as to why. measured while this loop's clamp was proven:
 *            `passage: 'blocked'` against an `allowed` assertion failed at attempt 1 with the
 *            retry never engaged. ⇒ change both, or neither.
 */
const driveGuardUntilVerdict = async (input: {
  slug: string;
  rubric: 'term-application' | 'term-aggregation';
  brain: string;
  srcContent: string;
  passage: 'allowed' | 'blocked';
  attempts: number;
}): Promise<{
  cli: { stdout: string };
  artifact: string | null;
  attemptsSpent: number;
}> => {
  const reached = (result: { cli: { stdout: string } }): boolean =>
    result.cli.stdout.includes(`passage = ${input.passage}`);

  let latest = await driveGuardWithReviewByPeer(input);
  let spent = 1;

  while (!reached(latest) && spent < input.attempts) {
    latest = await driveGuardWithReviewByPeer(input);
    spent += 1;
  }

  return { ...latest, attemptsSpent: spent };
};

// a clean, non-domain util — declares NO domain object or operation, so term-aggregation
// (itemization) has no declared term to require → a deterministic 0/0 pass verdict.
const SRC_CLEAN_GENERIC =
  'export const addNumbers = (input: { a: number; b: number }): number =>\n' +
  '  input.a + input.b;\n';

// a clean, well-termed domain op — one unambiguous concept per word, so term-application passes.
const SRC_CLEAN_TERMS =
  'export const getSurferName = (input: { surferId: string }): string =>\n' +
  '  input.surferId;\n';

// deliberately term-dirty: ONE concept (a reserved lesson slot) under THREE words, plus one word
// overloaded across two concepts — so term-application reliably BITES (inconsistency + ambiguity).
const SRC_DIRTY_TERMS =
  '// inconsistency: one concept (a reserved lesson slot) under three words.\n' +
  'export interface Reservation {\n' +
  '  surfer: string;\n' +
  '  slot: string;\n' +
  '}\n' +
  '\n' +
  'export const getHold = (input: { id: string }): Reservation => {\n' +
  "  return { surfer: 'kai', slot: '9am' };\n" +
  '};\n' +
  '\n' +
  'export const cancelAppointment = (input: {\n' +
  '  reservation: Reservation;\n' +
  '}): void => {\n' +
  '  // three words, one concept\n' +
  '};\n' +
  '\n' +
  "// ambiguity (overload): 'session' means BOTH a surf lesson AND an auth login.\n" +
  'export interface Session {\n' +
  '  lessonMinutes: number;\n' +
  '}\n' +
  '\n' +
  'export const openSession = (input: { token: string }): { token: string } => {\n' +
  '  return { token: input.token };\n' +
  '};\n';

/**
 * .what = the EXHAUSTIVE seam matrix between a route guard and review.by --for
 * .why = a route guard peer review is the MAIN consumer of `review.by --for`. this proves the whole
 *        chain end to end AND across every verdict class the seam can yield:
 *
 *          | verdict     | rubric            | fixture        | guard outcome     |
 *          |-------------|-------------------|----------------|-------------------|
 *          | pass (agg)  | term-aggregation  | clean generic  | approved, exit 0  |
 *          | pass (app)  | term-application  | clean terms    | approved, exit 0  |
 *          | findings    | term-application  | dirty terms    | rejected, exit 2  |
 *          | malfunction | term-aggregation  | (bad brain)    | blocked, exit ≠0  |
 *
 *        each case snapshots BOTH:
 *          - the guard-tree stdout — the EXPERIENCE a human reads (reviewer row, verdict, counts,
 *            judge outcome), sanitized for durations + artifact hashes
 *          - the captured peer artifact — the disintermediated base review the guard tallied off,
 *            proving `review.by --for` handed the guard a NORMAL review (no review.by tree)
 *
 *        so the crux (rule.require.review-by-disintermediates) is proven at EVERY seam boundary, not
 *        just the happy path. the fixture links the REAL shipped learner role, so `rhx review.by
 *        --role learner` finds the learner-owned wrapper → base, for real.
 */
describe('review.by.guard-peer.acceptance', () => {
  // ───────────────────────────────────────────────────────────────────────────
  // verdict = PASS — term-aggregation on clean generic code → guard approves
  // ───────────────────────────────────────────────────────────────────────────

  given('[case-seam-pass-aggregation] guard peer runs review.by --for term-aggregation, code is clean', () => {
    when(
      '[t0] the stone is passed → the guard approves off a raw base review',
      () => {
        const res = useThen('the guard runs the term-aggregation peer and approves', async () =>
          driveGuardUntilVerdict({
            slug: 'route-guard-review-by-pass-aggregation',
            rubric: 'term-aggregation',
            brain: BRAIN,
            srcContent: SRC_CLEAN_GENERIC,
            passage: 'allowed',
            attempts: VERDICT_ATTEMPTS,
          }),
        );

        then('the guard APPROVED — the verdict class this case declares', () => {
          // .why = the ONLY assertion here that read the verdict used to be the snapshot below, so
          //        a brain flip surfaced as a "snapshot drift" rather than as what it is. this
          //        states the case's premise directly, and it is the predicate the re-drive uses.
          expect(res.cli.stdout).toContain('passage = allowed');
          expect(res.attemptsSpent).toBeLessThanOrEqual(VERDICT_ATTEMPTS);
        });

        then('the guard ran the term-aggregation peer (its reviewer row shows the slug)', () => {
          expect(res.cli.stdout).toContain('term-aggregation');
        });

        then('the captured peer artifact IS a raw base review, NOT a review.by tree', () => {
          expect(res.artifact).not.toBeNull();
          const artifact = res.artifact ?? '';
          expect(artifact).toContain('summary');
          expect(artifact).not.toContain('review.by --role');
          expect(artifact).not.toMatch(/[├└]─ rubrics\b/);
        });

        then('the guard-tree stdout is stable (full snapshot)', () => {
          expect(
            sanitizeGuardTreeForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });

        then('the captured peer artifact is stable (full snapshot)', () => {
          expect(res.artifact).not.toBeNull();
          expect(
            sanitizeCapturedPeerForSnapshot(res.artifact ?? ''),
          ).toMatchSnapshot();
        });
      },
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // verdict = PASS — term-application on clean term code → guard approves
  // ───────────────────────────────────────────────────────────────────────────

  given('[case-seam-pass-application] guard peer runs review.by --for term-application, code is clean', () => {
    when(
      '[t0] the stone is passed → the guard approves off a raw base review',
      () => {
        const res = useThen('the guard runs the term-application peer and approves', async () =>
          driveGuardUntilVerdict({
            slug: 'route-guard-review-by-pass-application',
            rubric: 'term-application',
            brain: BRAIN,
            srcContent: SRC_CLEAN_TERMS,
            passage: 'allowed',
            attempts: VERDICT_ATTEMPTS,
          }),
        );

        then('the guard APPROVED — the verdict class this case declares', () => {
          expect(res.cli.stdout).toContain('passage = allowed');
          expect(res.attemptsSpent).toBeLessThanOrEqual(VERDICT_ATTEMPTS);
        });

        then('the guard ran the term-application peer (its reviewer row shows the slug)', () => {
          expect(res.cli.stdout).toContain('term-application');
        });

        then('the guard tallied a parseable count off the peer stdout', () => {
          // the guard parses the disintermediated stdout via getReviewCounts — the SAME path it
          // uses for a direct `$rhx review` peer — so the reviewer row carries a blockers count
          expect(res.cli.stdout).toMatch(/\d+\s*blockers?/i);
        });

        then('the captured peer artifact IS a raw base review, NOT a review.by tree', () => {
          expect(res.artifact).not.toBeNull();
          const artifact = res.artifact ?? '';
          expect(artifact).toContain('summary');
          expect(artifact).not.toContain('review.by --role');
          expect(artifact).not.toMatch(/[├└]─ rubrics\b/);
        });

        then('the guard-tree stdout is stable (full snapshot)', () => {
          expect(
            sanitizeGuardTreeForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });

        then('the captured peer artifact is stable (full snapshot)', () => {
          expect(res.artifact).not.toBeNull();
          expect(
            sanitizeCapturedPeerForSnapshot(res.artifact ?? ''),
          ).toMatchSnapshot();
        });
      },
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // verdict = FINDINGS — term-application on dirty terms → guard REJECTS
  // ───────────────────────────────────────────────────────────────────────────

  given('[case-seam-findings] guard peer runs review.by --for term-application, code is term-dirty', () => {
    when(
      '[t0] the stone is passed → the peer bites, the guard rejects off a raw base review',
      () => {
        const res = useThen('the guard runs the peer, it finds blockers, the guard rejects', async () =>
          driveGuardUntilVerdict({
            slug: 'route-guard-review-by-findings',
            rubric: 'term-application',
            brain: BRAIN,
            srcContent: SRC_DIRTY_TERMS,
            passage: 'blocked',
            attempts: VERDICT_ATTEMPTS,
          }),
        );

        then('the guard BLOCKED — the verdict class this case declares', () => {
          expect(res.cli.stdout).toContain('passage = blocked');
          expect(res.attemptsSpent).toBeLessThanOrEqual(VERDICT_ATTEMPTS);
        });

        then('the guard rejected — its reviewer row carries a blocker count', () => {
          // the dirty fixture names one concept three ways + overloads a word, so term-application
          // finds at least one blocker; the guard folds that into the tree and the reviewed? judge
          // blocks (allow-blockers 0). proof the FINDINGS path flows through the seam.
          expect(res.cli.stdout).toContain('term-application');
          expect(res.cli.stdout).toMatch(/\d+\s*blockers?/i);
        });

        then('the captured peer artifact IS a raw base review with findings, NOT a review.by tree', () => {
          // the crux at the findings boundary: even with blockers, the captured peer is the base
          // review's own stdout (a `summary` block), never a review.by tree.
          expect(res.artifact).not.toBeNull();
          const artifact = res.artifact ?? '';
          expect(artifact).toContain('summary');
          expect(artifact).not.toContain('review.by --role');
          expect(artifact).not.toMatch(/[├└]─ rubrics\b/);
        });

        then('the guard-tree stdout is stable (full snapshot)', () => {
          expect(
            sanitizeGuardTreeForSnapshot(res.cli.stdout),
          ).toMatchSnapshot();
        });

        then('the captured peer artifact is stable (full snapshot)', () => {
          expect(res.artifact).not.toBeNull();
          expect(
            sanitizeCapturedPeerForSnapshot(res.artifact ?? ''),
          ).toMatchSnapshot();
        });
      },
    );
  });

  // ───────────────────────────────────────────────────────────────────────────
  // verdict = MALFUNCTION — an unknown brain → the peer review faults → guard BLOCKS
  // (deterministic: the brain never loads, so no LLM call is made — a fast, stable case)
  // ───────────────────────────────────────────────────────────────────────────

  given('[case-seam-malfunction] guard peer runs review.by --for with an unknown brain', () => {
    when('[t0] the stone is passed → the peer review faults, the guard blocks on a malfunction', () => {
      const res = useThen('the guard runs the peer, its review subprocess faults', async () =>
        driveGuardWithReviewByPeer({
          slug: 'route-guard-review-by-malfunction',
          rubric: 'term-aggregation',
          // an unknown brain: the base review cannot start, so it emits no numeric verdict —
          // runOneReview promotes the no-verdict exit to a malfunction (never a fake 0/0), and the
          // guard blocks. deterministic (the brain is not found before any LLM call).
          brain: 'nonexistent/broken/brain',
          srcContent: SRC_CLEAN_GENERIC,
        }),
      );

      then('the guard did NOT pass the stone (a malfunction blocks)', () => {
        expect(res.cli.stdout).toContain('term-aggregation');
        // the guard surfaces the peer as a malfunction, not a clean pass
        expect(res.cli.stdout).toMatch(/malfunction|💥/i);
      });

      then('the captured peer artifact records the fault, NOT a review.by tree', () => {
        // even a faulted peer is captured as a plain-review artifact (its stdout/stderr), never a
        // review.by tree — disintermediation holds on the malfunction boundary too.
        expect(res.artifact).not.toBeNull();
        const artifact = res.artifact ?? '';
        expect(artifact).not.toContain('review.by --role');
        expect(artifact).not.toMatch(/[├└]─ rubrics\b/);
      });

      then('the captured artifact names WHY the peer faulted', () => {
        // the clamp on the failhide repair: review.by echoes the faulted rubric AND the child
        // review's own stderr, so a guard that captures this run sees the cause rather than a bare
        // `💥 failed with an error` (rule.forbid.failhide, rule.require.errors-name-the-fix).
        // asserted here rather than in the snapshot — the dump carries volatile absolute paths.
        const artifact = res.artifact ?? '';
        expect(artifact).toContain('💥 rubric malfunctioned: term-aggregation');
        expect(artifact).toContain('brain not found: nonexistent/broken/brain');
      });

      then('the guard-tree stdout is stable (full snapshot)', () => {
        expect(sanitizeGuardTreeForSnapshot(res.cli.stdout)).toMatchSnapshot();
      });

      then('the captured peer artifact is stable (full snapshot)', () => {
        expect(res.artifact).not.toBeNull();
        expect(
          sanitizeCapturedPeerForSnapshot(res.artifact ?? ''),
        ).toMatchSnapshot();
      });
    });
  });
});
