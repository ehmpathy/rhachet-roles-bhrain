import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import {
  getGuardPeerReviews,
  type RouteStoneGuard,
} from '@src/domain.objects/Driver/RouteStoneGuard';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { formatTreeBucket } from './formatTreeBucket';
import { getAllStoneGuardArtifactsByHash } from './getAllStoneGuardArtifactsByHash';
import { getExitCodeClass } from './getExitCodeClass';

const execAsync = promisify(exec);

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
  });

  // execute command from repo root so $route paths work correctly
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  try {
    const result = await execAsync(cmd);
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
  const doneIndices = new Set(priorArtifacts.reviews.map((r) => r.index));

  const reviews: RouteStoneGuardReviewArtifact[] = [...priorArtifacts.reviews];

  // execute each peer review command that hasn't been done
  const peerReviews = getGuardPeerReviews(input.guard);
  for (let i = 0; i < peerReviews.length; i++) {
    const reviewCmd = peerReviews[i];
    if (!reviewCmd) continue;
    const index = i + 1;

    // skip if already done (emit cached event for progress output)
    if (doneIndices.has(index)) {
      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'review', index: i },
        inflight: null,
        outcome: null,
      });
      continue;
    }

    // emit inflight event before review
    const beganAt = new Date().toISOString();
    context.cliEmit.onGuardProgress({
      stone: input.stone,
      step: { phase: 'review', index: i },
      inflight: { beganAt, endedAt: null },
      outcome: null,
    });

    const review = await runOneStoneGuardReview({
      stone: input.stone,
      reviewCmd,
      index,
      hash: input.hash,
      iteration: input.iteration,
      route: input.route,
    });

    // emit finished event after review
    context.cliEmit.onGuardProgress({
      stone: input.stone,
      step: { phase: 'review', index: i },
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
 * .what = substitutes variables in a command string
 * .why = enables dynamic command templates in guard files
 */
const substituteVars = (
  cmd: string,
  vars: { stone: string; route: string; hash: string; output: string },
): string => {
  return cmd
    .replace(/\$stone/g, vars.stone)
    .replace(/\$route/g, vars.route)
    .replace(/\$hash/g, vars.hash)
    .replace(/\$output/g, vars.output);
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
