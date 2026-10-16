/**
 * .what = the instant a number of minutes after another
 * .why = the inverse of `getOneMinutesElapsed`, in the same minutes-as-number vocabulary
 *        the warmer speaks at every seam; named so no caller spells out `* 60_000`
 *        (rule.forbid.inline-decode-friction)
 */
export const getOneInstantAfter = (input: {
  since: Date;
  minutes: number;
}): Date => new Date(input.since.getTime() + input.minutes * 60_000);
