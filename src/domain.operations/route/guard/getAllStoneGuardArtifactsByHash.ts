import * as fs from 'fs/promises';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardJudgeArtifact } from '@src/domain.objects/Driver/RouteStoneGuardJudgeArtifact';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { getExitCodeClass } from './getExitCodeClass';

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
    const parsed = parseReviewMetadata(filePath, content);
    reviews.push(
      new RouteStoneGuardReviewArtifact({
        stone: { path: input.stone.path },
        hash: input.hash,
        iteration: parsed.iteration,
        index: parsed.index,
        path: filePath,
        blockers: parsed.blockers,
        nitpicks: parsed.nitpicks,
        exitCode: parsed.exitCode,
        exitClass: parsed.exitClass,
        stdout: parsed.stdout,
        stderr: parsed.stderr,
      }),
    );
  }

  // parse judge files into artifacts
  const judges: RouteStoneGuardJudgeArtifact[] = [];
  for (const filePath of judgeFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = parseJudgeMetadata(filePath, content);
    judges.push(
      new RouteStoneGuardJudgeArtifact({
        stone: { path: input.stone.path },
        hash: input.hash,
        iteration: parsed.iteration,
        index: parsed.index,
        path: filePath,
        passed: parsed.passed,
        reason: parsed.reason,
        exitCode: parsed.exitCode,
        exitClass: parsed.exitClass,
        stdout: parsed.stdout,
        stderr: parsed.stderr,
      }),
    );
  }

  return { reviews, judges };
};

/**
 * .what = parses review file metadata from filename and content
 * .why = extracts iteration, index, blockers, nitpicks, exit info from review artifact
 */
const parseReviewMetadata = (
  filePath: string,
  content: string,
): {
  iteration: number;
  index: number;
  blockers: number;
  nitpicks: number;
  exitCode: number;
  exitClass: 'passed' | 'constraint' | 'malfunction';
  stdout: string;
  stderr: string;
} => {
  // filename pattern: $stone.guard.review.i$iter.$hash.r$n.md
  const filename = path.basename(filePath);
  const iterMatch = filename.match(/\.i(\d+)\./);
  const indexMatch = filename.match(/\.r(\d+)\.md$/);

  const iteration = iterMatch?.[1] ? parseInt(iterMatch[1], 10) : 0;
  const index = indexMatch?.[1] ? parseInt(indexMatch[1], 10) : 0;

  // parse blockers and nitpicks from content
  const blockerMatch = content.match(/blockers?:\s*(\d+)/i);
  const nitpickMatch = content.match(/nitpicks?:\s*(\d+)/i);

  const blockers = blockerMatch?.[1] ? parseInt(blockerMatch[1], 10) : 0;
  const nitpicks = nitpickMatch?.[1] ? parseInt(nitpickMatch[1], 10) : 0;

  // parse exit code from tree bucket format
  const exitCodeMatch = content.match(/exit code:\s*(\d+)/);
  const exitCode = exitCodeMatch?.[1] ? parseInt(exitCodeMatch[1], 10) : 0;
  const exitClass = getExitCodeClass({ code: exitCode });

  // extract stdout/stderr from tree buckets
  const { stdout, stderr } = parseTreeBuckets(content);

  return {
    iteration,
    index,
    blockers,
    nitpicks,
    exitCode,
    exitClass,
    stdout,
    stderr,
  };
};

/**
 * .what = parses judge file metadata from filename and content
 * .why = extracts iteration, index, passed, reason, exit info from judge artifact
 */
const parseJudgeMetadata = (
  filePath: string,
  content: string,
): {
  iteration: number;
  index: number;
  passed: boolean;
  reason: string | null;
  exitCode: number;
  exitClass: 'passed' | 'constraint' | 'malfunction';
  stdout: string;
  stderr: string;
} => {
  // filename pattern: $stone.guard.judge.i$iter.$hash.j$n.md
  const filename = path.basename(filePath);
  const iterMatch = filename.match(/\.i(\d+)\./);
  const indexMatch = filename.match(/\.j(\d+)\.md$/);

  const iteration = iterMatch?.[1] ? parseInt(iterMatch[1], 10) : 0;
  const index = indexMatch?.[1] ? parseInt(indexMatch[1], 10) : 0;

  // parse passed and reason from content
  const passedMatch = content.match(/passed:\s*(true|false)/i);
  const reasonMatch = content.match(/reason:\s*(.+)/i);

  const passed = passedMatch?.[1]
    ? passedMatch[1].toLowerCase() === 'true'
    : false;
  const reason = reasonMatch?.[1] ? reasonMatch[1].trim() : null;

  // parse exit code from tree bucket format
  const exitCodeMatch = content.match(/exit code:\s*(\d+)/);
  const exitCode = exitCodeMatch?.[1] ? parseInt(exitCodeMatch[1], 10) : 0;
  const exitClass = getExitCodeClass({ code: exitCode });

  // extract stdout/stderr from tree buckets
  const { stdout, stderr } = parseTreeBuckets(content);

  return {
    iteration,
    index,
    passed,
    reason,
    exitCode,
    exitClass,
    stdout,
    stderr,
  };
};

/**
 * .what = extracts stdout and stderr from tree bucket format
 * .why = enables reconstruction of artifact fields from file content
 */
const parseTreeBuckets = (
  content: string,
): { stdout: string; stderr: string } => {
  // extract stdout from tree bucket (between "├─ stdout" and next "├─" or "└─")
  const stdoutMatch = content.match(
    /├─ stdout[\s\S]*?│ {2}│\n([\s\S]*?)│ {2}│\n│ {2}└─/,
  );
  const stdoutLines =
    stdoutMatch?.[1]
      ?.split('\n')
      .map((line) => line.replace(/^│ {2}│ {2}/, ''))
      .join('\n') ?? '';

  // extract stderr from tree bucket
  const stderrMatch = content.match(
    /├─ stderr[\s\S]*?│ {2}│\n([\s\S]*?)│ {2}│\n│ {2}└─/,
  );
  const stderrLines =
    stderrMatch?.[1]
      ?.split('\n')
      .map((line) => line.replace(/^│ {2}│ {2}/, ''))
      .join('\n') ?? '';

  return { stdout: stdoutLines.trim(), stderr: stderrLines.trim() };
};
