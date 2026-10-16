import { getRouteGuardReviewPeerPathMeta } from './getRouteGuardReviewPeerPathMeta';
import { isLaterByIterationThenPath } from './isLaterByIterationThenPath';

/**
 * .what = picks one reviewer's latest peer-review path, by iteration, from a file list
 * .why = the cross-hash fallback reaches back past the current guard config, so the slug
 *        (never the index) selects the reviewer, and the highest iteration wins
 *
 * .note = the max is over a TOTAL order (iteration, then path), so a tie on iteration
 *         resolves the same on every machine, whatever order the glob returned
 *
 * .note = pure; the grammar read goes through the one parser that owns it, which throws an
 *         error that names the fix on a filename it cannot read
 */
export const getOneLatestPeerReviewPathForSlug = (input: {
  paths: string[];
  slug: string;
}): { path: string; iteration: number } | null =>
  input.paths
    .map((filePath) => ({
      path: filePath,
      meta: getRouteGuardReviewPeerPathMeta({ path: filePath }),
    }))
    .filter((candidate) => candidate.meta.slug === input.slug)
    .map((candidate) => ({
      path: candidate.path,
      iteration: candidate.meta.iteration,
    }))
    .reduce<{ path: string; iteration: number } | null>(
      (latest, candidate) =>
        isLaterByIterationThenPath({ candidate, incumbent: latest })
          ? candidate
          : latest,
      null,
    );
