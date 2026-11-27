import type { IsoDateStamp } from 'iso-time';

/**
 * .what = a day, as a pursuit dir name carries it: `2026_11_24`
 * .why = the dir name leads with `v$date`; underscores keep it one token between dots, as
 *        every route dir in this repo spells it
 */
export const asPursuitDate = (input: { day: IsoDateStamp }): string =>
  input.day.replace(/-/g, '_');
