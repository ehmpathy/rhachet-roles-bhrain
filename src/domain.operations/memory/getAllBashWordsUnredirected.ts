/**
 * .what = a command's words with each redirect word dropped, and its target too when
 *         the target stands apart (`2> /dev/null`)
 * .why = a redirect may sit anywhere among a command's words (`tee a 2>/dev/null b`,
 *        `cp a M 2>&1`); its words are neither operands nor a destination. every leaf
 *        that reads operands drops them here, so no two disagree
 */
export const getAllBashWordsUnredirected = (input: {
  words: string[];
}): string[] => {
  // .note = deliberate mutation: one pass, one push per word, linear in words
  const kept: string[] = [];
  let skipNext = false;
  for (const word of input.words) {
    if (skipNext) {
      skipNext = false;
      continue;
    }
    if (/^(\d*|&)(>>?\|?|<<?<?|>&|<&)/.test(word)) {
      skipNext = /^(\d*|&)(>>?\|?|<<?<?|>&|<&)$/.test(word);
      continue;
    }
    kept.push(word);
  }
  return kept;
};
