import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { promisify } from 'util';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';
import { RouteStoneGuardJudgeArtifact } from '@src/domain.objects/Driver/RouteStoneGuardJudgeArtifact';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';

import { computeStoneJudgeInputHash } from './computeStoneJudgeInputHash';

const execAsync = promisify(exec);

/**
 * .what = executes a single guard judge command and produces judge artifact
 * .why = enables guard to determine pass/fail via judge tools
 */
export const runOneStoneGuardJudge = async (input: {
  stone: RouteStone;
  judgeCmd: string;
  index: number;
  reviewInputHash: string;
  judgeInputHash: string;
  reviewIteration: number;
  judgeIteration: number;
  route: string;
}): Promise<RouteStoneGuardJudgeArtifact> => {
  // ensure .route directory found or created
  const routeDir = path.join(input.route, '.route');
  await fs.mkdir(routeDir, { recursive: true });

  // substitute variables in command
  // filename includes both iterations and both hashes for full traceability:
  // - i$rp$j: review iteration (r) and judge iteration (j) correlate judge with review run
  // - reviewInputHash: links to artifact state that reviews evaluated
  // - judgeInputHash: links to review+approval state that judge evaluated
  const outputPath = path.join(
    routeDir,
    `${input.stone.name}.guard.judge.i${input.reviewIteration}p${input.judgeIteration}.${input.reviewInputHash}.${input.judgeInputHash}.j${input.index}.md`,
  );
  const cmd = substituteVars(input.judgeCmd, {
    stone: input.stone.name,
    route: input.route,
    hash: input.judgeInputHash,
    output: outputPath,
  });

  // execute command
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  try {
    const result = await execAsync(cmd, { cwd: input.route });
    stdout = result.stdout;
    stderr = result.stderr;
  } catch (error: unknown) {
    exitCode = 1;
    // capture output even on failure
    if (error && typeof error === 'object') {
      const errObj = error as Record<string, unknown>;
      stdout = typeof errObj.stdout === 'string' ? errObj.stdout : '';
      stderr = typeof errObj.stderr === 'string' ? errObj.stderr : '';
    }
  }

  // write output if command produced output and no file was written
  // failfast: include both stdout and stderr for observability
  const fileWritten = await isFilePresent(outputPath);
  if (!fileWritten) {
    const output = [stdout, stderr].filter(Boolean).join('\n\n---stderr---\n');
    if (output) {
      await fs.writeFile(outputPath, output);
    }
  }

  // read the output file to parse metadata
  let content = '';
  try {
    content = await fs.readFile(outputPath, 'utf-8');
  } catch {
    // file may not exist if command failed with no output
    content = `judge command failed with exit code ${exitCode}\n\nstderr: ${stderr || '(none)'}\nstdout: ${stdout || '(none)'}`;
    await fs.writeFile(outputPath, content);
  }

  // parse passed and reason from content
  const passed = parsePassed(content, exitCode);
  const reason = parseReason(content);

  return new RouteStoneGuardJudgeArtifact({
    stone: { path: input.stone.path },
    hash: input.judgeInputHash,
    iteration: input.reviewIteration,
    index: input.index,
    path: outputPath,
    passed,
    reason,
  });
};

/**
 * .what = executes guard judge commands and produces judge artifacts
 * .why = enables guard to determine pass/fail via judge tools
 *
 * hash principle: judges hash on their inputs (reviews + approvals)
 * - artifact change → review input hash changes → fresh reviews → judge input hash changes → fresh judge
 * - approval granted → review input hash unchanged → cached reviews → judge input hash changes → fresh judge
 * - review re-run after fix → review content changes → judge input hash changes → fresh judge
 */
export const runStoneGuardJudges = async (
  input: {
    stone: RouteStone;
    guard: RouteStoneGuard;
    hash: string;
    iteration: number;
    route: string;
  },
  context: ContextCliEmit,
): Promise<RouteStoneGuardJudgeArtifact[]> => {
  // compute judge input hash from reviews + approvals
  // this enables proper cache invalidation when:
  // - approval is granted (review input hash unchanged, but judge input hash changes)
  // - reviews are re-run after fix (review content changes, judge input hash changes)
  const judgeInputHash = await computeStoneJudgeInputHash({
    stone: input.stone,
    reviewInputHash: input.hash,
    route: input.route,
  });

  // find prior judge artifacts for this judge input hash
  // glob matches: $stone.guard.judge.i$rp$j.$reviewInputHash.$judgeInputHash.j$index.md
  const routeDir = path.join(input.route, '.route');
  const judgeGlob = `${input.stone.name}.guard.judge.*.${input.hash}.${judgeInputHash}.*.md`;
  let priorJudgeFiles: string[] = [];
  try {
    priorJudgeFiles = await enumFilesFromGlob({
      glob: judgeGlob,
      cwd: routeDir,
    });
  } catch {
    // .route/ may not exist yet
  }

  // parse prior judges to build cache and determine judge iteration
  // note: enumFilesFromGlob returns absolute paths, so use directly
  const priorPassedByIndex = new Map<number, RouteStoneGuardJudgeArtifact>();
  let maxPriorJudgeIteration = 0;
  for (const filePath of priorJudgeFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const passed = parsePassed(content, 0);
    const reason = parseReason(content);

    // parse index from filename: $stone.guard.judge.i$rp$j.$reviewHash.$judgeHash.j$index.md
    const indexMatch = filePath.match(/\.j(\d+)\.md$/);
    const index = indexMatch?.[1] ? parseInt(indexMatch[1], 10) : 0;

    // parse review iteration from filename (the first number in i$rp$j)
    const reviewIterMatch = filePath.match(/\.i(\d+)p/);
    const reviewIteration = reviewIterMatch?.[1]
      ? parseInt(reviewIterMatch[1], 10)
      : 0;

    // parse judge iteration from filename (the second number in i$rp$j)
    const judgeIterMatch = filePath.match(/\.i\d+p(\d+)\./);
    const priorJudgeIteration = judgeIterMatch?.[1]
      ? parseInt(judgeIterMatch[1], 10)
      : 0;

    // track max judge iteration to compute next iteration
    if (priorJudgeIteration > maxPriorJudgeIteration) {
      maxPriorJudgeIteration = priorJudgeIteration;
    }

    if (passed && index > 0 && !priorPassedByIndex.has(index)) {
      priorPassedByIndex.set(
        index,
        new RouteStoneGuardJudgeArtifact({
          stone: { path: input.stone.path },
          hash: judgeInputHash,
          iteration: reviewIteration,
          index,
          path: filePath,
          passed,
          reason,
        }),
      );
    }
  }

  // judge iteration: next after max prior, or 1 if no priors
  const judgeIteration = maxPriorJudgeIteration + 1;

  const judges: RouteStoneGuardJudgeArtifact[] = [];

  // execute each judge command, reuse passed priors with same judge input hash
  for (let i = 0; i < input.guard.judges.length; i++) {
    const judgeCmd = input.guard.judges[i];
    if (!judgeCmd) continue;
    const index = i + 1;

    // if prior judge passed for this judge input hash, reuse it
    const priorPassed = priorPassedByIndex.get(index);
    if (priorPassed) {
      judges.push(priorPassed);
      continue;
    }

    // emit inflight event before judge
    const beganAt = new Date().toISOString();
    context.cliEmit.onGuardProgress({
      stone: input.stone,
      step: { phase: 'judge', index: i },
      inflight: { beganAt, endedAt: null },
      outcome: null,
    });

    // run fresh with both hashes and iterations for full traceability
    const judge = await runOneStoneGuardJudge({
      stone: input.stone,
      judgeCmd,
      index,
      reviewInputHash: input.hash,
      judgeInputHash,
      reviewIteration: input.iteration,
      judgeIteration,
      route: input.route,
    });

    // emit finished event after judge
    context.cliEmit.onGuardProgress({
      stone: input.stone,
      step: { phase: 'judge', index: i },
      inflight: { beganAt, endedAt: new Date().toISOString() },
      outcome: {
        path: judge.path,
        review: null,
        judge: {
          decision: judge.passed ? 'passed' : 'failed',
          reason: judge.reason,
        },
      },
    });

    judges.push(judge);
  }

  return judges;
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
 * .what = parses passed status from content and exit code
 * .why = determines judge verdict from output
 */
const parsePassed = (content: string, exitCode: number): boolean => {
  // first check explicit passed: true/false in content
  const passedMatch = content.match(/passed:\s*(true|false)/i);
  if (passedMatch?.[1]) {
    return passedMatch[1].toLowerCase() === 'true';
  }

  // fallback to exit code
  return exitCode === 0;
};

/**
 * .what = parses reason from content
 * .why = extracts explanation for judge verdict
 *
 * failfast: returns first line of stderr if no explicit reason found
 * this ensures errors like "command not found" are visible
 */
const parseReason = (content: string): string | null => {
  // check for explicit reason: line first
  const reasonMatch = content.match(/reason:\s*(.+)/i);
  if (reasonMatch?.[1]) {
    return reasonMatch[1].trim();
  }

  // check for stderr section and extract first meaningful line
  const stderrMatch = content.match(/---stderr---\n(.+)/);
  if (stderrMatch?.[1]) {
    const firstLine = stderrMatch[1].split('\n')[0]?.trim();
    if (firstLine) {
      return `stderr: ${firstLine}`;
    }
  }

  // check for "stderr:" prefix in error message
  const stderrLineMatch = content.match(/stderr:\s*(.+)/i);
  if (stderrLineMatch?.[1] && stderrLineMatch[1] !== '(none)') {
    return stderrLineMatch[1].trim();
  }

  return null;
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
