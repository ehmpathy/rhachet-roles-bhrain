/**
 * .what = the slug and the glob text of one `--partition '<slug>=<globs>'` value
 * .why = the fault check and the parser read one value the same way, so a value one of
 *        them accepts the other cannot read differently
 */
export const asReviewPartitionDeclarationParts = (input: {
  value: string;
}): { slug: string; globsText: string } => {
  const at = input.value.indexOf('=');
  return at === -1
    ? { slug: '', globsText: '' }
    : {
        slug: input.value.slice(0, at).trim(),
        globsText: input.value.slice(at + 1).trim(),
      };
};
