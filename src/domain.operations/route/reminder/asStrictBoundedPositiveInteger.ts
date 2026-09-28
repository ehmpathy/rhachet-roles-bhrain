import { BadRequestError } from 'helpful-errors';

import { asStrictPositiveInteger } from './asStrictPositiveInteger';

/**
 * .what = node's setTimeout max delay (2^31 - 1 ms, ~24.8 days). the ONE home for this cap — a value
 *         ABOVE it is NOT rejected by node; node SILENTLY clamps the delay to ~1ms, so a "sleep
 *         forever" value degrades to a ~1ms busy-loop (the insidious failhide both duration guards
 *         reject). one constant so a change to the cap can never drift between the two flag casts.
 */
export const MS_SETTIMEOUT_MAX = 2_147_483_647;

/**
 * .what = casts a raw cli flag value into a validated strict positive integer within `[min, max]`, or
 *         resolves `defaultMs` when the flag is absent.
 * .why = the reminder's two duration flags (`--interval-ms` cadence, `--say-timeout-ms` inject bound)
 *        share ONE exact validation shape: absent → default; a STRICT all-digits parse (a lenient
 *        parseInt launders `1200000abc` → 1200000 and `abc` → NaN past a bare guard —
 *        rule.require.failfast); a MIN floor (a sub-second value is a self-inflicted busy-loop / a
 *        cancelled inject); and a MAX cap at node's setTimeout limit (see MS_SETTIMEOUT_MAX). the two
 *        casts hand-rolled this verbatim, so a change to the cap-guard would need a sync in both. this
 *        is the one bounded-int validator both compose (rule.prefer.most-common-denominator); each
 *        thin wrapper supplies only its flag name, subject noun, example, default, and bounds.
 *
 * an ABSENT flag resolves the default; a MALFORMED / out-of-range flag throws a BadRequestError that
 * names the fix (exit 2, a caller constraint — rule.require.errors-name-the-fix).
 */
export const asStrictBoundedPositiveInteger = (input: {
  raw: string | undefined;
  flag: string;
  subject: string;
  example: string;
  defaultMs: number;
  min: number;
  max: number;
}): number => {
  // an absent flag is not an error — it resolves to the sane default
  if (input.raw === undefined) return input.defaultMs;

  // a present flag must be a strict positive integer (all-digits edge to edge); else throw loud
  const parsed = asStrictPositiveInteger({ raw: input.raw });
  if (parsed === null)
    throw new BadRequestError(`${input.flag} must be a positive integer`, {
      hint: `e.g. ${input.flag} ${input.example}`,
      raw: input.raw,
    });

  // a value below the floor is a caller mistake (a sub-second value busy-loops / cancels real calls);
  // caught loud here (rule.require.failfast)
  if (parsed < input.min)
    throw new BadRequestError(
      `${input.flag} is below the min sane ${input.subject} (${input.min} ms)`,
      {
        hint: `pick a value at or above ${input.min} ms; e.g. ${input.flag} ${input.example}`,
        raw: input.raw,
        min: input.min,
      },
    );

  // a value ABOVE node's setTimeout cap is SILENTLY clamped to ~1ms by node — the insidious failhide.
  // bound it loud at the parse boundary (rule.forbid.failhide / rule.require.failfast)
  if (parsed > input.max)
    throw new BadRequestError(
      `${input.flag} exceeds the max supported ${input.subject} (${input.max} ms)`,
      {
        hint: `pick a value at or below ${input.max} ms (~24.8 days); e.g. ${input.flag} ${input.example}`,
        raw: input.raw,
        max: input.max,
      },
    );

  return parsed;
};
