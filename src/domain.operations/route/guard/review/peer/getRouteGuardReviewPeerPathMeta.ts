import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';

/**
 * .what = parses the {slug, hash} pair out of a peer-review file path
 * .why = the contemplation gate pairs a .given to its .taken by (slug, hash);
 *        both facts live only in the filename grammar, so one parser reads them
 *
 * grammar (given OR taken):
 *   $stone._.review.i$iter.$hash.r$index._.given.by_peer.$slug.md
 *   $stone._.review.i$iter.$hash.r$index._.taken.by_self.$slug.md
 */
export const getRouteGuardReviewPeerPathMeta = (input: {
  path: string;
}): { slug: string; hash: string } => {
  const name = path.basename(input.path);

  // hash = the dot-free segment between the iteration and the index
  const hashMatch = name.match(/\.i\d+\.([^.]+)\.r\d+\./);

  // slug = the text after the given|taken infix, up to the .md suffix
  const slugMatch = name.match(
    /_\.(?:given\.by_peer|taken\.by_self)\.(.+)\.md$/,
  );

  if (!hashMatch?.[1] || !slugMatch?.[1])
    UnexpectedCodePathError.throw(
      'could not parse peer-review path meta — not a valid given/taken filename',
      { path: input.path },
    );

  return { hash: hashMatch[1], slug: slugMatch[1] };
};
