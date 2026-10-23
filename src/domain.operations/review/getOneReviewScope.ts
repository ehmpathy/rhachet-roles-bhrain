import type { ReviewRunArgsRecord } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';
import { asDidYouKnowLines } from '@src/domain.operations/asDidYouKnowLines';
import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import { getAllTargetsByPolluterVerdict } from '@src/domain.operations/getAllTargetsByPolluterVerdict';
import { asFileDiffByPath } from '@src/domain.operations/review/asFileDiffByPath';
import { asGlobList } from '@src/domain.operations/review/asGlobList';
import { asPathsOfFileDiffs } from '@src/domain.operations/review/asPathsOfFileDiffs';
import { asRefsAbsentHeadline } from '@src/domain.operations/review/asRefsAbsentHeadline';
import { asReviewScopeEmptyRefusalLines } from '@src/domain.operations/review/asReviewScopeEmptyRefusalLines';
import { asTargetPathGlobs } from '@src/domain.operations/review/asTargetPathGlobs';
import { enumFilesForReviewSubjects } from '@src/domain.operations/review/enumFilesForReviewSubjects';
import { enumFilesForReviewSupplies } from '@src/domain.operations/review/enumFilesForReviewSupplies';
import { getAllFileChangesForReview } from '@src/domain.operations/review/getAllFileChangesForReview';
import { getAllFileDiffsOfTargets } from '@src/domain.operations/review/getAllFileDiffsOfTargets';
import { getAllTargetFilesExceptDirs } from '@src/domain.operations/review/getAllTargetFilesExceptDirs';
import { getAllTargetsByCacheStability } from '@src/domain.operations/review/getAllTargetsByCacheStability';
import { getAllTargetsJoined } from '@src/domain.operations/review/getAllTargetsJoined';
import { getAllTargetsScoped } from '@src/domain.operations/review/getAllTargetsScoped';
import { getAllTargetsTouchedAt } from '@src/domain.operations/review/getAllTargetsTouchedAt';
import { ReviewRefusalEmittedError } from '@src/domain.operations/review/ReviewRefusalEmittedError';
import { setScopeArtifact } from '@src/domain.operations/review/setScopeArtifact';
import { setScopeDebugArtifact } from '@src/domain.operations/review/setScopeDebugArtifact';

/**
 * .what = the scope of one review run — its targets, their patches, its refs and its
 *         conversation — with the trace of how the flags reached it, written to the log dir
 * .why = the scope walk is the longest leg of a review run (diffs, paths, join, polluters,
 *        cache order, refs, conversation), and every refusal along it is about
 *        the scope alone. its own operation, so the review orchestrator reads
 *        "scope → compile → split, refuse, prime, or ask" (rule.require.orchestrators-as-narrative)
 *
 * .note = 🔴 it runs ONCE per lane. a split lane's partition runs narrow this one settled
 *         scope (`getAllTargetsOfPartition`) and never walk it again, so the prime and every
 *         partition read the same bytes and no planned target can drift out of the walk
 *
 * .note = 🔴 it writes `input.scope.debug.json` BEFORE the empty-scope check, so a refusal can
 *         cite it, and `input.scope.json` once refs and conversation are known. both land in
 *         the log dir the caller minted, which this step never mints
 * .note = a refusal is a constraint: it is emitted on stderr and thrown as a
 *         `ReviewRefusalEmittedError`, so the cli does not print the frame twice
 */
export const getOneReviewScope = async (
  input: {
    review: {
      rules: string | string[];
      diffs?: string;
      paths?: string | string[];
      pathsWith?: string | string[];
      pathsWout?: string | string[];
      polluters?: 'drop' | 'keep';
      join?: 'union' | 'intersect';
      refs?: string | string[];
      optional?: string[];
      conversation?: string | string[];
      output: string;
      focus: 'pull' | 'push';
      goal: 'exhaustive' | 'representative';
      partitions?: string[];
    };
    /** the slug of the brain the run asks, recorded among the run's args */
    brain: string;
    /** the rule files the caller already enumerated, recorded in the trace */
    ruleFiles: string[];
    /** the run's log dir, minted by the caller, and its form relative to cwd */
    logDir: string;
    logDirRelative: string;
  },
  context: { cwd: string },
): Promise<{
  /** the whole invocation, as both input artifacts record it */
  args: ReviewRunArgsRecord['args'];
  /** the trace of how the flags reached the targets, as `input.scope.debug.json` records it */
  resolution: Parameters<typeof setScopeDebugArtifact>[0]['resolution'];
  /** the include and exclude path globs, sorted out of the three path flags */
  paths: { with: string[]; wout: string[] };
  join: 'union' | 'intersect';
  targets: {
    fromDiffs: string[];
    fromPaths: string[];
    /** the targets this run reviews, ordered by cache stability */
    files: string[];
  };
  fileDiffByPath: ReturnType<typeof asFileDiffByPath>;
  refFiles: string[];
  conversationFiles: string[];
}> => {
  const { review } = input;
  const { cwd } = context;

  // select the files the range changed — path and kind only; a patch is read later, and
  // only for the targets the scope walk keeps (getAllFileChangesForReview holds the why)
  const fileChangesFromRange = getAllFileChangesForReview({
    diffs: review.diffs,
    cwd,
  });

  // derive the plain path list (for joins/exclusions)
  const targetFilesFromDiffs = asPathsOfFileDiffs({
    of: fileChangesFromRange.changes,
  });

  // sort the three path flags into the one include/exclude pair every
  // downstream scope reader consults
  const { positive: positivePathGlobs, negative: negativePathGlobs } =
    asTargetPathGlobs({
      paths: review.paths,
      pathsWith: review.pathsWith,
      pathsWout: review.pathsWout,
    });

  const targetFilesFromPaths = await enumFilesForReviewSubjects({
    glob: positivePathGlobs,
    cwd,
  });

  // join target files from diffs and paths (union or intersect), then apply exclusions
  const joinMode = review.join ?? 'intersect';
  const targetFilesJoined = getAllTargetsJoined({
    fromDiffs: targetFilesFromDiffs,
    fromPaths: targetFilesFromPaths,
    diffsRequested: !!review.diffs,
    pathsRequested: positivePathGlobs.length > 0,
    join: joinMode,
  });
  // drop every target that resolves to a directory — a symlink to a dir holds no content, and a read of it fails
  const targetFilesScoped = await getAllTargetFilesExceptDirs({
    files: getAllTargetsScoped({
      targets: targetFilesJoined,
      excluded: negativePathGlobs,
    }),
    cwd,
  });

  /**
   * drop the scope polluters — a route's own paperwork, every caught dream,
   * and every machine-written lockfile.
   *
   * 🔴 it lands HERE, after the join, and that placement is the whole point. an
   * exclusion expressed as a negative glob reaches only the `--paths` side:
   * `enumFilesFromGlob` applies negatives while it enumerates, and a `--diffs`
   * range never passes through it. so a glob-shaped exclusion binds ONE of the
   * two sources and reads as though it bound both — the defect this filter
   * exists to make impossible (rule.require.exclude-review-scope-polluters).
   *
   * 🔴 .and it drops only what RODE IN. a polluter a caller named by a specific
   *     `--paths` glob is their declared subject, so it is kept — otherwise the
   *     78 binds across 38 guards that read a route's own deliverable
   *     (`--paths-with '$route/3.3.blueprint.*.md'`) scope to zero files and
   *     refuse. `getAllTargetsAskedForByName` holds that argument and its bound.
   *
   * .note = `isTargetPolluter` holds the argument, the measured cost, and the
   *         reason the route VARIANT is matched at the repo root rather than
   *         structurally.
   */
  const polluterMode = review.polluters ?? 'drop';
  const {
    kept: targetFilesKept,
    dropped: targetFilesDropped,
    askedForByName: targetFilesAskedForByName,
  } = getAllTargetsByPolluterVerdict({
    targets: targetFilesScoped,
    globs: positivePathGlobs,
    mode: polluterMode,
  });

  /**
   * order the corpus least-recently-touched FIRST, rather than alphabetically.
   *
   * 🔴 the order decides where a prompt cache's prefix breaks inside the target
   * section. an edit stamps a file newest, so it sorts to the tail — and repair has
   * temporal locality, so the files that move are the files already at the tail.
   * the break therefore lands late, where alphabetical order puts it in the middle
   * (getAllTargetsByCacheStability holds the full argument).
   *
   * .note = the stat is a raw i/o boundary, so it lives in its own communicator
   *         rather than inline here — this orchestrator composes the read and the
   *         sort, it performs neither (define.domain-operation-grains).
   *         `getAllTargetsTouchedAt` grades an ABSENT file to null and throws on
   *         every other errno, so a permission denial cannot arrive as an absence
   *         (rule.forbid.failhide).
   */
  const targetFiles = getAllTargetsByCacheStability({
    targets: await getAllTargetsTouchedAt({ cwd, paths: targetFilesKept }),
  });

  // read the patch of each target the range changed — of the targets, and of no other
  const fileDiffByPath = asFileDiffByPath({
    of: getAllFileDiffsOfTargets({
      selection: fileChangesFromRange,
      targets: targetFiles,
      cwd,
    }),
  });

  // the whole invocation, built once and recorded by both writers
  const argsOfRun: ReviewRunArgsRecord['args'] = {
    rules: review.rules,
    diffs: review.diffs,
    paths: review.paths,
    pathsWith: review.pathsWith,
    pathsWout: review.pathsWout,
    polluters: polluterMode,
    join: joinMode,
    refs: review.refs,
    conversation: review.conversation,
    output: review.output,
    focus: review.focus,
    goal: review.goal,
    brain: input.brain,
    optional: review.optional ?? [],
    partitions: review.partitions ?? [],
    // the scope is settled once, for the whole lane; a partition run records its own name
    partition: null,
  };

  // write the scope trace BEFORE validation, so a refusal can cite it
  const resolution: Parameters<typeof setScopeDebugArtifact>[0]['resolution'] =
    {
      ruleFiles: input.ruleFiles,
      targetFilesFromDiffs,
      targetFilesFromPaths,
      joinMode,
      targetFilesJoined,
      targetFilesDropped,
      targetFilesAskedForByName,
      targetFiles,
    };
  await setScopeDebugArtifact({
    logDir: input.logDir,
    args: argsOfRun,
    resolution,
  });

  // validate combined scope is non-empty
  if (targetFiles.length === 0) {
    emitReviewRefusal({
      kind: 'constraint',
      headline: 'combined scope resolves to zero files',
      lines: asReviewScopeEmptyRefusalLines({
        diffs: { flag: review.diffs, files: targetFilesFromDiffs.length },
        paths: {
          with: positivePathGlobs,
          wout: negativePathGlobs,
          files: targetFilesFromPaths.length,
        },
        joined: {
          mode: joinMode,
          files: targetFilesScoped.length,
        },
        dropped: targetFilesDropped.length,
        logDirRelative: input.logDirRelative,
      }),
    });
    throw new ReviewRefusalEmittedError(
      'combined scope resolves to zero files',
    );
  }

  // enumerate ref files (if specified)
  const refGlobs = asGlobList({ of: review.refs });
  const refFiles =
    refGlobs.length > 0
      ? await enumFilesForReviewSupplies({ glob: refGlobs, cwd })
      : [];

  // validate refs exist (fail-fast on zero matches when refs was specified)
  if (refGlobs.length > 0 && refFiles.length === 0) {
    emitReviewRefusal({
      kind: 'constraint',
      headline: asRefsAbsentHeadline({ refGlobs }),
      lines: asDidYouKnowLines({
        rows: ['verify the path exists and contains matched files'],
      }),
    });
    // the frame above names the ref; the thrown type tells the cli the frame is already out
    throw new ReviewRefusalEmittedError('--refs glob was ineffective');
  }

  // enumerate conversation files (opt-in; the peer-review dialogue)
  // .why = --conversation threads the prior .given + .taken exchange as reference
  //        context so a reviewer sees its own critique and the driver's response.
  //        unlike --refs, zero matches is NOT an error — the first iteration has
  //        no prior conversation, which is expected
  const conversationGlobs = asGlobList({ of: review.conversation });
  const conversationFiles =
    conversationGlobs.length > 0
      ? await enumFilesForReviewSupplies({ glob: conversationGlobs, cwd })
      : [];

  // write the scope (refFiles and conversationFiles are now known)
  await setScopeArtifact({
    logDir: input.logDir,
    scope: {
      ruleFiles: input.ruleFiles,
      refFiles,
      conversationFiles,
      targetFiles,
    },
  });

  return {
    args: argsOfRun,
    resolution,
    paths: { with: positivePathGlobs, wout: negativePathGlobs },
    join: joinMode,
    targets: {
      fromDiffs: targetFilesFromDiffs,
      fromPaths: targetFilesFromPaths,
      files: targetFiles,
    },
    fileDiffByPath,
    refFiles,
    conversationFiles,
  };
};
