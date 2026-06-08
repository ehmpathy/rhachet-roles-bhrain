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
import { computeReviewPeerVerdict } from './reviewPeerMeter/computeReviewPeerVerdict';
import { getAllRouteStoneGuardReviewPeerMeters } from './reviewPeerMeter/getAllRouteStoneGuardReviewPeerMeters';
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
  };

  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  try {
    const result = await execAsync(cmd, { env: execEnv });
    stdout = result.stdout;
    stderr = result.stderr;
    exitCode = 0;
  } catch (error: unknown) {
    // capture output and exit code even on failure
    if (error && typeof error === 'object') {
      const errObj = error as Record<string, unknown>;
      stdout = typeof errObj.stdout === 'string' ? errObj.stdout : '';
      stderr = typeof errObj.stderr === 'string' ? errObj.stderr : '';
      exitCode = typeof errObj.code === 'number' ? errObj.code : 1;
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

  // parse blockers and nitpicks from stdout (where review tools output)
  const blockers = parseCount(stdout, /blockers?:\s*(\d+)/i);
  const nitpicks = parseCount(stdout, /nitpicks?:\s*(\d+)/i);

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
): Promise<RouteStoneGuardReviewArtifact[]> => {
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

  // compute current verdicts for level unlock logic
  const computeVerdicts = () =>
    peerReviewsWithIndex.map((pr) => {
      const meter = meterBySlug.get(pr.slug);
      const rounds = meter?.rounds ?? 0;
      // check fresh reviews first (this run), then cached reviews (prior runs)
      const freshReview = reviews.find((r) => r.index === pr.index);
      const cachedReview = cachedReviews.find((r) => r.index === pr.index);
      const blockers =
        freshReview?.blockers ?? cachedReview?.blockers ?? Infinity;
      return {
        slug: pr.slug,
        level: pr.level,
        verdict: computeReviewPeerVerdict({
          rounds,
          budget: pr.budget,
          blockers,
        }),
      };
    });

  // execute each peer review in level order
  for (const pr of peerReviewsWithIndex) {
    const cachedReview = cachedReviews.find((r) => r.index === pr.index);

    // skip if already approved (cached with no blockers)
    // .why = per wish: "if that review has said all good already, then its already cached and budget wont be used"
    // .note = cache check MUST come before exhaustion check to honor this contract
    if (cachedReview && cachedReview.blockers === 0) {
      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'review', index: pr.arrayIndex },
        inflight: null,
        outcome: null,
      });
      reviews.push(cachedReview);
      continue;
    }

    // compute verdict (exhaustion check)
    const meter = meterBySlug.get(pr.slug);
    const rounds = meter?.rounds ?? 0;
    const verdict = computeReviewPeerVerdict({
      rounds,
      budget: pr.budget,
      blockers: cachedReview?.blockers ?? Infinity,
    });

    // skip if exhausted
    // .note = still add cached review for display purposes (shows last review path)
    if (isReviewPeerVerdictExhausted(verdict)) {
      if (cachedReview) {
        reviews.push(cachedReview);
      }
      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'review', index: pr.arrayIndex },
        inflight: null,
        outcome: {
          path: cachedReview?.path ?? null,
          review: { exhausted: true },
          judge: null,
        },
      });
      continue;
    }

    // if cached with blockers, emit cached and add to reviews
    // .note = budget NOT consumed here because no actual review command runs
    //         budget was consumed when review originally ran
    if (cachedReview && cachedReview.blockers > 0) {
      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'review', index: pr.arrayIndex },
        inflight: null,
        outcome: null,
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

    // increment meter on successful review (not malfunction)
    if (review.exitClass !== 'malfunction') {
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
    context.cliEmit.onGuardProgress({
      stone: input.stone,
      step: { phase: 'review', index: pr.arrayIndex },
      inflight: { beganAt, endedAt: new Date().toISOString() },
      outcome: {
        path: review.path,
        review:
          review.exitClass === 'malfunction'
            ? { malfunction: new Error(`exit code ${review.exitCode}`) }
            : { blockers: review.blockers, nitpicks: review.nitpicks },
        judge: null,
      },
    });

    reviews.push(review);
  }

  return reviews;
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
 * .what = parses numeric count from content via regex
 * .why = extracts blocker/nitpick counts from review output
 */
const parseCount = (content: string, pattern: RegExp): number => {
  const match = content.match(pattern);
  return match?.[1] ? parseInt(match[1], 10) : 0;
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
