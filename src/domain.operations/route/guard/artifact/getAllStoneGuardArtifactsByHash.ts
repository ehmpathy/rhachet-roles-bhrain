import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import { isPresent } from 'type-fns';

import type { ExitCodeClass } from '@src/domain.objects/Driver/ExitCodeClass';
import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuardJudgeArtifact } from '@src/domain.objects/Driver/RouteStoneGuardJudgeArtifact';
import { RouteStoneGuardReviewArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewArtifact';
import { getAllResultsInBoundedPool } from '@src/utils/getAllResultsInBoundedPool';

import { asGuardJudgeVerdictMarks } from '../../judges/asGuardJudgeVerdictMarks';
import { getOneJudgeArtifactContent } from '../../judges/getOneJudgeArtifactContent';
import { asExitCodeClass } from '../asExitCodeClass';
import { asExitCodeFromArtifactContent } from '../asExitCodeFromArtifactContent';
import { enumRouteGuardJudgeFiles } from '../judge/enumRouteGuardJudgeFiles';
import { asPeerReviewVerdictFromContent } from '../review/peer/asPeerReviewVerdictFromContent';
import { asReviewIndexFromPath } from '../review/peer/asReviewIndexFromPath';
import { enumRouteGuardReviewPeerFiles } from '../review/peer/enumRouteGuardReviewPeerFiles';
import { getOneReviewArtifactContent } from '../review/peer/getOneReviewArtifactContent';
import { asArtifactStreamsFromContent } from '../tree/asArtifactStreamsFromContent';
import { asGuardArtifactIteration } from './asGuardArtifactIteration';
import { asGuardJudgeIndex } from './asGuardJudgeIndex';

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

  // read each review file into an artifact, bounded, in enumeration order
  const reviews = (
    await getAllResultsInBoundedPool({
      items: reviewFiles,
      bound: BOUND_OF_CONCURRENT_ARTIFACT_READS,
      map: (filePath) =>
        getOneReviewArtifactFromFile({
          path: filePath,
          stone: input.stone,
          hash: input.hash,
        }),
    })
  ).filter(isPresent);

  // read each judge file into an artifact, bounded, in enumeration order
  const judges = (
    await getAllResultsInBoundedPool({
      items: judgeFiles,
      bound: BOUND_OF_CONCURRENT_ARTIFACT_READS,
      map: (filePath) =>
        getOneJudgeArtifactFromFile({
          path: filePath,
          stone: input.stone,
          hash: input.hash,
        }),
    })
  ).filter(isPresent);

  return { reviews, judges };
};

/**
 * .what = how many artifact file reads may be in flight at one time
 * .why = a stone's artifacts grow with every iteration, so an unbounded fan-out opens one
 *        descriptor per file. the bound holds the open reads at a fixed count, as
 *        `getAllPeerGivenVerdictsFromFiles` does for its reads
 */
const BOUND_OF_CONCURRENT_ARTIFACT_READS = 8;

/**
 * .what = one review file, read into its artifact — or null if it vanished since enumeration
 * .why = names the per-file act, so the gather reads as a bounded pour of named reads
 *        (rule.forbid.decode-friction-in-orchestrators); the read goes through the shared
 *        communicator, which owns the race-delete clamp
 */
const getOneReviewArtifactFromFile = async (input: {
  path: string;
  stone: RouteStone;
  hash: string;
}): Promise<RouteStoneGuardReviewArtifact | null> => {
  // a file deleted since enumeration (a rewind, a clean) is a miss, never a fault
  const content = await getOneReviewArtifactContent({ path: input.path });
  if (content === null) return null;

  const parsed = parseReviewMetadata({ path: input.path, content });
  return new RouteStoneGuardReviewArtifact({
    stone: { path: input.stone.path },
    hash: input.hash,
    iteration: parsed.iteration,
    index: parsed.index,
    path: input.path,
    blockers: parsed.blockers,
    nitpicks: parsed.nitpicks,
    tallier: parsed.tallier,
    talliedBy: parsed.talliedBy,
    exitCode: parsed.exitCode,
    exitClass: parsed.exitClass,
    stdout: parsed.stdout,
    stderr: parsed.stderr,
    durationMs: parsed.durationMs,
  });
};

/**
 * .what = one judge file, read into its artifact — or null if it vanished since enumeration
 * .why = the twin of `getOneReviewArtifactFromFile`, for judge artifacts
 */
const getOneJudgeArtifactFromFile = async (input: {
  path: string;
  stone: RouteStone;
  hash: string;
}): Promise<RouteStoneGuardJudgeArtifact | null> => {
  // a file deleted since enumeration (a rewind, a clean) is a miss, never a fault
  const content = await getOneJudgeArtifactContent({ path: input.path });
  if (content === null) return null;

  const parsed = parseJudgeMetadata({ path: input.path, content });
  return new RouteStoneGuardJudgeArtifact({
    stone: { path: input.stone.path },
    hash: input.hash,
    iteration: parsed.iteration,
    index: parsed.index,
    path: input.path,
    passed: parsed.passed,
    reason: parsed.reason,
    exitCode: parsed.exitCode,
    exitClass: parsed.exitClass,
    stdout: parsed.stdout,
    stderr: parsed.stderr,
  });
};

/**
 * .what = parses review file metadata from filename and content
 * .why = extracts iteration, index, blockers, nitpicks, exit info from review artifact
 */
const parseReviewMetadata = (input: {
  path: string;
  content: string;
}): {
  iteration: number;
  index: number;
  blockers: number;
  nitpicks: number;
  tallier: 'deterministic' | 'probabilistic' | null;
  talliedBy: string | null;
  exitCode: number;
  exitClass: ExitCodeClass;
  stdout: string;
  stderr: string;
  durationMs: number | null;
} => {
  // filename format: $stone._.review.i$iter.$hash.r$n._.given.by_peer.$slug.md
  // the grammar is read by its named readers, so it has one home
  // (rule.require.single-source-of-truth-for-render)
  const filename = path.basename(input.path);
  const iteration = asGuardArtifactIteration({ filename });

  // iteration is required - file matched our glob, must have iteration marker
  if (iteration === null)
    UnexpectedCodePathError.throw(
      'review file lacks iteration marker in filename. ' +
        'expected format: $stone._.review.i$iter.$hash.r$n._.given.by_peer.$slug.md. ' +
        'fix: delete the malformed file and re-run the guard',
      { filename, filePath: input.path },
    );

  // index is required - file matched our glob, must have reviewer index.
  // .note = the index is 1-based, so the reader's 0 fallback is exactly "no marker"
  const index = asReviewIndexFromPath({ path: input.path });
  if (index === 0)
    UnexpectedCodePathError.throw(
      'review file lacks reviewer index in filename. ' +
        'expected format: $stone._.review.i$iter.$hash.r$n._.given.by_peer.$slug.md. ' +
        'fix: delete the malformed file and re-run the guard',
      { filename, filePath: input.path },
    );

  // the verdict fields, read by the one transformer the cross-hash fallback reads too.
  // an unreadable tally gates as one blocker here as there, never a clean 0/0
  const verdict = asPeerReviewVerdictFromContent({ content: input.content });

  // extract stdout/stderr from tree buckets
  const { stdout, stderr } = asArtifactStreamsFromContent({
    content: input.content,
  });

  return {
    iteration,
    index,
    ...verdict,
    stdout,
    stderr,
  };
};

/**
 * .what = parses judge file metadata from filename and content
 * .why = extracts iteration, index, passed, reason, exit info from judge artifact
 */
const parseJudgeMetadata = (input: {
  path: string;
  content: string;
}): {
  iteration: number;
  index: number;
  passed: boolean;
  reason: string | null;
  exitCode: number;
  exitClass: ExitCodeClass;
  stdout: string;
  stderr: string;
} => {
  // filename format: $stone.guard.judge.i$rp$j.$reviewHash.$judgeHash.j$index.md
  // the grammar is read by its named readers, so it has one home
  // (rule.require.single-source-of-truth-for-render)
  const filename = path.basename(input.path);
  const iteration = asGuardArtifactIteration({ filename });
  const index = asGuardJudgeIndex({ filename });

  // iteration is required - file matched our glob, must have iteration marker
  if (iteration === null)
    UnexpectedCodePathError.throw(
      'judge file lacks iteration marker in filename. ' +
        'expected format: $stone.guard.judge.i$rp$j.$hash.j$index.md. ' +
        'fix: delete the malformed file and re-run the guard',
      { filename, filePath: input.path },
    );

  // index is required - file matched our glob, must have judge index
  if (index === null)
    UnexpectedCodePathError.throw(
      'judge file lacks judge index in filename. ' +
        'expected format: $stone.guard.judge.i$rp$j.$hash.j$index.md. ' +
        'fix: delete the malformed file and re-run the guard',
      { filename, filePath: input.path },
    );

  // parse passed and reason from content, via the one shared reader of the judge grammar;
  // an absent `passed:` mark reads as failed, never as a pass
  const content = input.content;
  const marks = asGuardJudgeVerdictMarks({ content });
  const passed = marks.passed ?? false;
  const reason = marks.reason;

  // parse exit code from tree bucket format
  const exitCode = asExitCodeFromArtifactContent({ content });
  const exitClass = asExitCodeClass({ code: exitCode });

  // extract stdout/stderr from tree buckets
  const { stdout, stderr } = asArtifactStreamsFromContent({ content });

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
