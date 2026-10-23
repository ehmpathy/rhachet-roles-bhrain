// a sanctioned exposure, declared in src/domain.operations/review/partition/.readme.md
import { asReviewPartitionsFromFlags } from '@src/domain.operations/review/partition/asReviewPartitionsFromFlags';

/**
 * .what = the refusal a prune of a glob no targeted partition holds earns — each held
 *         partition with its globs, so the exact text to prune can be copied
 * .why = 🔴 a prune that drops naught must not report success: a typo, or a glob that sits
 *        in another partition than `--from` names, would read as a cure while the stale glob
 *        stays. so it refuses, names the unheld globs, and lists what IS held
 *        (rule.require.errors-name-the-fix)
 */
export const asRouteGuardPartitionPruneRefusal = (input: {
  /** the prunes no targeted partition holds, as rendered for the human */
  unheld: string[];
  /** the set the scope holds */
  held: string[];
  /** whether any prune named a partition via --from, so the fix can offer to drop it */
  isFromNamed: boolean;
}): { headline: string; lines: string[] } => {
  // each held partition with its globs, in declared order
  const partitions = asReviewPartitionsFromFlags({ partition: input.held });
  const linesHeld = partitions.flatMap((one, index) => {
    const isLast = index === partitions.length - 1;
    const stem = isLast ? '   ' : '│  ';
    return [
      `   │  ${isLast ? '└─' : '├─'} ${one.slug}`,
      ...one.globs.map(
        (glob, globIndex) =>
          `   │  ${stem}${globIndex === one.globs.length - 1 ? '└─' : '├─'} ${glob}`,
      ),
    ];
  });
  return {
    headline: `--prune ${input.unheld.join(', ')}: no targeted partition holds that glob, so naught would drop`,
    lines: [
      '   ├─ held partitions',
      ...linesHeld,
      input.isFromNamed
        ? '   └─ fix: prune a glob exactly as held above — or drop --from to prune it wherever it sits'
        : '   └─ fix: prune a glob exactly as held above',
    ],
  };
};
