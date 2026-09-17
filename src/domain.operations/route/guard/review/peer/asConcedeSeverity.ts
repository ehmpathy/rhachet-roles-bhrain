import { BadRequestError } from 'helpful-errors';

/**
 * .what = narrows the raw --severity argument to the closed concede grade, or throws
 * .why = --severity is a closed set of two — `better` | `urgent` (F028/S14). the cli had cast the
 *        raw string with `as 'better' | 'urgent'`, so `--severity foo` flowed straight through as
 *        a bad grade the domain op then read as harm (rule.forbid.as-cast). a boundary guard fails
 *        it loud and names the fix (rule.require.failfast).
 *
 * .note = an omitted --severity returns undefined, never a default. `setStoneAsConcernAbsorbed`
 *         then REFUSES an omitted severity on a concede outright (2026-09-15, a mandatory
 *         invariant — no ungraded concede) and forbids one on a dispute. this guard stays a
 *         pure narrow of what the caller actually passed; the default-vs-refuse decision is the
 *         domain op's, never this one's.
 */
export const asConcedeSeverity = (input: {
  raw: string | undefined;
}): 'better' | 'urgent' | undefined => {
  if (input.raw === undefined) return undefined;
  if (input.raw === 'better' || input.raw === 'urgent') return input.raw;
  throw new BadRequestError(
    `invalid --severity: "${input.raw}". expected one of: better, urgent`,
    { severity: input.raw },
  );
};
