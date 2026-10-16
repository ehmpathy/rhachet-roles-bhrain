import * as path from 'path';

/**
 * .what = the reviewer's 1-based index (`.rN.`) read out of a review file path
 * .why = the index segment of the review-filename grammar is read by several filters;
 *        one named reader keeps each of them a narrative predicate rather than an
 *        inline regex + parse (rule.forbid.inline-decode-friction)
 *
 * .note = a filename with no `.rN.` marker reads as 0, the fallback every caller held
 *         inline before this reader was lifted
 *
 * .note = a pure string parse, never a read of the disk: it takes a path STRING and parses
 *         its basename. it opens no file, so a path that names no file on disk parses the
 *         same as one that does. that is why its prefix is `as*` (a cast of one shape to
 *         another), where the peer readers that DO reach the disk carry `get*`
 *
 * grammar: $stone._.review.i$iter.$hash.r$index._.given.by_peer.$slug.md
 */
export const asReviewIndexFromPath = (input: { path: string }): number => {
  const indexMatch = path.basename(input.path).match(/\.r(\d+)\./);
  return indexMatch?.[1] ? parseInt(indexMatch[1], 10) : 0;
};
