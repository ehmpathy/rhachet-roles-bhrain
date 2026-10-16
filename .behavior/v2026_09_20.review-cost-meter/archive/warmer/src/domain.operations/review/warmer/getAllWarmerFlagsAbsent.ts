import { FLAG_OF_WARMER_ARG } from './FLAG_OF_WARMER_ARG';

/**
 * .what = the flags a detached warmer spawn omitted, named as a human would type them
 * .why = a malformed spawn is met in a detached process with no terminal, so
 *        its refusal must name which flags are absent rather than print all
 *        five (`rule.require.errors-name-the-fix`)
 *
 * .note = the order is the usage line's order, so the refusal reads in the
 *         sequence the reader will see beneath it
 * .note = absent means not supplied. a numeric flag supplied with a value
 *         that is not a number parses to `NaN`, which is present —
 *         `getAllWarmerFlagsMalformed` names it, so a flag the spawn did pass
 *         is never reported as one it forgot
 */
export const getAllWarmerFlagsAbsent = (input: {
  options: {
    reviewer: string | undefined;
    logDir: string | undefined;
    pokes: number | undefined;
    every: number | undefined;
    brain: string | undefined;
  };
}): string[] => {
  const flagByValue: { flag: string; value: string | number | undefined }[] = [
    { flag: FLAG_OF_WARMER_ARG.reviewer, value: input.options.reviewer },
    { flag: FLAG_OF_WARMER_ARG.logDir, value: input.options.logDir },
    { flag: FLAG_OF_WARMER_ARG.pokes, value: input.options.pokes },
    { flag: FLAG_OF_WARMER_ARG.every, value: input.options.every },
    { flag: FLAG_OF_WARMER_ARG.brain, value: input.options.brain },
  ];
  return flagByValue
    .filter((one) => one.value === undefined || one.value === '')
    .map((one) => one.flag);
};
