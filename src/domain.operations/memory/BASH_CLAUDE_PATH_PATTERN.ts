import { BASH_WORD_CHAR } from './BASH_WORD_CHAR';

/**
 * .what = pattern that finds each word under a `.claude/` dir in a command string
 * .why = a broad lift; which of those words is native memory is decided by
 *        isNativeMemoryPath alone, so the memory grammar lives in one place
 * .note = the match opens only at a word start, so each word is scanned once; an
 *         open start let a long word rescan from every char, quadratic in its length
 */
export const BASH_CLAUDE_PATH_PATTERN = new RegExp(
  String.raw`(?<!${BASH_WORD_CHAR})${BASH_WORD_CHAR}*\.claude\/${BASH_WORD_CHAR}*`,
  'g',
);
