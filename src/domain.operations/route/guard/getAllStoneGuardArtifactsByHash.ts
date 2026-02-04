import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardJudgeArtifact } from '@src/domain.objects/Driver/RouteStoneGuardJudgeArtifact';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

/**
 * .what = retrieves prior guard artifacts for a specific hash
 * .why = enables reuse of reviews and judges when artifact content has not changed
 */
export const getAllStoneGuardArtifactsByHash = async (input: {
  stone: RouteStone;
  hash: string;
  route: string;
}): Promise<{
  reviews: RouteStoneGuardReviewArtifact[];
  judges: RouteStoneGuardJudgeArtifact[];
}> => {
  const routeDir = path.join(input.route, '.route');

  // check if .route dir found
  try {
    await fs.access(routeDir);
  } catch {
    return { reviews: [], judges: [] };
  }

  // glob for review files: $stone.guard.review.i$iter.$hash.r$n.md
  const reviewGlob = `${input.stone.name}.guard.review.*.${input.hash}.*.md`;
  const reviewFiles = await enumFilesFromGlob({
    glob: reviewGlob,
    cwd: routeDir,
  });

  // glob for judge files: $stone.guard.judge.i$iter.$hash.j$n.md
  const judgeGlob = `${input.stone.name}.guard.judge.*.${input.hash}.*.md`;
  const judgeFiles = await enumFilesFromGlob({
    glob: judgeGlob,
    cwd: routeDir,
  });

  // parse review files into artifacts
  const reviews: RouteStoneGuardReviewArtifact[] = [];
  for (const filePath of reviewFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const { iteration, index, blockers, nitpicks } = parseReviewMetadata(
      filePath,
      content,
    );
    reviews.push(
      new RouteStoneGuardReviewArtifact({
        stone: { path: input.stone.path },
        hash: input.hash,
        iteration,
        index,
        path: filePath,
        blockers,
        nitpicks,
      }),
    );
  }

  // parse judge files into artifacts
  const judges: RouteStoneGuardJudgeArtifact[] = [];
  for (const filePath of judgeFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const { iteration, index, passed, reason } = parseJudgeMetadata(
      filePath,
      content,
    );
    judges.push(
      new RouteStoneGuardJudgeArtifact({
        stone: { path: input.stone.path },
        hash: input.hash,
        iteration,
        index,
        path: filePath,
        passed,
        reason,
      }),
    );
  }

  return { reviews, judges };
};

/**
 * .what = parses review file metadata from filename and content
 * .why = extracts iteration, index, blockers, nitpicks from review artifact
 */
const parseReviewMetadata = (
  filePath: string,
  content: string,
): { iteration: number; index: number; blockers: number; nitpicks: number } => {
  // filename pattern: $stone.guard.review.i$iter.$hash.r$n.md
  const filename = path.basename(filePath);
  const iterMatch = filename.match(/\.i(\d+)\./);
  const indexMatch = filename.match(/\.r(\d+)\.md$/);

  const iteration = iterMatch?.[1] ? parseInt(iterMatch[1], 10) : 0;
  const index = indexMatch?.[1] ? parseInt(indexMatch[1], 10) : 0;

  // parse blockers and nitpicks from content frontmatter
  const blockerMatch = content.match(/blockers:\s*(\d+)/i);
  const nitpickMatch = content.match(/nitpicks:\s*(\d+)/i);

  const blockers = blockerMatch?.[1] ? parseInt(blockerMatch[1], 10) : 0;
  const nitpicks = nitpickMatch?.[1] ? parseInt(nitpickMatch[1], 10) : 0;

  return { iteration, index, blockers, nitpicks };
};

/**
 * .what = parses judge file metadata from filename and content
 * .why = extracts iteration, index, passed, reason from judge artifact
 */
const parseJudgeMetadata = (
  filePath: string,
  content: string,
): {
  iteration: number;
  index: number;
  passed: boolean;
  reason: string | null;
} => {
  // filename pattern: $stone.guard.judge.i$iter.$hash.j$n.md
  const filename = path.basename(filePath);
  const iterMatch = filename.match(/\.i(\d+)\./);
  const indexMatch = filename.match(/\.j(\d+)\.md$/);

  const iteration = iterMatch?.[1] ? parseInt(iterMatch[1], 10) : 0;
  const index = indexMatch?.[1] ? parseInt(indexMatch[1], 10) : 0;

  // parse passed and reason from content frontmatter
  const passedMatch = content.match(/passed:\s*(true|false)/i);
  const reasonMatch = content.match(/reason:\s*(.+)/i);

  const passed = passedMatch?.[1]
    ? passedMatch[1].toLowerCase() === 'true'
    : false;
  const reason = reasonMatch?.[1] ? reasonMatch[1].trim() : null;

  return { iteration, index, passed, reason };
};
