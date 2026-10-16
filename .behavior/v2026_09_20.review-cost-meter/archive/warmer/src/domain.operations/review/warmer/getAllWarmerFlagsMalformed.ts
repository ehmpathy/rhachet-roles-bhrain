import { FLAG_OF_WARMER_ARG } from './FLAG_OF_WARMER_ARG';

/**
 * .what = the numeric flags a detached warmer spawn supplied with a value that
 *         is not a positive number, named as a human would type them
 * .why = `--pokes abc` parses to `NaN`. to report it beside the absent flags
 *        would name a flag the spawn did pass as one it forgot, and send the
 *        reader after the wrong defect (`rule.require.errors-name-the-fix`)
 *
 * .note = zero is malformed too: a warmer with no pokes, or no interval
 *         between them, has no plan to run. an absent flag is not malformed —
 *         `getAllWarmerFlagsAbsent` names it, so each flag lands in at most
 *         one list
 */
export const getAllWarmerFlagsMalformed = (input: {
  options: { pokes: number | undefined; every: number | undefined };
}): string[] => {
  const flagByValue: { flag: string; value: number | undefined }[] = [
    { flag: FLAG_OF_WARMER_ARG.pokes, value: input.options.pokes },
    { flag: FLAG_OF_WARMER_ARG.every, value: input.options.every },
  ];
  return flagByValue
    .filter((one) => one.value !== undefined && !isPositiveNumber(one.value))
    .map((one) => one.flag);
};

/**
 * .what = whether a parsed flag value is a finite number above zero
 * .why = `NaN`, `Infinity`, zero, and negatives are each a value no warmer plan can use
 */
const isPositiveNumber = (value: number): boolean =>
  Number.isFinite(value) && value > 0;
