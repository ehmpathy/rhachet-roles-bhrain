import { enumRouteFiles } from './enumRouteFiles';

/**
 * .what = enumerates peer review guard files by semantic criteria
 * .why = centralizes glob pattern construction for peer reviews
 *
 * filename pattern: .reviews/peer/$stone._.review.i$iter.$hash.r$idx._.given.by_peer.$slug.md
 */
export const enumRouteGuardReviewPeerFiles = async (input: {
  route: string;
  stone: string;
  iteration?: number;
  hash?: string;
  index?: number;
}): Promise<string[]> => {
  // construct glob from semantic inputs
  // pattern: .reviews/peer/$stone._.review.i$iter.$hash.r$idx._.given.by_peer.$slug.md
  let glob = `.reviews/peer/${input.stone}._.review.`;
  glob += input.iteration !== undefined ? `i${input.iteration}.` : 'i*.';
  glob += input.hash ? `${input.hash}.` : '*.';
  glob += input.index !== undefined ? `r${input.index}.` : 'r*.';
  glob += '_.given.by_peer.*.md';

  return enumRouteFiles({ route: input.route, glob });
};
