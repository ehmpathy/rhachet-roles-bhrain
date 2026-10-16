import type { ReviewRunMetricsExpected } from '@src/domain.objects/Reviewer/ReviewRunMetricsExpected';
import type { ReviewRunMetricsRealizedOfResult } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealizedOfResult';

/**
 * .what = result of stepReview execution
 * .why = enables caller to inspect review outcome and artifacts
 * .note = declared in its own file, so the review orchestrator and every leaf that returns
 *         a result import one shape, and no leaf imports its orchestrator back
 */
export type StepReviewResult = {
  /**
   * .what = which path produced this result: a real graded review, or an `--optional` skip
   * .why = the skip path zeroes the metrics and points `log.dir` at the output file's parent
   *        (no debug artifacts live there), so a direct SDK consumer needs a typed discriminant
   *        to tell the two apart — without it they'd string-match `🌙 skipped` or infer from
   *        `metrics.files.rulesCount === 0` (rule.forbid.inline-decode-friction).
   */
  outcome: 'reviewed' | 'skipped' | 'primed' | 'planned';
  review: {
    formatted: string;
  };
  log: {
    dir: string;
  };
  output: {
    path: string;
  };
  /**
   * the verdict's two counts, as the review file and stdout state them
   * .why = a split review merges its partitions by a sum of these (F92), so they are a
   *        typed field rather than a number a caller regexes back out of `formatted`
   */
  summary: {
    blockersCount: number;
    nitpicksCount: number;
  };
  metrics: {
    /**
     * 🔴 bound to the ARTIFACT's declaration, never re-typed here.
     *
     * the in-memory shape nests where the artifact is flat — `files` sits
     * beside `expected` here, and inside it on disk — so the two genuinely
     * differ in SHAPE. what must never differ is the FIELD NAMES, which is
     * exactly what a rename breaks silently, so both sides read one type
     * (`ReviewRunMetricsExpected`, and its realized peer).
     */
    files: ReviewRunMetricsExpected['files'];
    expected: Omit<ReviewRunMetricsExpected, 'files'>;
    /**
     * the same figures `metrics.realized.json` carries, minus the peer-artifact
     * pointer — an in-memory caller already holds the composition it points at
     *
     * .note = 🔴 `cost` and `tokens.output` are null where the spend is unmeasured
     *         (`ReviewRunMetricsRealizedOfResult`)
     */
    realized: ReviewRunMetricsRealizedOfResult;
  };
};
