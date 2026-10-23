/**
 * .what = how many seconds lie between two epoch-ms instants, rounded to the nearest whole
 * .why = the realized `time.seconds` grain is stated once, by name, rather than as inline
 *        `Date.now()` arithmetic (rule.forbid.inline-decode-friction)
 *
 * .note = rounded, not floored: this is a recorded metric, where the spinner's floored
 *         `getOneSecondsElapsed` is a live display. two grains, so two names
 */
export const getOneSecondsRounded = (input: {
  since: number;
  until: number;
}): number => Math.round((input.until - input.since) / 1000);
