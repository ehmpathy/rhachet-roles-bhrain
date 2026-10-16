import { getAllWarmerFlagsAbsent } from './getAllWarmerFlagsAbsent';
import { getAllWarmerFlagsMalformed } from './getAllWarmerFlagsMalformed';

/**
 * .what = whether a detached warmer spawn handed every flag it needs
 * .why = the cli once tested the five flags with an inline `!a || !b || …` chain
 *        beside `getAllWarmerFlagsAbsent`, which answers the same question — two
 *        statements of one fact (`rule.forbid.inline-decode-friction`). this guard
 *        reads the named list, and as a TYPE PREDICATE it still narrows each option
 *        from `T | undefined` to `T` for every line after the check, which was the
 *        one reason the chain stayed inline
 * .note = complete means every flag supplied AND every numeric flag a positive number;
 *         a malformed value is as unusable as an absent one
 */
export const isWarmerArgvComplete = (input: {
  reviewer: string | undefined;
  logDir: string | undefined;
  pokes: number | undefined;
  every: number | undefined;
  brain: string | undefined;
}): input is {
  reviewer: string;
  logDir: string;
  pokes: number;
  every: number;
  brain: string;
} =>
  getAllWarmerFlagsAbsent({ options: input }).length === 0 &&
  getAllWarmerFlagsMalformed({ options: input }).length === 0;
