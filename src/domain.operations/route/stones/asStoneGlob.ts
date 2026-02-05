/**
 * .what = converts raw user input into a proper stone glob pattern
 * .why = enables natural word input without glob syntax knowledge
 *
 * .note = if pattern has no glob chars (* or ?), wraps with *...*
 *         if pattern already has glob chars, passes through as-is
 */
export const asStoneGlob = (input: {
  pattern: string;
}): { glob: string; raw: string } => {
  const hasGlobChars =
    input.pattern.includes('*') || input.pattern.includes('?');
  if (hasGlobChars) return { glob: input.pattern, raw: input.pattern };
  return { glob: `*${input.pattern}*`, raw: input.pattern };
};

/**
 * .what = matches a stone name against a stone glob pattern
 * .why = enables filter of stones by glob
 */
export const isStoneInGlob = (input: {
  name: string;
  glob: string;
}): boolean => {
  // convert glob pattern to regex
  const regexStr = input.glob
    .replace(/\./g, '\\.')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  const regex = new RegExp(`^${regexStr}$`);
  return regex.test(input.name);
};
