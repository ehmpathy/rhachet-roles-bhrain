import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { getAllStoneGuardArtifactsByHash } from './getAllStoneGuardArtifactsByHash';

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

  // execute command
  let stdout = '';
  let stderr = '';
  try {
    const result = await execAsync(cmd, { cwd: input.route });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error: unknown) {
    // capture output even on failure
    if (error && typeof error === 'object') {
      const errObj = error as Record<string, unknown>;
      stdout = typeof errObj.stdout === 'string' ? errObj.stdout : '';
      stderr = typeof errObj.stderr === 'string' ? errObj.stderr : '';
    }
  }

  // write output if command produced stdout and no file was written
  const fileWritten = await isFilePresent(outputPath);
  if (!fileWritten && stdout) {
    await fs.writeFile(outputPath, stdout);
  }

  // read the output file to parse metadata
  let content = '';
  try {
    content = await fs.readFile(outputPath, 'utf-8');
  } catch {
    // file may not exist if command failed
    content = stderr || 'review command failed';
    await fs.writeFile(outputPath, content);
  }

  // parse blockers and nitpicks from content
  const blockers = parseCount(content, /blockers?:\s*(\d+)/i);
  const nitpicks = parseCount(content, /nitpicks?:\s*(\d+)/i);

  return new RouteStoneGuardReviewArtifact({
    stone: { path: input.stone.path },
    hash: input.hash,
    iteration: input.iteration,
    index: input.index,
    path: outputPath,
    blockers,
    nitpicks,
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

  // execute each review command that hasn't been done
  for (let i = 0; i < input.guard.reviews.length; i++) {
    const reviewCmd = input.guard.reviews[i];
    if (!reviewCmd) continue;
    const index = i + 1;

    // skip if already done
    if (doneIndices.has(index)) continue;

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
        review: { blockers: review.blockers, nitpicks: review.nitpicks },
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
