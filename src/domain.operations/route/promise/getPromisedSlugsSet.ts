import type { RouteStoneGuardReviewSelfArtifact } from '@src/domain.objects/Driver/RouteStoneGuardReviewSelfArtifact';

/**
 * .what = extracts slugs from promises as a Set for efficient lookup
 * .why = provides named operation for slug set creation from promises
 */
export const getPromisedSlugsSet = (input: {
  promises: RouteStoneGuardReviewSelfArtifact[];
}): Set<string> => {
  return new Set(input.promises.map((p) => p.slug));
};
