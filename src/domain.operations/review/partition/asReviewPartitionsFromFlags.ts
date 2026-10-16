import { BadRequestError } from 'helpful-errors';

import { asMemberOfGlob } from './asMemberOfGlob';
import { asReviewPartitionDeclarationParts } from './asReviewPartitionDeclarationParts';
import { asReviewPartitionGlobsOfText } from './asReviewPartitionGlobsOfText';
import { getOneReviewPartitionsFault } from './getOneReviewPartitionsFault';

/**
 * .what = one member of a partition's declaration — a prefix or a glob
 * .why = a bare `src/review` reads as a subtree, and `src/**\/*.md` as a glob used as-is;
 *        both are what a caller naturally types, so both are accepted
 */
export interface ReviewPartitionMember {
  kind: 'prefix' | 'glob';
  value: string;
  /** declared with a `!` at its head — it subtracts what it matches, and claims naught */
  exclude: boolean;
}

/**
 * .what = one declared partition of a review's targets — a slug and the members that claim
 *         a target for it
 * .why = a partition is a set of files a reviewer can judge on its own, declared by the
 *        caller, never guessed (seed S44). sets may and should overlap; the overlap is
 *        computed (`getAllTargetsByPartition`), never declared
 */
export interface ReviewPartitionDeclared {
  /** the slug the partition is named by — in its log dir, its report section, its refusal */
  slug: string;
  /** the globs as declared, verbatim — what the plan render shows under `globs` */
  globs: string[];
  /** the same globs, cast to the matchers a target is tested against */
  members: ReviewPartitionMember[];
}

/**
 * .what = the slug and globs of each declaration, with every value that shares a slug merged
 *         into the first, in first-declared order
 * .why = one partition may be written as several flags — `--partition 'route=src/route/**'
 *        --partition 'route=blackbox/driver.route.*'` — so a driver widens a partition by one
 *        more line, never by a re-typed brace list. the merged slug sits where it was first
 *        declared, since order decides which partition grades a common file (seed S44)
 *
 * .note = a glob named twice in one slug is kept once, so a merge never doubles a member
 */
const asSlugGlobsMerged = (input: {
  partition: string[];
}): Array<{ slug: string; globs: string[] }> => {
  const parsed = input.partition.map((value) => {
    const parts = asReviewPartitionDeclarationParts({ value });
    return {
      slug: parts.slug,
      globs: asReviewPartitionGlobsOfText({ text: parts.globsText }),
    };
  });
  const slugs = [...new Set(parsed.map((one) => one.slug))];
  return slugs.map((slug) => ({
    slug,
    globs: [
      ...new Set(
        parsed.filter((one) => one.slug === slug).flatMap((one) => one.globs),
      ),
    ],
  }));
};

/**
 * .what = casts the `--partition '<slug>=<globs>'` values into the declared partitions
 * .why = the declared ORDER is kept, since it decides which partition grades a common file:
 *        the first that lists it (seed S44)
 *
 * .note = the globs may be a bare comma list, a brace list, or several flags of one slug;
 *         all three read the same (`asReviewPartitionGlobsOfText`, `asSlugGlobsMerged`)
 * .note = 🔴 a malformed value refuses, loud, with the corrected declaration
 *         (`getOneReviewPartitionsFault`) — the cli checks first, and this re-checks, so a
 *         caller that skips the cli cannot reach a split it cannot read
 */
export const asReviewPartitionsFromFlags = (input: {
  partition: string[];
}): ReviewPartitionDeclared[] => {
  // refuse a declaration that does not parse
  const fault = getOneReviewPartitionsFault({ partition: input.partition });
  if (fault) throw new BadRequestError(fault.headline, { hint: fault.hint });

  // cast each slug into its globs verbatim and their matchers
  return asSlugGlobsMerged({ partition: input.partition }).map(
    (one): ReviewPartitionDeclared => ({
      slug: one.slug,
      globs: one.globs,
      members: one.globs.map((glob) => asMemberOfGlob({ glob })),
    }),
  );
};
