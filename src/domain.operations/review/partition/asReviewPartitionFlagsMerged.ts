import { asReviewPartitionDeclarationParts } from './asReviewPartitionDeclarationParts';
import { asReviewPartitionsFromFlags } from './asReviewPartitionsFromFlags';

/**
 * .what = a set of `--partition` values with one value per slug — a slug declared over
 *         several flags merged into one, every other value kept verbatim
 * .why = a driver may widen a partition by one more flag of its slug, and the parser merges
 *        them; the stored set holds one value per slug, so a later show, refusal, and count
 *        read one partition as one row, and the file never holds a slug twice
 *
 * .note = a slug declared once keeps its bytes exactly, so an extant declaration written
 *         back is never reworded
 * .note = a merged slug is written as one bare comma list — the parser splits only at depth 0,
 *         so any glob round-trips, a glob that holds a brace of its own included, and no brace
 *         set is printed for a shell to expand (seed S53)
 */
export const asReviewPartitionFlagsMerged = (input: {
  partition: string[];
}): string[] => {
  // the slug of each value, to tell a lone slug from a repeated one
  const slugs = input.partition.map(
    (value) => asReviewPartitionDeclarationParts({ value }).slug,
  );
  const isRepeated = (slug: string): boolean =>
    slugs.indexOf(slug) !== slugs.lastIndexOf(slug);

  // each slug once, in first-declared order; a repeated one as its merged globs
  return asReviewPartitionsFromFlags({ partition: input.partition }).map(
    (partition) =>
      isRepeated(partition.slug)
        ? `${partition.slug}=${partition.globs.join(',')}`
        : input.partition[slugs.indexOf(partition.slug)]!,
  );
};
