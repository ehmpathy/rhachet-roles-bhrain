import type { IsoDuration } from 'iso-time';

import type { ContextReviewBrainSupply } from '../brain/genReviewBrainSupply'; // brain/ is a declared shared subdomain (its .readme.md)
// a sanctioned exposure, declared in src/domain.operations/review/.readme.md
import { runOneReview } from '../review/runOneReview';
import { asReviewRubricOutputPath } from './asReviewRubricOutputPath';
import type { ReviewRubric } from './asReviewRubricsConfig';
import { asReviewVerdict } from './asReviewVerdict';
import { genReviewRubricCmd } from './genReviewRubricCmd';
import { getOneReviewRunSettled } from './getOneReviewRunSettled';
import type {
  ReviewRubricProgress,
  ReviewRubricResult,
} from './ReviewByResult';

/**
 * .what = runs one rubric's review and returns its result, with a progress event either side
 * .why = the per-item act of the review.by pour, named so `stepReviewBy` reads as one claim
 *        per rubric rather than a callback a reader must simulate (r006 nitpick.1, i013) — the
 *        same shape the guard's pours take (`getOneReviewPeerMeterLaneOfReviewer`, …)
 */
export const getOneReviewRubricResult = async (
  input: {
    rubric: ReviewRubric;
    index: number;
    total: number;
    outputDir: string;
    timeout: IsoDuration;
    cwd: string;
    paths: string | null;
    diffs: string | null;
    mode: string | null;
    brain: string | null;
  },
  context: ContextReviewBrainSupply & {
    onRubricProgress?: (event: ReviewRubricProgress) => void;
    onStdoutChunk?: (chunk: string) => void;
  },
): Promise<ReviewRubricResult> => {
  // announce the rubric before its (slow) review begins
  context.onRubricProgress?.({
    phase: 'start',
    index: input.index + 1,
    total: input.total,
    slug: input.rubric.slug,
  });

  // run the rubric's own `rhx review`, settled into a run record
  const outputPath = asReviewRubricOutputPath({
    outputDir: input.outputDir,
    slug: input.rubric.slug,
  });
  const cmd = genReviewRubricCmd({
    rubric: input.rubric,
    output: outputPath,
    paths: input.paths,
    diffs: input.diffs,
    mode: input.mode,
    brain: input.brain,
  });
  const run = await getOneReviewRunSettled({
    operation: () =>
      runOneReview(
        // a `review.by` rubric names no guard lane, so it has no pour peers to meet:
        // each rubric's prompt prefix is its own rubric (genReviewRubricCmd)
        { cmd, timeout: input.timeout, cwd: input.cwd, meet: 'skip' },
        context,
      ),
  });
  const verdict = asReviewVerdict({ run });

  // report the verdict the moment the rubric finishes, with all the cli needs to render the
  // completed peer-style row (verdict + duration + the given: path)
  context.onRubricProgress?.({
    phase: 'done',
    index: input.index + 1,
    total: input.total,
    slug: input.rubric.slug,
    verdict,
    durationMs: run.durationMs,
    outputPath,
  });

  return {
    slug: input.rubric.slug,
    purpose: input.rubric.purpose,
    verdict,
    outputPath,
    durationMs: run.durationMs,
    // keep the base review's raw stdout so the cli can disintermediate a single-scope
    // (`--for`) run — print this verbatim rather than the review.by tree
    stdout: run.stdout,
    // keep its stderr too: a malfunctioned rubric's stdout is often empty, so this is the
    // only carrier of WHY it faulted (rule.forbid.failhide)
    stderr: run.stderr,
  };
};
