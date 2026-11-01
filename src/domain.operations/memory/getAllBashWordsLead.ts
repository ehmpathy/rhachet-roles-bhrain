import { asBashWordBare } from './asBashWordBare';

/**
 * .what = the words of a simple command from its lead word on, the lead read bare
 * .why = `(cd D`, `{ cd D`, `! cd D`, `\cd D`, and `"cd" D` all run cd; each leaf that
 *        asks which command a segment runs, or what follows it, reads it here, so no
 *        two disagree on the lead
 * .note = group marks (`(`, `{`, `!`) before the lead are dropped; the words after the
 *         lead keep their text, since a target's quotes still mean aught to its reader
 */
export const getAllBashWordsLead = (input: { segment: string }): string[] => {
  const words = input.segment
    .trim()
    .split(/\s+/)
    .map((word, index) => (index === 0 ? word.replace(/^[({!]+/, '') : word))
    .filter((word) => word.length > 0 && !['{', '(', '!'].includes(word));
  const [lead, ...rest] = words;
  return lead === undefined ? [] : [asBashWordBare({ word: lead }), ...rest];
};
