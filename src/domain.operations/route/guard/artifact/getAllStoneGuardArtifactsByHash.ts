import * as fs from 'fs/promises';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardJudgeArtifact } from '@src/domain.objects/Driver/RouteStoneGuardJudgeArtifact';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';

import { getDurationMsFromContent } from '../getDurationMsFromContent';
import { getExitCodeClass } from '../getExitCodeClass';
import { enumRouteGuardJudgeFiles } from '../judge/enumRouteGuardJudgeFiles';
import { getReviewCountsViaRegex } from '../review/getReviewCountsViaRegex';
import { getReviewTacticFromContent } from '../review/getReviewTacticFromContent';
import { enumRouteGuardReviewPeerFiles } from '../review/peer/enumRouteGuardReviewPeerFiles';

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
  // enumerate review files from .reviews/peer/
  const reviewFiles = await enumRouteGuardReviewPeerFiles({
    route: input.route,
    stone: input.stone.name,
    hash: input.hash,
  });

  // enumerate judge files from .route/
  const judgeFiles = await enumRouteGuardJudgeFiles({
    route: input.route,
    stone: input.stone.name,
    hash: input.hash,
  });

  // return early if no files found
  if (reviewFiles.length === 0 && judgeFiles.length === 0) {
    return { reviews: [], judges: [] };
  }

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
        tallier: parsed.tallier,
        exitCode: parsed.exitCode,
        exitClass: parsed.exitClass,
        stdout: parsed.stdout,
        stderr: parsed.stderr,
        durationMs: parsed.durationMs,
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
  tallier: 'deterministic' | 'probabilistic' | null;
  exitCode: number;
  exitClass: 'passed' | 'constraint' | 'malfunction';
  stdout: string;
  stderr: string;
  durationMs: number | null;
} => {
  // filename format: $stone._.review.i$iter.$hash.r$n._.given.by_peer.$slug.md
  const filename = path.basename(filePath);
  const iterMatch = filename.match(/\.i(\d+)\./);
  const indexMatch = filename.match(/\.r(\d+)\./);

  // iteration is required - file matched our glob, must have iteration marker
  if (!iterMatch?.[1])
    UnexpectedCodePathError.throw(
      'review file lacks iteration marker in filename. ' +
        'expected format: $stone._.review.i$iter.$hash.r$n._.given.by_peer.$slug.md. ' +
        'fix: delete the malformed file and re-run the guard',
      { filename, filePath },
    );
  const iteration = parseInt(iterMatch[1], 10);

  // index is required - file matched our glob, must have reviewer index
  if (!indexMatch?.[1])
    UnexpectedCodePathError.throw(
      'review file lacks reviewer index in filename. ' +
        'expected format: $stone._.review.i$iter.$hash.r$n._.given.by_peer.$slug.md. ' +
        'fix: delete the malformed file and re-run the guard',
      {
        filename,
        filePath,
      },
    );
  const index = parseInt(indexMatch[1], 10);

  // parse blockers and nitpicks from content — undetected reviews reconstruct as 0/0
  const counts = getReviewCountsViaRegex({ content });
  const blockers = counts.detected ? counts.blockers : 0;
  const nitpicks = counts.detected ? counts.nitpicks : 0;

  // recover which tallier produced the count from the persisted footer (shared parse). the
  // computed value is the internal tactic; it lands on the contract `tallier` field below.
  const tactic = getReviewTacticFromContent({ content });

  // parse duration from content via shared operation
  const durationMs = getDurationMsFromContent({ content });

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
    tallier: tactic,
    exitCode,
    exitClass,
    stdout,
    stderr,
    durationMs,
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
  // filename format: $stone.guard.judge.i$rp$j.$reviewHash.$judgeHash.j$index.md
  const filename = path.basename(filePath);
  const iterMatch = filename.match(/\.i(\d+)[p.]/);
  const indexMatch = filename.match(/\.j(\d+)\.md$/);

  // iteration is required - file matched our glob, must have iteration marker
  if (!iterMatch?.[1])
    UnexpectedCodePathError.throw(
      'judge file lacks iteration marker in filename. ' +
        'expected format: $stone.guard.judge.i$rp$j.$hash.j$index.md. ' +
        'fix: delete the malformed file and re-run the guard',
      {
        filename,
        filePath,
      },
    );
  const iteration = parseInt(iterMatch[1], 10);

  // index is required - file matched our glob, must have judge index
  if (!indexMatch?.[1])
    UnexpectedCodePathError.throw(
      'judge file lacks judge index in filename. ' +
        'expected format: $stone.guard.judge.i$rp$j.$hash.j$index.md. ' +
        'fix: delete the malformed file and re-run the guard',
      {
        filename,
        filePath,
      },
    );
  const index = parseInt(indexMatch[1], 10);

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
