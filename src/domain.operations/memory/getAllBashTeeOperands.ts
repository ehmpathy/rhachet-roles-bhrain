import { asBashWordBare } from './asBashWordBare';
import { getAllBashWordsUnredirected } from './getAllBashWordsUnredirected';

/**
 * .what = the files a tee in one simple command writes, as plain paths
 * .why = tee writes stdin to its operands and to naught else, so the guard grades
 *        each where it lands; null means the text cannot name them, so the caller
 *        grades the tee blunt
 *
 * returns null when:
 * - no tee or teesafe word is found
 * - `xargs` is in the command (it appends operands the text never shows)
 * - tee has no operand
 * - an operand is not a plain path (`{}`, `$F`, a glob, a backtick)
 *
 * .note = the verb is found by asBashWordBare, the same parse getOneBashCopyVerb
 *         uses, so `/usr/bin/tee`, `\tee`, and `"tee"` are each a tee here too
 */
export const getAllBashTeeOperands = (input: {
  segment: string;
}): string[] | null => {
  const words = input.segment.trim().split(/\s+/);
  const indexVerb = words.findIndex((word) =>
    ['tee', 'teesafe'].includes(asBashWordBare({ word })),
  );
  if (indexVerb < 0) return null;
  if (words.some((word) => asBashWordBare({ word }) === 'xargs')) return null;

  // drop each redirect word (and its target), then each option; the rest are operands
  const operands = getAllBashWordsUnredirected({
    words: words.slice(indexVerb + 1),
  })
    .filter((word) => !word.startsWith('-'))
    .map((word) => word.replace(/^["']|["']$/g, ''));

  if (operands.length === 0) return null;
  if (operands.some((operand) => !/^[\w./~@+=,:-]+$/.test(operand)))
    return null;
  return operands;
};
