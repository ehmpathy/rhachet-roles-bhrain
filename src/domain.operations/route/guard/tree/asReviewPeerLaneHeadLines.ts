/**
 * .what = the two head lines of one peer lane in an absorb prompt — its ordinal and its slug
 * .why = the stance halt and the reply halt each list owed lanes under one head, so one render
 *        keeps the two prompts from drift (rule.forbid.duplicate-format-tree-operations)
 */
export const asReviewPeerLaneHeadLines = (input: {
  index: number;
  total: number;
  slug: string;
}): string[] => [
  `   ├─ review.peer ${input.index}/${input.total}`,
  `   │  ├─ slug = ${input.slug}`,
];
