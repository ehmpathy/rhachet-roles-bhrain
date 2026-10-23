import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the tree branch that flags each declared glob which matched no changed file
 * .why = a typo in a glob is silent everywhere else — the partition still parses, coverage may
 *        still pass — so every plan of a split names the zero-match globs, once, before any
 *        write or brain cost. empty where every glob matched, so a sound plan reads unchanged
 * .note = the header counts its globs, and its noun agrees with the count, so one typo reads
 *         `1 glob`, never `globs`
 * .note = where the globs are held by a written set, the caller passes the paste-ready command
 *         that drops them (`cure`), so a stale glob costs one paste rather than a re-declaration
 *         of the whole set; null where no such command applies (a review plan, a declaration
 *         not yet written)
 */
export const asReviewPartitionUnmatchedLines = (input: {
  unmatched: Array<{ slug: string; glob: string }>;
  /** the prefix of the branch line, e.g. '   ' */
  indent: string;
  /** the command that drops every unmatched glob; null where none applies */
  cure: string | null;
}): string[] => {
  if (input.unmatched.length === 0) return [];
  const isLastGlob = (index: number): boolean =>
    index === input.unmatched.length - 1 && input.cure === null;
  return [
    `${input.indent}├─ 🟡 ${asCountedNoun({ count: input.unmatched.length, one: 'glob', many: 'globs' })} that matched no changed file — a typo, or no change there yet`,
    ...input.unmatched.map(
      (one, index) =>
        `${input.indent}│  ${isLastGlob(index) ? '└─' : '├─'} ${one.slug}: ${one.glob}`,
    ),
    ...(input.cure === null
      ? []
      : [`${input.indent}│  └─ stale? drop them: ${input.cure}`]),
  ];
};
