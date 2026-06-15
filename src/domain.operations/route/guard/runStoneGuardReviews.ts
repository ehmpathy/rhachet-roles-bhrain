import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getGitRepoRoot } from 'rhachet-artifact-git';
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

import { formatTreeBucket } from './formatTreeBucket';
import { getAllStoneGuardArtifactsByHash } from './getAllStoneGuardArtifactsByHash';
import { getExitCodeClass } from './getExitCodeClass';
import { getLatestReviewArtifactForIndex } from './getLatestReviewArtifactForIndex';
import { getReviewCountsFromContent } from './getReviewCountsFromContent';
import { computeReviewPeerVerdict } from './reviewPeerMeter/computeReviewPeerVerdict';
import { getAllRouteStoneGuardReviewPeerMeters } from './reviewPeerMeter/getAllRouteStoneGuardReviewPeerMeters';
import { getReviewedJudgeThresholds } from './reviewPeerMeter/getReviewedJudgeThresholds';
import {
  isReviewPeerLevelTerminal,
  isReviewPeerVerdictExhausted,
} from './reviewPeerMeter/isReviewPeerLevelTerminal';
import { setRouteStoneGuardReviewPeerMeter } from './reviewPeerMeter/setRouteStoneGuardReviewPeerMeter';

const execAsync = promisify(exec);

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
 * .what = 21 minute timeout for review command execution
 * .why = prevents hung review processes from wait indefinitely
 * .note = override via RHACHET_REVIEW_TIMEOUT_MS env var for tests
 */
const REVIEW_TIMEOUT_MS =
  process.env.RHACHET_REVIEW_TIMEOUT_MS !== undefined
    ? parseInt(process.env.RHACHET_REVIEW_TIMEOUT_MS, 10)
    : 21 * 60 * 1000;

/**
 * .what = executes a single guard review command and produces review artifact
 * .why = enables guard to validate stone artifacts via review tools
 */
export const runOneStoneGuardReview = async (input: {
  stone: RouteStone;
  reviewCmd: string;
  index: number;
  hash: string;
  iteration: number;
  route: string;
}): Promise<RouteStoneGuardReviewArtifact> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // lookup repo root for $rhx/$rhachet paths
  // .note = falls back to cwd when not in a git repo (e.g., integration tests)
  let repoRoot: string;
  try {
    repoRoot = await getGitRepoRoot({ from: input.route });
  } catch {
    repoRoot = process.cwd();
  }

  // validate no npx patterns before variable substitution
  validateNoNpx(input.reviewCmd);

  // substitute variables in command
  const outputPath = path.join(
    routeDir,
    `${input.stone.name}.guard.review.i${input.iteration}.${input.hash}.r${input.index}.md`,
  );
  const cmd = substituteVars(input.reviewCmd, {
    stone: input.stone.name,
    route: input.route,
    hash: input.hash,
    output: outputPath,
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

  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  try {
    const result = await execAsync(cmd, {
      env: execEnv,
      timeout: REVIEW_TIMEOUT_MS,
    });
    stdout = result.stdout;
    stderr = result.stderr;
    exitCode = 0;
  } catch (error: unknown) {
    // capture output and exit code even on failure
    if (error && typeof error === 'object') {
      const errObj = error as Record<string, unknown>;
      stdout = typeof errObj.stdout === 'string' ? errObj.stdout : '';
      stderr = typeof errObj.stderr === 'string' ? errObj.stderr : '';

      // detect timeout (process killed by signal)
      if (errObj.killed === true) {
        stderr = `💥 malfunction: review timed out after ${Math.floor(REVIEW_TIMEOUT_MS / 60000)} minutes`;
        exitCode = 1;
      } else {
        exitCode = typeof errObj.code === 'number' ? errObj.code : 1;
      }
    }
  }

  // classify exit code
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

  const artifactContent = artifactLines.join('\n');

  // write artifact file
  await fs.writeFile(outputPath, artifactContent);

  // parse blockers and nitpicks from stdout via shared operation
  const counts = getReviewCountsFromContent({ content: stdout });
  const { blockers, nitpicks } = counts;

  // parse duration from stdout
  // format: "└─ total: 51455ms" under metrics.realized > time
  const durationMatch = stdout.match(/total:\s*(\d+)ms/i);
  const durationMs = durationMatch?.[1] ? parseInt(durationMatch[1], 10) : null;

  return new RouteStoneGuardReviewArtifact({
    stone: { path: input.stone.path },
    hash: input.hash,
    iteration: input.iteration,
    index: input.index,
    path: outputPath,
    blockers,
    nitpicks,
    exitCode,
    exitClass,
    stdout,
    stderr,
    durationMs,
  });
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
  context: ContextCliEmit,
): Promise<{
  artifacts: RouteStoneGuardReviewArtifact[];
  exhaustedReviewerSlugs: string[];
}> => {
  // lookup git root for path relativization
  // .why = paths in output should be relative to git root (e.g., .behavior/v.../...), not route
  let gitRoot: string;
  try {
    gitRoot = await getGitRepoRoot({ from: input.route });
  } catch {
    gitRoot = process.cwd();
  }

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

    // if cached with blockers, emit cached and add to reviews
    // .note = budget NOT consumed here because no actual review command runs
    //         budget was consumed when review originally ran
    if (cachedReview && cachedReview.blockers > 0) {
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

    // check if lower levels are all terminal before higher level runs
    // .why = cheap (low level) runs first, expensive (high level) only after cheap clears
    const verdicts = computeVerdicts();
    let canRun = true;
    for (let level = 1; level < pr.level; level++) {
      if (!isReviewPeerLevelTerminal({ reviewers: verdicts, level })) {
        canRun = false;
        break;
      }
    }

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

    const review = await runOneStoneGuardReview({
      stone: input.stone,
      reviewCmd: getReviewPeerRunCmd(pr.review),
      index: pr.index,
      hash: input.hash,
      iteration: input.iteration,
      route: input.route,
    });

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
    // .note = constraint (exit 2) without blockers = genuine constraint, show constraint error
    const reviewOutcome = (() => {
      if (review.exitClass === 'malfunction')
        return { malfunction: new Error(`exit code ${review.exitCode}`) };
      if (isGenuineConstraint)
        return { constraint: new Error(`exit code ${review.exitCode}`) };
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
  if (cmd.includes('npx rhachet') || cmd.includes('npx rhx')) {
    const pattern = cmd.includes('npx rhachet') ? 'npx rhachet' : 'npx rhx';
    const alias = cmd.includes('npx rhachet') ? '$rhachet' : '$rhx';
    throw new Error(
      `guard uses ${pattern} which causes latency and cross-platform issues\n\n` +
        `fix: use ${alias} alias instead\n` +
        `  - ${alias} expands to ./node_modules/.bin/${alias.slice(1)}\n`,
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

  return cmd
    .replace(/\$stone/g, vars.stone)
    .replace(/\$route/g, vars.route)
    .replace(/\$hash/g, vars.hash)
    .replace(/\$output/g, vars.output)
    .replace(/\$rhx/g, rhxPath)
    .replace(/\$rhachet/g, rhachetPath);
};

/**
 * .what = checks if file is present at path
 * .why = enables detection of files written by external commands
 */
const isFilePresent = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};
