import { ConstraintError } from 'helpful-errors';
import * as path from 'path';

/**
 * .what = reads the artifact hash out of a peer-review file path
 * .why = an exhausted reviewer's latest artifact states the hash it was reviewed under,
 *        and the hash lives only in the filename grammar
 *
 * ⚠️ .note = this is a FIELD read, never a key to pair a .given with its .taken.
 *    `getRouteGuardReviewPeerPathMeta` refuses to return the hash for that reason: one
 *    reviewer's successive givens share a hash, so a pair keyed on (slug, hash) would hand a
 *    fresh critique the prior answer. pair by the derived path (getRouteGuardReviewPeerPathTaken)
 *
 * grammar: $stone._.review.i$iter.$hash.r$index._.given.by_peer.$slug.md
 */
export const asRouteGuardReviewPeerPathHash = (input: {
  path: string;
}): string => {
  const hashMatch = path
    .basename(input.path)
    .match(/\.i\d+\.([a-f0-9]+)\.r\d+\./);

  // the enumerator's glob admitted this file, so a hash-less name is a stray, never ours.
  // a human put the stray there, so a human removes it: a constraint the route cli
  // renders as a refusal, never a raw stack
  if (!hashMatch?.[1])
    return ConstraintError.throw(
      'review file lacks hash in filename. ' +
        'expected format: $stone._.review.i$iter.$hash.r$n._.given.by_peer.$slug.md. ' +
        'fix: delete the malformed file and re-run the guard',
      { path: input.path },
    );

  return hashMatch[1];
};
