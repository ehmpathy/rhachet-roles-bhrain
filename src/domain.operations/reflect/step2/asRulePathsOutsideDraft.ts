/**
 * .what = the rule paths that sit outside the `.draft/` directory
 * .why = a draft rule is the reflect run's own output, never a prior rule an update may merge into
 */
export const asRulePathsOutsideDraft = (input: {
  rulePaths: string[];
}): string[] => input.rulePaths.filter((f) => !f.startsWith('.draft/'));
