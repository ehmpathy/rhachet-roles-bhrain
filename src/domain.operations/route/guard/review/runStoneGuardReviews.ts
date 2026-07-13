import { exec } from 'child_process';
import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import { type IsoDuration, toMilliseconds } from 'iso-time';
import * as path from 'path';
import { promisify } from 'util';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import {
  getGuardPeerReviews,
  getReviewPeerRunCmd,
  type RouteStoneGuard,
  type RouteStoneGuardReviewPeer,
} from '@src/domain.objects/Driver/RouteStoneGuard';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';

import {
  type ContextReviewBrainSupply,
  FIXED_FALLBACK_BRAIN,
} from '../../genReviewBrainSupply';
import { findsertReviewPeerGitignore } from '../../gitignore/findsertReviewPeerGitignore';
import { getStoneGuardOverruledLevels } from '../../judges/getStoneGuardOverruledLevels';
import { getAllStoneGuardArtifactsByHash } from '../artifact/getAllStoneGuardArtifactsByHash';
import { asStoneGuardCounter } from '../asStoneGuardCounter';
import { getDurationMsFromContent } from '../getDurationMsFromContent';
import { getExitCodeClass } from '../getExitCodeClass';
import { getRepoRootWithFallback } from '../getRepoRootWithFallback';
import { isENOENT } from '../isENOENT';
import { formatTreeBucket } from '../tree/formatTreeBucket';
import { getReviewCounts } from './getReviewCounts';
import { ReviewTallyError } from './getReviewCountsViaBrain';
import type { ReviewCountsResolved } from './getReviewCountsViaRegex';
import { TALLIED_FOOTER_PREFIX } from './getReviewTacticFromContent';
import { enumRouteGuardReviewPeerConversationFiles } from './peer/enumRouteGuardReviewPeerConversationFiles';
import { getLatestReviewArtifactForIndex } from './peer/getLatestReviewArtifactForIndex';
import { getRouteGuardReviewPeerPathTaken } from './peer/getRouteGuardReviewPeerPathTaken';
import { computeReviewPeerVerdict } from './peer/meter/computeReviewPeerVerdict';
import { getAllRouteStoneGuardReviewPeerMeters } from './peer/meter/getAllRouteStoneGuardReviewPeerMeters';
import { getReviewedJudgeThresholds } from './peer/meter/getReviewedJudgeThresholds';
import { isReviewPeerVerdictExhausted } from './peer/meter/isReviewPeerLevelTerminal';
import { isReviewPeerLevelUnlocked } from './peer/meter/isReviewPeerLevelUnlocked';
import { setRouteStoneGuardReviewPeerMeter } from './peer/meter/setRouteStoneGuardReviewPeerMeter';

const execAsync = promisify(exec);

/**
 * .what = path to the reviewer-output contract brief
 * .why = named once so the malfunction reason and its comment cannot drift if the brief moves
 */
const REVIEWER_OUTPUT_CONTRACT_BRIEF =
  '.agent/repo=bhrain/role=reviewer/briefs/contract.reviewer-output.md';

/**
 * .what = extracts a human-legible reason from a caught error, including its cause
 * .why = a wrapped brain fault carries the specific cause (e.g. "timed out after PT21M",
 *        "400 Invalid json_schema") as its .cause; surfacing it lets the malfunction message
 *        distinguish a timeout from a generic brain fault (the wish's distinct-messages ask).
 */
const getErrorReason = (error: unknown): string => {
  if (!(error instanceof Error)) return String(error);
  // read .cause cast-free (pre-ES2022 Error type lacks it) — Reflect.get over an `as` cast
  const cause: unknown = Reflect.get(error, 'cause');
  const causeSuffix = cause instanceof Error ? `: ${cause.message}` : '';
  return `${error.message}${causeSuffix}`;
};

/**
 * .what = extracts slug from peer review
 * .why = accessor for slug
 */
const getReviewPeerSlug = (review: RouteStoneGuardReviewPeer): string =>
  review.slug;

/**
 * .what = extracts level from peer review
 * .why = accessor for level with default
 */
const getReviewPeerLevel = (review: RouteStoneGuardReviewPeer): number =>
  review.level ?? 1;

/**
 * .what = extracts budget from peer review
 * .why = accessor for budget
 */
const getReviewPeerBudget = (review: RouteStoneGuardReviewPeer): number =>
  review.budget;

/**
 * .what = default timeout for review command execution
 * .why = preserves backwards compat when timeout not specified
 */
const DEFAULT_REVIEW_TIMEOUT: IsoDuration = 'PT21M';

/**
 * .what = extracts timeout from peer review
 * .why = accessor for timeout with default
 */
const getReviewPeerTimeout = (review: RouteStoneGuardReviewPeer): IsoDuration =>
  review.timeout ?? DEFAULT_REVIEW_TIMEOUT;

/**
 * .what = converts IsoDuration to milliseconds
 * .why = enables per-reviewer timeout configuration
 * .note = override via RHACHET_REVIEW_TIMEOUT_MS env var for tests
 */
const getReviewTimeoutMs = (timeout: IsoDuration): number =>
  process.env.RHACHET_REVIEW_TIMEOUT_MS !== undefined
    ? parseInt(process.env.RHACHET_REVIEW_TIMEOUT_MS, 10)
    : toMilliseconds(timeout);

/**
 * .what = formats timeout for human-readable error message
 * .why = shows timeout in appropriate unit (seconds vs minutes)
 */
const formatTimeoutForHuman = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes} minutes`;
};

/**
 * .what = executes a single guard review command and produces review artifact
 * .why = enables guard to validate stone artifacts via review tools
 */
export const runOneStoneGuardReview = async (
  input: {
    stone: RouteStone;
    reviewCmd: string;
    index: number;
    hash: string;
    iteration: number;
    route: string;
    slug: string;
    timeout: IsoDuration;
  },
  context: ContextReviewBrainSupply,
): Promise<RouteStoneGuardReviewArtifact> => {
  // ensure .reviews/peer directory found or created
  // .why = peer reviews go to .reviews/peer/ so drivers can read them
  //        (.route/ is sealed by route.mutate.guard)
  const reviewsDir = path.join(input.route, '.reviews', 'peer');
  await fs.mkdir(reviewsDir, { recursive: true });

  // findsert gitignore to keep peer-review artifacts out of git
  // .why = guard runs spam git with one artifact per reviewer/iteration/hash
  await findsertReviewPeerGitignore({ route: input.route });

  // lookup repo root for $rhx/$rhachet paths (cwd fallback when not in a git repo)
  const repoRoot = await getRepoRootWithFallback({ from: input.route });

  // validate no npx patterns before variable substitution
  validateNoNpx(input.reviewCmd);

  // sanitize slug for filename
  // .why = legacy peer reviews use command as slug (e.g., ".test/mock-review.sh")
  //        path separators would create nested directories
  const sanitizedSlug = input.slug.replace(/[/\\]/g, '-');

  // generate stdout path (what guard writes) and report path (what review skill writes)
  // .note = symmetric names: stdout is .md, report is .report.md
  const iSeg = asStoneGuardCounter({ value: input.iteration });
  const rSeg = asStoneGuardCounter({ value: input.index });
  const stdoutPath = path.join(
    reviewsDir,
    `${input.stone.name}._.review.i${iSeg}.${input.hash}.r${rSeg}._.given.by_peer.${sanitizedSlug}.md`,
  );
  const reportPath = path.join(
    reviewsDir,
    `${input.stone.name}._.review.i${iSeg}.${input.hash}.r${rSeg}._.given.by_peer.${sanitizedSlug}.report.md`,
  );

  // expand the peer-review conversation for the opt-in $conversation var
  // .why = a reviewer declared with --conversation $conversation sees the full
  //        prior dialogue (every .given + .taken). EXCLUDES the current
  //        {iteration, hash} generation so a later reviewer in this same guard
  //        run never sees an earlier reviewer's brand-new, unanswered given (B4)
  const conversationFiles = await enumRouteGuardReviewPeerConversationFiles({
    route: input.route,
    stone: input.stone.name,
    exclude: { iteration: input.iteration, hash: input.hash },
  });
  // .why = convert to repo-root-relative paths so $conversation matches the
  //        cwd-relative convention every reviewer runs under (reviewer cwd =
  //        repoRoot). the enumerator yields absolute paths; a raw absolute in
  //        the value breaks a consumer that joins it onto cwd (path.join doubles
  //        the path). this mirrors the path.relative(repoRoot, ...) the stdout
  //        tree already uses for display paths.
  // .note = COMMA-joined (not space) so $conversation expands to ONE shell token.
  //         a consumer parses it as a single flag value + splits on comma — no
  //         variadic multi-token consumption needed (review file paths hold no comma).
  const conversation = conversationFiles
    .map((file) => path.relative(repoRoot, file))
    .join(',');

  // substitute variables in command
  // .note = $output points to report path (for review skill to write)
  const cmd = substituteVars(input.reviewCmd, {
    stone: input.stone.name,
    route: input.route,
    hash: input.hash,
    output: reportPath,
    conversation,
    repoRoot,
  });

  // execute command with node_modules/.bin in PATH
  // .why = enables guards to use `rhx` or `rhachet` directly without npx
  const nodeModulesBin = path.join(repoRoot, 'node_modules', '.bin');
  const execEnv = {
    ...process.env,
    PATH: `${nodeModulesBin}${path.delimiter}${process.env.PATH ?? ''}`,
    // signal to child processes that they execute within a guard context
    // .why = child skills should suppress their own progress spinners
    RHACHET_GUARD_CONTEXT: '1',
  };

  // compute timeout in milliseconds
  const timeoutMs = getReviewTimeoutMs(input.timeout);

  // .note = deliberate mutation. stdout/stderr/exitCode accumulate across the exec
  //         try/catch (success vs error branch) and the later malfunction promotion.
  //         an imperative accumulator is the clearest shape for capture-output-on-both-paths;
  //         see rule.require.immutable-vars (annotated-mutation exception).
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  try {
    const result = await execAsync(cmd, {
      cwd: repoRoot,
      env: execEnv,
      timeout: timeoutMs,
    });
    stdout = result.stdout;
    stderr = result.stderr;
    exitCode = 0;
  } catch (error: unknown) {
    // capture output and exit code even on failure
    // .note = exec errors have stdout/stderr/code properties; rethrow other error types
    if (
      error &&
      typeof error === 'object' &&
      ('stdout' in error || 'stderr' in error || 'code' in error)
    ) {
      const errObj = error as Record<string, unknown>;
      stdout = typeof errObj.stdout === 'string' ? errObj.stdout : '';
      stderr = typeof errObj.stderr === 'string' ? errObj.stderr : '';

      // detect timeout (process killed by signal)
      if (errObj.killed === true) {
        stderr = `💥 malfunction: review timed out after ${formatTimeoutForHuman(timeoutMs)}`;
        exitCode = 1;
      } else {
        exitCode = typeof errObj.code === 'number' ? errObj.code : 1;
      }
    } else {
      // rethrow non-exec errors (code defects, unexpected state)
      throw error;
    }
  }

  // derive blockers/nitpicks via the cascade: deterministic regex first, then a cheap
  // sub-brain fallback when an exit-0 review phrased its verdict in prose (not numbers).
  // .note = the cascade may THROW on a brain fault/timeout. catch it HERE (the per-reviewer
  //         seam) and convert to a malfunction: the stone blocks loud, OTHER reviewers still
  //         run, and the human sees a brain-error reason distinct from the no-verdict reason.
  //         this is NOT a failhide — a brain crash becomes a malfunction, never a silent pass.
  let counts: ReviewCountsResolved;
  let brainErrorReason: string | null = null;
  try {
    counts = await getReviewCounts({ content: stdout, exitCode }, context);
  } catch (error) {
    // allowlist: ONLY a deliberate brain-tally fault (ReviewTallyError — the build, ask, or
    // timeout of the sub-brain tactic) becomes a per-reviewer malfunction. an unexpected code
    // defect is NOT ours to swallow — rethrow it so it fails loud (rule.forbid.failhide).
    if (!(error instanceof ReviewTallyError)) throw error;
    counts = { detected: false };
    brainErrorReason = `💥 malfunction: review tally fallback failed. ${getErrorReason(error)}`;
  }
  const blockers = counts.detected ? counts.blockers : 0;
  const nitpicks = counts.detected ? counts.nitpicks : 0;
  // internal→contract boundary: the orchestrator's chosen `tactic` becomes the artifact's
  // public `tallier` field (named for the role that produced the tally).
  const tallier = counts.detected ? counts.tactic : null;

  // promote a "successful" review to malfunction when it yields no trustworthy verdict
  // .why = a reviewer that exits 0 but declares no numeric blocker/nitpick count — and whose
  //        prose the sub-brain also could not tally — cannot be trusted as "approved": the
  //        guard cannot see its verdict. a silent 0/0 would look like a clean review when in
  //        truth no review was read. failfast as a malfunction. see rule.forbid.failhide.
  //        the brain-error reason (if any) takes precedence so the human can tell a brain
  //        fault apart from an odd-phrasing miss. contract: REVIEWER_OUTPUT_CONTRACT_BRIEF
  if (exitCode === 0 && !counts.detected) {
    exitCode = 1;
    const reason =
      brainErrorReason ??
      '💥 malfunction: reviewer output lacks a numeric blocker/nitpick count ' +
        '(expected `N blockers` and `N nitpicks`; use `0 blockers` / `0 nitpicks` to declare clean). ' +
        `see ${REVIEWER_OUTPUT_CONTRACT_BRIEF}`;
    stderr = [stderr, reason].filter((line) => line !== '').join('\n');
  }

  // classify exit code (after possible malfunction promotion)
  const exitClass = getExitCodeClass({ code: exitCode });

  // format artifact content with tree buckets
  const artifactLines: string[] = [];
  artifactLines.push(formatTreeBucket({ label: 'stdout', content: stdout }));
  artifactLines.push(formatTreeBucket({ label: 'stderr', content: stderr }));

  // add passage footer for non-zero exit
  if (exitCode !== 0) {
    const blockReason =
      exitClass === 'constraint'
        ? 'blocked by constraints'
        : 'blocked by malfunction';
    const exitEmoji = exitClass === 'constraint' ? '✋' : '💥';
    artifactLines.push('└─ passage blocked');
    artifactLines.push(`   ├─ ${blockReason}`);
    artifactLines.push(`   └─ exit code: ${exitCode} ${exitEmoji}`);
  }

  // persist the resolved tally as a footer so a cache re-read recovers the SAME counts (and
  // the tactic) with NO brain call. the footer is the LAST numeric declaration, so
  // getReviewCountsViaRegex's last-match recovers it; the `tallied by reviewer@` line marks a
  // sub-brain tally so getReviewTacticFromContent can recover the tactic. this is one segment
  // of the single authored write (an upsert that replaces the file wholesale) — a rerun
  // re-authors the same content and cannot stack footers. only written for a detected verdict
  // (a malfunction carries no trustworthy tally; its passage footer already signals the block).
  if (counts.detected) {
    const blockerWord = blockers === 1 ? 'blocker' : 'blockers';
    const nitpickWord = nitpicks === 1 ? 'nitpick' : 'nitpicks';

    // a probabilistic tally appends a `tallied by reviewer@$brain` line, so the nitpicks row
    // becomes a mid-branch (├─); a deterministic tally ends on nitpicks (└─).
    const isProbabilistic = tallier === 'probabilistic';
    const nitpicksBranch = isProbabilistic ? '├─' : '└─';

    artifactLines.push('└─ tallied');
    artifactLines.push(`   ├─ ${blockers} ${blockerWord}`);
    artifactLines.push(`   ${nitpicksBranch} ${nitpicks} ${nitpickWord}`);
    if (isProbabilistic)
      artifactLines.push(
        `   └─ ${TALLIED_FOOTER_PREFIX}${FIXED_FALLBACK_BRAIN}`,
      );
  }

  const artifactContent = artifactLines.join('\n');

  // write stdout artifact file
  await fs.writeFile(stdoutPath, artifactContent);

  // parse duration from stdout via shared operation
  const durationMs = getDurationMsFromContent({ content: stdout });

  return new RouteStoneGuardReviewArtifact({
    stone: { path: input.stone.path },
    hash: input.hash,
    iteration: input.iteration,
    index: input.index,
    path: stdoutPath,
    blockers,
    nitpicks,
    tallier,
    exitCode,
    exitClass,
    stdout,
    stderr,
    durationMs,
  });
};

/**
 * .what = decides whether the driver has posted a response newer than a given
 * .why = a .taken.by_self written after its .given.by_peer means "reconsider" —
 *        it forces a conversation-enabled reviewer to re-run so it can see the
 *        response and drop a refuted blocker. once the reviewer re-runs it
 *        overwrites the given (newer mtime), so the trigger clears and the loop
 *        terminates; a further response bumps the taken newer again (a fresh
 *        round, bounded by budget).
 */
const hasResponseNewerThanReview = async (input: {
  pathGiven: string;
}): Promise<boolean> => {
  const pathTaken = getRouteGuardReviewPeerPathTaken({
    pathGiven: input.pathGiven,
  });
  try {
    const [givenStat, takenStat] = await Promise.all([
      fs.stat(input.pathGiven),
      fs.stat(pathTaken),
    ]);
    return takenStat.mtimeMs > givenStat.mtimeMs;
  } catch (error) {
    // no taken (or no given) on disk → no response to reconsider
    if (isENOENT(error)) return false;
    throw error;
  }
};

/**
 * .what = executes guard review commands and produces review artifacts
 * .why = enables guard to validate stone artifacts via review tools
 */
export const runStoneGuardReviews = async (
  input: {
    stone: RouteStone;
    guard: RouteStoneGuard;
    hash: string;
    iteration: number;
    route: string;
  },
  context: ContextCliEmit & ContextReviewBrainSupply,
): Promise<{
  artifacts: RouteStoneGuardReviewArtifact[];
  exhaustedReviewerSlugs: string[];
}> => {
  // lookup git root for path relativization
  // .why = paths in output should be relative to git root (e.g., .behavior/v.../...), not route
  const gitRoot = await getRepoRootWithFallback({ from: input.route });

  // get prior artifacts for this hash to determine which reviews already done
  // reviews are cached by hash: same artifact content = reuse prior review
  // this avoids redundant compute when artifact hasn't changed
  const priorArtifacts = await getAllStoneGuardArtifactsByHash({
    stone: input.stone,
    hash: input.hash,
    route: input.route,
  });

  // filter to only cache successful reviews (exitClass === 'passed')
  // .note = errors should not be cached because:
  //         - malfunctions: reviewer may have been fixed and needs re-run
  //         - constraints: artifact may have been fixed and needs re-review
  const cachedReviews = priorArtifacts.reviews.filter(
    (r) => r.exitClass === 'passed',
  );

  // reviews are added as we process each peer review (not pre-populated)
  const reviews: RouteStoneGuardReviewArtifact[] = [];

  // track which reviewers were skipped due to exhaustion in THIS iteration
  const exhaustedReviewerSlugs: string[] = [];

  // load current meters for budget state (per stone)
  // .note = slugs are guaranteed unique at parse time via standardizePeerReviewSlugs
  const meters = await getAllRouteStoneGuardReviewPeerMeters({
    route: input.route,
    stone: input.stone.name,
  });
  const meterBySlug = new Map<string, RouteStoneGuardReviewPeerMeter>();
  for (const meter of meters) {
    meterBySlug.set(meter.reviewer.slug, meter);
  }

  // get peer reviews with indices and sort by level (low-to-high = cheapest first)
  // .why = cheap (low level) runs first, expensive (high level) only after cheap clears
  const peerReviews = getGuardPeerReviews(input.guard);
  const peerReviewsWithIndex = peerReviews.map((review, i) => ({
    review,
    index: i + 1,
    arrayIndex: i,
    slug: getReviewPeerSlug(review),
    level: getReviewPeerLevel(review),
    budget: getReviewPeerBudget(review),
  }));
  peerReviewsWithIndex.sort((a, b) => a.level - b.level);

  // get thresholds for verdict computation
  // .why = verdicts need allowBlockers/allowNitpicks from guard judge
  // .note = defaults to (0, 0) when no reviewed? judge is configured
  const thresholds = getReviewedJudgeThresholds(input.guard) ?? {
    allowBlockers: 0,
    allowNitpicks: 0,
  };
  const { allowBlockers, allowNitpicks } = thresholds;

  // load human overrules so an overruled level counts as terminal for unlock
  // .why = after a human overrules l1, l1's blockers are forgiven and l1 is
  //        terminal, so the next level (l3) can run in this same pass
  const { levels: overruledLevels } = await getStoneGuardOverruledLevels({
    stone: input.stone,
    route: input.route,
  });

  // compute current verdicts for level unlock logic
  const computeVerdicts = () =>
    peerReviewsWithIndex.map((pr) => {
      const meter = meterBySlug.get(pr.slug);
      const rounds = meter?.rounds ?? 0;
      // check fresh reviews first (this run), then cached reviews (prior runs)
      const freshReview = reviews.find((r) => r.index === pr.index);
      const cachedReview = cachedReviews.find((r) => r.index === pr.index);
      const review = freshReview ?? cachedReview;
      const blockers = review?.blockers ?? Infinity;
      // wasExhausted = no review for this hash AND budget exhausted
      // .note = if review ran (fresh or cached), wasExhausted is false
      // .fix = must check review.hash matches current hash, not just existence
      //        otherwise reviewForDisplay (from prior hash) makes wasExhausted false
      const hasReviewForHash = review?.hash === input.hash;
      const wasExhausted = !hasReviewForHash && rounds >= pr.budget;
      return {
        slug: pr.slug,
        level: pr.level,
        verdict: computeReviewPeerVerdict({
          rounds,
          budget: pr.budget,
          blockers,
          nitpicks: review?.nitpicks ?? 0,
          exitClass: review?.exitClass,
          allowBlockers,
          allowNitpicks,
          wasExhausted,
        }),
      };
    });

  // execute each peer review in level order
  for (const pr of peerReviewsWithIndex) {
    const cachedReview = cachedReviews.find((r) => r.index === pr.index);

    // lookup meter state for this reviewer (needed for rounds display and verdict)
    const meter = meterBySlug.get(pr.slug);
    const rounds = meter?.rounds ?? 0;

    // skip if already approved (cached with no blockers)
    // .why = per wish: "if that review has said all good already, then its already cached and budget wont be used"
    // .note = cache check MUST come before exhaustion check to honor this contract
    if (cachedReview && cachedReview.blockers === 0) {
      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'review', index: pr.arrayIndex },
        reviewer: {
          index: pr.index,
          slug: pr.slug,
          level: pr.level,
          budget: pr.budget,
          rounds,
        },
        inflight: null,
        outcome: {
          path: path.relative(gitRoot, cachedReview.path),
          review: {
            blockers: cachedReview.blockers,
            nitpicks: cachedReview.nitpicks,
          },
          judge: null,
        },
      });
      reviews.push(cachedReview);
      continue;
    }

    // compute verdict (exhaustion check)
    // wasExhausted = true when rounds >= budget (we will skip if exhausted)
    const wasExhausted = rounds >= pr.budget;
    const verdict = computeReviewPeerVerdict({
      rounds,
      budget: pr.budget,
      blockers: cachedReview?.blockers ?? Infinity,
      nitpicks: cachedReview?.nitpicks ?? 0,
      exitClass: cachedReview?.exitClass,
      allowBlockers,
      allowNitpicks,
      wasExhausted,
    });

    // skip if exhausted
    // .note = still add latest review for display purposes (shows blockers/nitpicks/path)
    //         when hash changed, cachedReview may be null, so lookup latest by index
    if (isReviewPeerVerdictExhausted(verdict)) {
      // use cached review if available; otherwise lookup latest review for this index
      // .why = hash may have changed since exhaustion, but we still need prior review data
      const reviewForDisplay =
        cachedReview ??
        (await getLatestReviewArtifactForIndex({
          stone: input.stone,
          index: pr.index,
          route: input.route,
        }));

      if (reviewForDisplay) {
        reviews.push(reviewForDisplay);
      }
      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'review', index: pr.arrayIndex },
        reviewer: {
          index: pr.index,
          slug: pr.slug,
          level: pr.level,
          budget: pr.budget,
          rounds,
        },
        inflight: null,
        outcome: {
          path: reviewForDisplay
            ? path.relative(gitRoot, reviewForDisplay.path)
            : null,
          review: {
            exhausted: true,
            blockers: reviewForDisplay?.blockers ?? 0,
            nitpicks: reviewForDisplay?.nitpicks ?? 0,
          },
          judge: null,
        },
      });
      // track that this reviewer was skipped in THIS iteration
      exhaustedReviewerSlugs.push(pr.slug);
      continue;
    }

    // if cached with blockers, reuse the cached rejection UNLESS the driver has
    // posted a fresh response — a .taken.by_self newer than this given.
    // .why = for a reviewer that opted into --conversation, a fresh response
    //        means "reconsider": fall through to re-run so it can see the taken
    //        and converge (drop a refuted blocker). a blind reviewer (no
    //        --conversation) cannot see the response, so it always reuses — no
    //        wasted round. the re-run below spends a round, so the loop is
    //        bounded by budget.
    if (cachedReview && cachedReview.blockers > 0) {
      const optedIntoConversation = getReviewPeerRunCmd(pr.review).includes(
        '$conversation',
      );
      const shouldReconsider =
        optedIntoConversation &&
        (await hasResponseNewerThanReview({ pathGiven: cachedReview.path }));

      if (!shouldReconsider) {
        // .note = budget NOT consumed here because no actual review command runs
        //         budget was consumed when review originally ran
        context.cliEmit.onGuardProgress({
          stone: input.stone,
          step: { phase: 'review', index: pr.arrayIndex },
          reviewer: {
            index: pr.index,
            slug: pr.slug,
            level: pr.level,
            budget: pr.budget,
            rounds,
          },
          inflight: null,
          outcome: {
            path: path.relative(gitRoot, cachedReview.path),
            review: {
              blockers: cachedReview.blockers,
              nitpicks: cachedReview.nitpicks,
            },
            judge: null,
          },
        });

        // still add to reviews array for judge to see
        reviews.push(cachedReview);
        continue;
      }
      // else: a fresh response exists → fall through to re-run WITH --conversation
    }

    // check if lower levels are all terminal before higher level runs
    // .why = cheap (low level) runs first, expensive (high level) only after cheap clears
    // .note = an overruled level counts as terminal: a human waved it through, so
    //         higher levels unlock even if that level still has blockers. drop the
    //         overruled levels' verdicts so those levels read as empty (=terminal).
    const verdicts = computeVerdicts();
    const canRun = isReviewPeerLevelUnlocked({
      reviewers: verdicts.filter((v) => !overruledLevels.has(v.level)),
      level: pr.level,
    });

    // skip if level not yet unlocked (emit queued event)
    if (!canRun) {
      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'review', index: pr.arrayIndex },
        reviewer: {
          index: pr.index,
          slug: pr.slug,
          level: pr.level,
          budget: pr.budget,
          rounds,
        },
        inflight: null,
        outcome: {
          path: null,
          review: { queued: true },
          judge: null,
        },
      });
      continue;
    }

    // emit inflight event before review
    const beganAt = new Date().toISOString();
    context.cliEmit.onGuardProgress({
      stone: input.stone,
      step: { phase: 'review', index: pr.arrayIndex },
      reviewer: {
        index: pr.index,
        slug: pr.slug,
        level: pr.level,
        budget: pr.budget,
        rounds,
      },
      inflight: { beganAt, endedAt: null },
      outcome: null,
    });

    const review = await runOneStoneGuardReview(
      {
        stone: input.stone,
        reviewCmd: getReviewPeerRunCmd(pr.review),
        index: pr.index,
        hash: input.hash,
        iteration: input.iteration,
        route: input.route,
        slug: pr.slug,
        timeout: getReviewPeerTimeout(pr.review),
      },
      context,
    );

    // determine if review actually completed (vs constraint/malfunction)
    // .note = exit 2 with blockers = review worked, found issues
    // .note = exit 2 without blockers = genuine constraint (e.g., absent API key)
    const isGenuineConstraint =
      review.exitClass === 'constraint' && review.blockers === 0;
    const reviewCompleted =
      review.exitClass === 'passed' ||
      (review.exitClass === 'constraint' && review.blockers > 0);

    // increment meter only when review actually completed
    if (reviewCompleted) {
      const newMeter = new RouteStoneGuardReviewPeerMeter({
        stone: input.stone.name,
        reviewer: { slug: pr.slug },
        rounds: rounds + 1,
      });
      await setRouteStoneGuardReviewPeerMeter({
        meter: newMeter,
        route: input.route,
      });
      meterBySlug.set(pr.slug, newMeter);
    }

    // emit finished event after review
    // .note = rounds is +1 only when review completed
    const roundsAfter = reviewCompleted ? rounds + 1 : rounds;

    // determine review outcome based on exit class and blockers
    // .note = constraint (exit 2) with blockers = review worked, show blockers
    // .note = constraint (exit 2) without blockers = genuine constraint, show constraint message
    // .note = malfunction/constraint outcomes are messages, not Error objects
    //         (Error objects should only be constructed when thrown)
    const reviewOutcome = (() => {
      if (review.exitClass === 'malfunction') {
        // include first line of stderr if available for actionable context
        const stderrFirstLine = review.stderr.split('\n')[0]?.trim();
        const detail = stderrFirstLine
          ? `. ${stderrFirstLine}`
          : `. see review artifact for details`;
        return {
          malfunction: `review command failed with exit code ${review.exitCode}${detail}`,
        };
      }
      if (isGenuineConstraint)
        return {
          constraint: `review returned constraint (exit code ${review.exitCode}) without blockers`,
        };
      return { blockers: review.blockers, nitpicks: review.nitpicks };
    })();

    context.cliEmit.onGuardProgress({
      stone: input.stone,
      step: { phase: 'review', index: pr.arrayIndex },
      reviewer: {
        index: pr.index,
        slug: pr.slug,
        level: pr.level,
        budget: pr.budget,
        rounds: roundsAfter,
      },
      inflight: { beganAt, endedAt: new Date().toISOString() },
      outcome: {
        path: review.path,
        review: reviewOutcome,
        judge: null,
      },
    });

    reviews.push(review);
  }

  return { artifacts: reviews, exhaustedReviewerSlugs };
};

/**
 * .what = validates command does not use npx rhachet/rhx patterns
 * .why = npx adds 500-2000ms latency and has cross-platform issues
 */
const validateNoNpx = (cmd: string): void => {
  // reject guards that use npx patterns
  if (cmd.includes('npx rhachet') || cmd.includes('npx rhx')) {
    const pattern = cmd.includes('npx rhachet') ? 'npx rhachet' : 'npx rhx';
    const alias = cmd.includes('npx rhachet') ? '$rhachet' : '$rhx';
    throw new BadRequestError(
      `guard uses ${pattern} which causes latency and cross-platform issues`,
      {
        pattern,
        hint: `use ${alias} alias instead (expands to ./node_modules/.bin/${alias.slice(1)})`,
      },
    );
  }
};

/**
 * .what = substitutes variables in a command string
 * .why = enables dynamic command templates in guard files
 */
const substituteVars = (
  cmd: string,
  vars: {
    stone: string;
    route: string;
    hash: string;
    output: string;
    conversation: string;
    repoRoot: string;
  },
): string => {
  const rhxPath = path.join(vars.repoRoot, 'node_modules', '.bin', 'rhx');
  const rhachetPath = path.join(
    vars.repoRoot,
    'node_modules',
    '.bin',
    'rhachet',
  );

  // .note = $conversation substituted BEFORE the shorter vars so its expansion
  //         (a space-joined file list) is inserted as one unit
  return cmd
    .replace(/\$conversation/g, vars.conversation)
    .replace(/\$stone/g, vars.stone)
    .replace(/\$route/g, vars.route)
    .replace(/\$hash/g, vars.hash)
    .replace(/\$output/g, vars.output)
    .replace(/\$rhx/g, rhxPath)
    .replace(/\$rhachet/g, rhachetPath);
};
