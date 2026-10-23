import { asReviewPartitionDeclarationParts } from './asReviewPartitionDeclarationParts';
import { asReviewPartitionGlobsOfText } from './asReviewPartitionGlobsOfText';

/**
 * .what = one declaration value in its canonical form — `slug=glob,glob,...`
 * .why = 🔴 a printed declaration is a comma list, never a brace set (seed S53): a set held
 *        from an older declaration may carry `slug={a,b}`, and a repair that echoes it as held
 *        would print the very brace the shell can expand. the globs read the same either way
 */
const asValueCanonical = (input: { value: string }): string => {
  const parts = asReviewPartitionDeclarationParts({ value: input.value });
  const globs = asReviewPartitionGlobsOfText({ text: parts.globsText });
  return `${parts.slug}=${globs.join(',')}`;
};

/**
 * .what = the paste-ready text that declares a whole partition set: the command head, one
 *         `--partition` line per value, then the tail
 * .why = a repair that owes a new partition, and a refusal that proposes a first set, both
 *        print the whole declaration; one render keeps them byte-alike
 *        (rule.forbid.duplicate-format-tree-operations)
 *
 * .note = each value prints in canonical form — a comma list, never a brace set (seed S53)
 */
export const asReviewPartitionDeclarationText = (input: {
  partition: string[];
  command: { head: string; tail: string };
}): string =>
  [
    input.command.head,
    ...input.partition.map(
      (value) => `  --partition '${asValueCanonical({ value })}'`,
    ),
    input.command.tail,
  ].join(' \\\n');
