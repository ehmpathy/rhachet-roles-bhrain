import type { ReviewByResult } from './ReviewByResult';

/**
 * .what = the stderr lines that name each malfunctioned rubric, its reason, and the
 *         child's own stderr
 * .why = a malfunctioned rubric often wrote no verdict, so these lines are the only
 *        place its cause reaches the caller. a pure render, so a case can pin it
 *        apart from the exit code it precedes
 */
export const asReviewByMalfunctionLines = (input: {
  result: ReviewByResult;
}): string[] =>
  input.result.results
    .filter((rubric) => rubric.verdict.outcome === 'malfunctioned')
    .flatMap((rubric) => [
      `💥 MalfunctionError: rubric malfunctioned: ${rubric.slug}`,
      // the reason hangs off the header as a leaf, so the header reads as its root
      ...(rubric.verdict.reason ? [`   └─ ${rubric.verdict.reason}`] : []),
      ...(rubric.stderr.trim() !== '' ? [rubric.stderr.trim()] : []),
    ]);
