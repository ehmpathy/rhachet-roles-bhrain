import { exec } from 'child_process';
import * as path from 'path';
import { getGitRepoRoot } from 'rhachet-artifact-git';
import { isPresent } from 'type-fns';
import { promisify } from 'util';

import type { ContextCliEmit } from '@src/domain.objects/Driver/ContextCliEmit';
import type { ContextStoneGuardRound } from '@src/domain.objects/Driver/ContextStoneGuardRound';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import type { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';
import { RouteStoneGuardJudgeArtifact } from '@src/domain.objects/Driver/RouteStoneGuardJudgeArtifact';
import { asGuardArtifactIteration } from '@src/domain.operations/route/guard/artifact/asGuardArtifactIteration';
import { asGuardJudgeIndex } from '@src/domain.operations/route/guard/artifact/asGuardJudgeIndex';
import { asCmdWithRuntimeVars } from '@src/domain.operations/route/guard/asCmdWithRuntimeVars';
import { asExitCodeClass } from '@src/domain.operations/route/guard/asExitCodeClass';
import { asExitCodeFromArtifactContent } from '@src/domain.operations/route/guard/asExitCodeFromArtifactContent';
import { asGuardCmdFreeOfNpx } from '@src/domain.operations/route/guard/asGuardCmdFreeOfNpx';
import { asRuntimeGuardBinPaths } from '@src/domain.operations/route/guard/asRuntimeGuardBinPaths';
import type { RuntimeGuardVarName } from '@src/domain.operations/route/guard/RUNTIME_GUARD_VAR_NAMES';
import { setStoneGuardRoundOutput } from '@src/domain.operations/route/guard/round/setStoneGuardRoundOutput';
import { asArtifactStreamsFromContent } from '@src/domain.operations/route/guard/tree/asArtifactStreamsFromContent';
import { formatArtifactFooters } from '@src/domain.operations/route/guard/tree/formatArtifactFooters';
import { formatArtifactStreamBuckets } from '@src/domain.operations/route/guard/tree/formatArtifactStreamBuckets';
import { enumFilesFromGlob } from '@src/utils/enumFilesFromGlob';
import { isErrorOfAbsence } from '@src/utils/fs/isErrorOfAbsence';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

import { asGuardJudgeVerdictMarks } from './asGuardJudgeVerdictMarks';
import { genJudgeRouteDir } from './genJudgeRouteDir';
import { getOneJudgeArtifactContent } from './getOneJudgeArtifactContent';
import { getOneStoneJudgeInputHash } from './getOneStoneJudgeInputHash';
import { setJudgeArtifact } from './setJudgeArtifact';

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
  /** the stone's rewind generation at the moment the round began */
  generation: number;
}): Promise<RouteStoneGuardJudgeArtifact> => {
  // ensure .route directory found or created
  const { path: routeDir } = await genJudgeRouteDir({ route: input.route });

  // lookup repo root for $rhx/$rhachet paths
  // .note = falls back to cwd when not in a git repo (e.g., integration tests)
  const repoRoot = await getGitRepoRoot({ from: input.route }).catch(
    (error: unknown) => {
      // only catch "not in git repo" error; rethrow any other errors
      // .note = check error message instead of instanceof due to cross-module class instances
      const isNotInGitRepoError =
        error instanceof Error && error.message.includes('Not inside a Git');
      if (!isNotInGitRepoError) throw error;
      return process.cwd();
    },
  );

  // validate no npx patterns before variable substitution
  asGuardCmdFreeOfNpx({ cmd: input.judgeCmd });

  // substitute variables in command
  // filename includes both iterations and both hashes for full traceability:
  // - i$rp$j: review iteration (r) and judge iteration (j) correlate judge with review run
  // - reviewInputHash: links to artifact state that reviews evaluated
  // - judgeInputHash: links to review+approval state that judge evaluated
  const outputPath = path.join(
    routeDir,
    `${input.stone.name}.guard.judge.i${input.reviewIteration}p${input.judgeIteration}.${input.reviewInputHash}.${input.judgeInputHash}.j${input.index}.md`,
  );
  const cmd = asCmdWithSubstitutedVars({
    cmd: input.judgeCmd,
    vars: {
      stone: input.stone.name,
      route: input.route,
      hash: input.judgeInputHash,
      output: outputPath,
      repoRoot,
    },
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
    // execute with cwd = repoRoot so relative route paths (e.g., '.') work correctly
    // .why = the cmd may use --route . which must be relative to repoRoot, not process.cwd()
    const result = await execAsync(cmd, { env: execEnv, cwd: repoRoot });
    stdout = result.stdout;
    stderr = result.stderr;
    exitCode = 0;
  } catch (error: unknown) {
    // capture output and exit code from command failure
    // exec errors have specific shape: { stdout, stderr, code, killed }
    // rethrow if error doesn't match this shape (unexpected error)
    if (
      !error ||
      typeof error !== 'object' ||
      !('code' in error || 'killed' in error)
    ) {
      throw error;
    }

    const errObj = error as Record<string, unknown>;
    stdout = typeof errObj.stdout === 'string' ? errObj.stdout : '';
    stderr = typeof errObj.stderr === 'string' ? errObj.stderr : '';
    exitCode = typeof errObj.code === 'number' ? errObj.code : 1;
  }

  // classify exit code
  const exitClass = asExitCodeClass({ code: exitCode });

  // format artifact content with tree buckets; an empty stream earns no box
  const artifactLines: string[] = [
    ...formatArtifactStreamBuckets({
      stdout,
      stderr,
      hasFooter: exitCode !== 0,
    }),

    // the passage footer, through the one shared operation that owns it.
    // 🔴 a judge renders no tally (no blocker/nitpick count of its own), so `tally` is always
    //    null here, and the shared operation derives the terminal marker from that. do not
    //    hand-write a second footer renderer at this call site
    //    (`rule.forbid.duplicate-format-tree-operations`).
    ...formatArtifactFooters({
      passage:
        exitCode !== 0
          ? {
              blockReason:
                exitClass === 'constraint'
                  ? 'blocked by constraints'
                  : 'blocked by malfunction',
              exitCode,
              exitEmoji: exitClass === 'constraint' ? '✋' : '💥',
            }
          : null,
      tally: null,
    }),
  ];

  const artifactContent = artifactLines.join('\n');

  // write artifact file, only if no rewind superseded the round meanwhile
  await setStoneGuardRoundOutput({
    route: input.route,
    stone: input.stone.name,
    generation: input.generation,
    write: () =>
      setJudgeArtifact({ path: outputPath, content: artifactContent }),
  });

  // parse passed and reason from stdout (where judge tools output)
  const passed = parsePassed(stdout, exitCode);
  const reason = parseReason(stdout, exitCode);

  return new RouteStoneGuardJudgeArtifact({
    stone: { path: input.stone.path },
    hash: input.judgeInputHash,
    iteration: input.reviewIteration,
    index: input.index,
    path: outputPath,
    passed,
    reason,
    exitCode,
    exitClass,
    stdout,
    stderr,
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
  context: ContextCliEmit & ContextStoneGuardRound,
): Promise<RouteStoneGuardJudgeArtifact[]> => {
  // compute judge input hash from reviews + approvals
  // this enables proper cache invalidation when:
  // - approval is granted (review input hash unchanged, but judge input hash changes)
  // - reviews are re-run after fix (review content changes, judge input hash changes)
  const judgeInputHash = await getOneStoneJudgeInputHash({
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
  } catch (error) {
    // .route/ may not exist yet; rethrow any other errors
    if (!isErrorOfAbsence({ error })) throw error;
  }

  // the cache of prior passed judges, by index — failures retry fresh each attempt
  // note: enumFilesFromGlob returns absolute paths, so use directly
  const priorByIndex = await getAllPriorPassedJudgesByIndex({
    files: priorJudgeFiles,
    stone: input.stone,
    hash: judgeInputHash,
  });

  // judge iteration: count of prior files + 1 (only increments when new judge runs)
  const judgeIteration = priorJudgeFiles.length + 1;

  // .note = deliberate mutation: judges run one at a time in declared order with an emit before and after each, so the list grows per awaited run; it escapes only via the return
  const judges: RouteStoneGuardJudgeArtifact[] = [];

  // execute each judge command, reuse prior results with same judge input hash
  for (const [i, judgeCmd] of input.guard.judges.entries()) {
    if (!judgeCmd) continue;
    const index = i + 1;

    // if prior passed judge exists for this judge input hash, reuse it
    // same inputs + passed = same result, no need to re-run
    const prior = priorByIndex.get(index);
    if (prior) {
      // emit cached event for progress output
      // .note = include outcome data for consistency with reviews cached events
      context.cliEmit.onGuardProgress({
        stone: input.stone,
        step: { phase: 'judge', index: i },
        inflight: null,
        outcome: {
          path: prior.path,
          review: null,
          // mirror the fresh-run emit: a malfunctioned judge carries the
          // malfunction variant, never a bare decision. a cached malfunction
          // that emits `decision: 'blocked'` would render the live tree as a
          // hard `✗ blocked` even after a human forgives it — the exact
          // contradiction the persisted tree's `overruled ✓` was meant to end.
          judge:
            prior.exitClass === 'malfunction'
              ? {
                  malfunction: `judge command failed with exit code ${prior.exitCode}`,
                }
              : {
                  decision: prior.passed ? 'allowed' : 'blocked',
                  reason: prior.reason,
                },
        },
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
      generation: context.guardRound.generation,
    });

    // emit finished event after judge
    context.cliEmit.onGuardProgress({
      stone: input.stone,
      step: { phase: 'judge', index: i },
      inflight: { beganAt, endedAt: new Date().toISOString() },
      outcome: {
        path: judge.path,
        review: null,
        judge:
          judge.exitClass === 'malfunction'
            ? {
                malfunction: `judge command failed with exit code ${judge.exitCode}`,
              }
            : {
                decision: judge.passed ? 'allowed' : 'blocked',
                reason: judge.reason,
              },
      },
    });

    judges.push(judge);
  }

  return judges;
};

/**
 * .what = how many prior judge artifact reads may be in flight at one time
 * .why = prior judge artifacts grow with every judge iteration, so an unbounded fan-out
 *        opens one descriptor per file. the bound holds the open reads at a fixed count, as
 *        `getAllStoneGuardJudgeVerdictsFromFiles` does for its reads
 */
const BOUND_OF_CONCURRENT_JUDGE_READS = 8;

/**
 * .what = the prior PASSED judge artifacts for a judge input hash, keyed by judge index
 * .why = names the cache build, so the orchestrator reads it as one act rather than a
 *        stateful loop with a compound predicate (rule.forbid.decode-friction-in-orchestrators)
 *
 * .note = the first passed artifact found per index wins (same hash = same result). the
 *         pour answers in enumeration order, and a `Map` built from a list keeps the LAST
 *         entry per key, so the list is reversed first to keep the first
 */
const getAllPriorPassedJudgesByIndex = async (input: {
  files: string[];
  stone: RouteStone;
  hash: string;
}): Promise<Map<number, RouteStoneGuardJudgeArtifact>> => {
  const priors = (
    await getAllResultsInBoundedPool({
      items: input.files,
      bound: BOUND_OF_CONCURRENT_JUDGE_READS,
      map: (filePath) =>
        getOnePriorPassedJudgeFromFile({
          path: filePath,
          stone: input.stone,
          hash: input.hash,
        }),
    })
  ).filter(isPresent);
  return new Map(
    [...priors].reverse().map((prior) => [prior.index, prior] as const),
  );
};

/**
 * .what = one prior judge artifact, read into its artifact — or null where it is not a
 *         cacheable pass (it vanished, it failed, or its filename carries no index)
 * .why = a failure must retry fresh each attempt, so only a pass with a real index feeds the
 *        cache; a prior artifact deleted since enumeration only shrinks the cache
 */
const getOnePriorPassedJudgeFromFile = async (input: {
  path: string;
  stone: RouteStone;
  hash: string;
}): Promise<RouteStoneGuardJudgeArtifact | null> => {
  // a prior artifact deleted since enumeration is a cache miss; the judge re-runs
  const content = await getOneJudgeArtifactContent({ path: input.path });
  if (content === null) return null;

  // extract stdout/stderr from tree buckets
  const { stdout, stderr, exitCode } = parseTreeBucketContent(content);
  const passed = parsePassed(stdout, exitCode);
  if (!passed) return null;

  // parse index + review iteration from filename: $stone.guard.judge.i$rp$j.$reviewHash.$judgeHash.j$index.md
  const filename = path.basename(input.path);
  const index = asGuardJudgeIndex({ filename });
  if (index === null || index < 1) return null;

  return new RouteStoneGuardJudgeArtifact({
    stone: { path: input.stone.path },
    hash: input.hash,
    iteration: asGuardArtifactIteration({ filename }) ?? 0,
    index,
    path: input.path,
    passed,
    reason: parseReason(stdout, exitCode),
    exitCode,
    exitClass: asExitCodeClass({ code: exitCode }),
    stdout,
    stderr,
  });
};

/**
 * .what = substitutes variables in a command string
 * .why = enables dynamic command templates in guard files
 */
const asCmdWithSubstitutedVars = (input: {
  cmd: string;
  vars: {
    stone: string;
    route: string;
    hash: string;
    output: string;
    repoRoot: string;
  };
}): string => {
  const { cmd, vars } = input;
  const bins = asRuntimeGuardBinPaths({ repoRoot: vars.repoRoot });

  // the name→value map for every runtime var. typed by RuntimeGuardVarName so the
  // COMPILER forbids drift: add a name to RUNTIME_GUARD_VAR_NAMES without a value here,
  // or a value without a name, and this literal fails typecheck.
  const valueByName: Record<RuntimeGuardVarName, string> = {
    $route: vars.route,
    $stone: vars.stone,
    $hash: vars.hash,
    $output: vars.output,
    $rhx: bins.rhx,
    $rhachet: bins.rhachet,
    // $conversation is a REVIEW-run var (resolved in runStoneGuardReviews, which owns the
    // peer-review conversation path). a judge command has no conversation context, so the
    // judge leaves it LITERAL via this self-referential passthrough. this satisfies the
    // shared-const drift-guard and leaves judge behavior intact (judge cmds never carry it).
    $conversation: '$conversation',
    // $targets is a REVIEW-run var too (the computed review scope); left LITERAL here
    $targets: '$targets',
  };

  // replace each runtime var, via the one substitution both runs share
  return asCmdWithRuntimeVars({ cmd, valueByName });
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
  // first check explicit passed: true/false in content, via the one shared reader
  const { passed: passedMark } = asGuardJudgeVerdictMarks({ content });
  if (passedMark !== null) return passedMark;

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
  // check for explicit reason: line first, via the one shared reader
  const { reason: reasonMark } = asGuardJudgeVerdictMarks({ content });
  if (reasonMark) return reasonMark;

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
  const exitCodeFromFile = asExitCodeFromArtifactContent({ content });
  if (exitCodeFromFile !== 0) {
    return `command exited ${exitCodeFromFile}; see judge artifact for details`;
  }

  return null;
};

/**
 * .what = extracts stdout, stderr, and exitCode from tree bucket artifact content
 * .why = enables parse of cached artifacts to reconstruct artifact fields
 */
const parseTreeBucketContent = (
  content: string,
): { stdout: string; stderr: string; exitCode: number } => {
  // the read grammar is `asArtifactStreamsFromContent`, the one splitter every reader
  // of a persisted artifact shares, kept beside the writer with a round-trip test, so a
  // cached judge cannot silently lose its `passed`/`reason` to a drifted regex
  // (rule.require.single-source-of-truth-for-render)
  const { stdout, stderr } = asArtifactStreamsFromContent({ content });

  // extract exit code from passage blocked footer
  const exitCode = asExitCodeFromArtifactContent({ content });

  return { stdout, stderr, exitCode };
};
