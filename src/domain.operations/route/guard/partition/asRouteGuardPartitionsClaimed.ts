// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import { asReviewPartitionDeclarationParts } from '@src/domain.operations/review/partition/asReviewPartitionDeclarationParts';
import { asReviewPartitionFlagsMerged } from '@src/domain.operations/review/partition/asReviewPartitionFlagsMerged';

/**
 * .what = a held partition set with each claimed glob folded into the partition it names —
 *         the whole set, ready to write back — or the slugs the set does not hold
 * .why = 🔴 to claim one new file once cost a re-declaration of every partition (seed S51). a
 *        claim adds one glob to one held partition, and the result is still the WHOLE set, so
 *        coverage is checked against the full set and the stored declaration still names it
 *        whole (seeds S46, S53)
 *
 * .note = a claim never creates a partition: an unknown slug returns no set, so the caller
 *         refuses and names the slugs the scope holds. a new domain is a declaration
 * .note = idempotent: a glob the partition already holds is kept once
 * .note = a claim's glob text may be a comma list; the merge splits it as the parser does
 */
export const asRouteGuardPartitionsClaimed = (input: {
  /** the set the scope holds, as declared */
  partition: string[];
  claims: Array<{ glob: string; into: string }>;
}): { partition: string[] | null; unknownInto: string[] } => {
  // every claim must name a held slug
  const slugsHeld = new Set(
    input.partition.map(
      (value) => asReviewPartitionDeclarationParts({ value }).slug,
    ),
  );
  const unknownInto = [
    ...new Set(
      input.claims
        .map((claim) => claim.into)
        .filter((slug) => !slugsHeld.has(slug)),
    ),
  ];
  if (unknownInto.length > 0) return { partition: null, unknownInto };

  // fold each claim into its slug, one value per slug
  return {
    partition: asReviewPartitionFlagsMerged({
      partition: [
        ...input.partition,
        ...input.claims.map((claim) => `${claim.into}=${claim.glob}`),
      ],
    }),
    unknownInto: [],
  };
};
