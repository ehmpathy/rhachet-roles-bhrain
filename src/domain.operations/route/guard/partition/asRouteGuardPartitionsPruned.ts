// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import { asReviewPartitionDeclarationParts } from '@src/domain.operations/review/partition/asReviewPartitionDeclarationParts';
import { asReviewPartitionGlobsOfText } from '@src/domain.operations/review/partition/asReviewPartitionGlobsOfText';
import { asReviewPartitionsFromFlags } from '@src/domain.operations/review/partition/asReviewPartitionsFromFlags';

/**
 * .what = a held partition set with each pruned glob dropped from the partitions that hold
 *         it — the whole set, ready to write back — or the globs no partition holds
 * .why = 🔴 a glob goes stale when its file moves or is removed, and the only cure once was a
 *        re-declaration of every partition. a prune is the mirror of a claim: it drops one
 *        glob from the held set, and the result is still the WHOLE set, so coverage is checked
 *        against the full set before any write
 *
 * .note = with no `from`, the glob drops from every partition that lists it; with a `from`,
 *         from that one alone — for a shared-context glob several partitions hold on purpose
 * .note = a glob no partition holds returns no set, so the caller refuses and names it, rather
 *         than report a drop that dropped naught
 * .note = a partition left with no glob drops from the set, since an empty partition claims
 *         naught and would only read as a defect
 * .note = a partition the prune never touched keeps its stored bytes exactly
 */
export const asRouteGuardPartitionsPruned = (input: {
  /** the set the scope holds, as declared */
  partition: string[];
  prunes: Array<{ glob: string; from: string | null }>;
}): { partition: string[] | null; unheld: string[] } => {
  // each prune as one glob apiece, since its text may be a comma list
  const drops = input.prunes.flatMap((prune) =>
    asReviewPartitionGlobsOfText({ text: prune.glob }).map((glob) => ({
      glob,
      from: prune.from,
    })),
  );

  // the held set, one entry per slug, with its globs and its stored value
  const slugsStored = input.partition.map(
    (value) => asReviewPartitionDeclarationParts({ value }).slug,
  );
  const held = asReviewPartitionsFromFlags({ partition: input.partition }).map(
    (one) => ({
      slug: one.slug,
      globs: one.globs,
      stored: input.partition[slugsStored.indexOf(one.slug)]!,
    }),
  );

  // every drop must find a partition that holds it
  const isDropOf = (input: {
    drop: { glob: string; from: string | null };
    slug: string;
  }): boolean => input.drop.from === null || input.drop.from === input.slug;
  const unheld = drops
    .filter(
      (drop) =>
        !held.some(
          (one) =>
            isDropOf({ drop, slug: one.slug }) && one.globs.includes(drop.glob),
        ),
    )
    .map((drop) =>
      drop.from === null ? drop.glob : `${drop.glob} (from ${drop.from})`,
    );
  if (unheld.length > 0) return { partition: null, unheld };

  // drop each glob from the partitions it targets; keep untouched values verbatim
  const partition = held.flatMap((one) => {
    const globsKept = one.globs.filter(
      (glob) =>
        !drops.some(
          (drop) => drop.glob === glob && isDropOf({ drop, slug: one.slug }),
        ),
    );
    if (globsKept.length === one.globs.length) return [one.stored];
    if (globsKept.length === 0) return [];
    return [`${one.slug}=${globsKept.join(',')}`];
  });
  return { partition, unheld: [] };
};
