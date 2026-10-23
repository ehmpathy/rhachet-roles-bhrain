import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the tree branch that names what one `route.guard.partition` write changed — the
 *         globs a claim added, the globs a prune dropped, or the whole set it replaced
 * .why = a claim or prune writes the whole set back, but what the driver asked for is the
 *        edit — so the tree names each glob it touched, and says the rest was kept as held
 */
export const asRouteGuardPartitionChangeLines = (input: {
  claimed: Array<{ glob: string; into: string }> | null;
  pruned: Array<{ glob: string; from: string | null }> | null;
  /** the partitions the scope held before; null where it held none */
  replaced: string[] | null;
}): string[] => {
  // a claim names each glob and the partition it joined
  const claimed = input.claimed;
  if (claimed !== null)
    return [
      `   ├─ claims: ${asCountedNoun({ count: claimed.length, one: 'glob', many: 'globs' })}, every other partition kept as held`,
      ...claimed.map(
        (claim, index) =>
          `   │  ${index === claimed.length - 1 ? '└─' : '├─'} ${claim.glob} → ${claim.into}`,
      ),
    ];

  // a prune names each glob and the partition it left, or every one that held it
  const pruned = input.pruned;
  if (pruned !== null)
    return [
      `   ├─ prunes: ${asCountedNoun({ count: pruned.length, one: 'glob', many: 'globs' })}, every other partition kept as held`,
      ...pruned.map(
        (prune, index) =>
          `   │  ${index === pruned.length - 1 ? '└─' : '├─'} ${prune.glob} ← ${prune.from ?? 'wherever held'}`,
      ),
    ];

  // a declaration replaced the whole set, or stood where none was
  if (input.replaced === null) return ['   ├─ replaces: none'];
  return [
    `   ├─ replaces: ${asCountedNoun({ count: input.replaced.length, one: 'partition', many: 'partitions' })}, whole`,
  ];
};
