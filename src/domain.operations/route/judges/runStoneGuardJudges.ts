import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { getGitRepoRoot } from 'rhachet-artifact-git';
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

  // execute command with node_modules/.bin in PATH
  // .why = enables guards to use `rhx` or `rhachet` directly without npx
  // .note = falls back to cwd when not in a git repo (e.g., integration tests)
  let repoRoot: string;
  try {
    repoRoot = await getGitRepoRoot({ from: input.route });
  } catch {
    repoRoot = process.cwd();
  }
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
  // also include exit code so cached reads can extract failure reason
  const fileWritten = await isFilePresent(outputPath);
  if (!fileWritten) {
    const outputParts = [stdout, stderr].filter(Boolean);
    if (exitCode !== 0) {
      outputParts.push(`\n---metadata---\nexit code: ${exitCode}`);
    }
    const output = outputParts.join('\n\n---stderr---\n');
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
  const reason = parseReason(content, exitCode);

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

  // parse prior judges to build cache
  // note: enumFilesFromGlob returns absolute paths, so use directly
  // cache only passed judges - failures retry fresh each attempt
  const priorByIndex = new Map<number, RouteStoneGuardJudgeArtifact>();
  for (const filePath of priorJudgeFiles) {
    const content = await fs.readFile(filePath, 'utf-8');
    const passed = parsePassed(content, null);
    const reason = parseReason(content, null);

    // parse index from filename: $stone.guard.judge.i$rp$j.$reviewHash.$judgeHash.j$index.md
    const indexMatch = filePath.match(/\.j(\d+)\.md$/);
    const index = indexMatch?.[1] ? parseInt(indexMatch[1], 10) : 0;

    // parse review iteration from filename (the first number in i$rp$j)
    const reviewIterMatch = filePath.match(/\.i(\d+)p/);
    const reviewIteration = reviewIterMatch?.[1]
      ? parseInt(reviewIterMatch[1], 10)
      : 0;

    // cache first passed result found for each index (same hash = same result)
    if (index > 0 && !priorByIndex.has(index) && passed) {
      priorByIndex.set(
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

  // judge iteration: count of prior files + 1 (only increments when new judge runs)
  const judgeIteration = priorJudgeFiles.length + 1;

  const judges: RouteStoneGuardJudgeArtifact[] = [];

  // execute each judge command, reuse prior results with same judge input hash
  for (let i = 0; i < input.guard.judges.length; i++) {
    const judgeCmd = input.guard.judges[i];
    if (!judgeCmd) continue;
    const index = i + 1;

    // if prior passed judge exists for this judge input hash, reuse it
    // same inputs + passed = same result, no need to re-run
    const prior = priorByIndex.get(index);
    if (prior) {
      // emit cached event for progress output
      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'judge', index: i },
        inflight: null,
        outcome: null,
      });
      judges.push(prior);
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
 *
 * critical: when exitCode is null (read from file), we only trust
 * explicit passed: true. any ambiguity defaults to failed to prevent
 * false cache of failures as passes.
 */
const parsePassed = (content: string, exitCode: number | null): boolean => {
  // first check explicit passed: true/false in content
  const passedMatch = content.match(/passed:\s*(true|false)/i);
  if (passedMatch?.[1]) {
    return passedMatch[1].toLowerCase() === 'true';
  }

  // check for failure indicators in content
  // if file shows error output, treat as failed
  if (content.includes('command failed') || content.includes('exit code')) {
    return false;
  }

  // if we have exitCode from live execution, use it
  if (exitCode !== null) {
    return exitCode === 0;
  }

  // when read from file without exitCode context, default to failed
  // this prevents false cache of failures as passes
  return false;
};

/**
 * .what = parses reason from content
 * .why = extracts explanation for judge verdict
 *
 * failfast: returns first line of stderr if no explicit reason found
 * this ensures errors like "command not found" are visible
 */
const parseReason = (
  content: string,
  exitCode: number | null,
): string | null => {
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

  // fallback: if command failed but no reason extracted, include exit code + hint
  if (exitCode !== null && exitCode !== 0) {
    return `command exited ${exitCode}; see judge artifact for details`;
  }

  // from file: extract exit code from "exit code N" or "exit code: N" format
  const exitCodeMatch = content.match(/exit code:?\s*(\d+)/i);
  if (exitCodeMatch?.[1] && exitCodeMatch[1] !== '0') {
    return `command exited ${exitCodeMatch[1]}; see judge artifact for details`;
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
