import { ESCAPE_OF_STAMP } from './genLogDirName';

/**
 * .what = the instant a log dir name encodes
 * .why = the escape it reverses is declared beside the mint in
 *        `genLogDirName.ts`, so this un-escape stays in sync with it.
 *        `genLogDirName` replaces `:` and `.` with `-` to stay path-safe;
 *        a wrong reversal does not throw — it yields an `Invalid Date`,
 *        which compares false against every bound, so every run reads as
 *        older than any question asked of it.
 *
 * .note = an unparseable stamp sorts as the epoch, never `NaN`, so it can
 *         never win a `Math.max` and be mistaken for the latest run
 *         (rule.forbid.failhide).
 */
export const asLogDirMintedAt = (input: { name: string }): Date => {
  const [stamp] = input.name.split('.');
  // `2026-09-24T14-09-52-123Z` → `2026-09-24T14:09:52.123Z`
  const at = new Date((stamp ?? '').replace(ESCAPE_OF_STAMP, 'T$1:$2:$3.$4Z'));
  return Number.isNaN(at.getTime()) ? new Date(0) : at;
};
