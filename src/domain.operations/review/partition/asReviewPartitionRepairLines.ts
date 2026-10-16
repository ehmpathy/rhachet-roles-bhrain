import { asDidYouKnowLines } from '@src/domain.operations/asDidYouKnowLines';

/**
 * .what = the one tip every partition repair closes on, as the rows of its hint block
 * .why = a repair claims the files that are unclaimed TODAY. a driver who claims only those
 *        meets the same halt on the next file they touch; a claim of each domain whole, in
 *        every layer it spans, covers the files they edit next too
 *        (rule.require.vertical-partitions). one constant, so every repair surface says it
 *        the same way
 *
 * .note = the move first, then the example a driver can shape their own globs from, last
 *         (rule.require.coconut-hints)
 *
 * 🔴 the example names globs, never a `--partition '<value>'` flag: `asPeerGivenConstraint`
 *    reads every such flag in a refusal as a partition the lever proposes, so an example in
 *    flag form would be pasted into the halt as though the refusal had computed it
 */
export const REVIEW_PARTITION_REPAIR_TIP = [
  'claim each domain whole, in every layer, and the files you edit next stay covered',
  'e.g. src/route/** and blackbox/{,__snapshots__/}driver.route.* in one partition',
] as const;

/**
 * .what = the `✨ did you know?` block a partition repair closes on
 * .why = the tip is optional guidance, so it rides its own block after the tree, never a
 *        `tip:` row inside it (rule.require.coconut-hints). the block sits apart from the
 *        repair text, so a paste of the repair never carries it
 *
 * .note = each surface that prints a repair appends this once, after its whole tree
 */
export const asReviewPartitionRepairTipLines = (): string[] =>
  asDidYouKnowLines({ rows: [...REVIEW_PARTITION_REPAIR_TIP] });

/**
 * .what = the tree lines of a partition repair: where each unclaimed file lands, and the
 *         paste-ready text that declares the repaired set
 * .why = the stone entrance and a review run's split refusal both print a repair; one render
 *        keeps them byte-alike, so a driver reads one shape wherever the gap surfaces
 *        (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = `placed` are leaf rows, to sit under a header the caller words; `command` closes the
 *         branch with the caption, and its text indented beneath. the tip is not here: each
 *         caller appends `asReviewPartitionRepairTipLines` after its whole tree
 */
export const asReviewPartitionRepairLines = (input: {
  repair: {
    placed: Array<{ path: string; slug: string; glob: string }>;
    command: string;
  };
  /** the indent of the branch these lines sit in */
  indent: string;
  /** the words that introduce the command — e.g. `repair — run this, then re-arrive` */
  caption: string;
}): { placed: string[]; command: string[] } => ({
  placed: input.repair.placed.map(
    (item, index) =>
      `${input.indent}│  ${index === input.repair.placed.length - 1 ? '└─' : '├─'} ${item.path} → ${item.slug} (+ ${item.glob})`,
  ),
  command: [
    `${input.indent}└─ ${input.caption}`,
    ...input.repair.command
      .split('\n')
      .map((line) => `${input.indent}      ${line}`),
  ],
});
