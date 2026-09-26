/**
 * .what = casts a raw string into a strict positive integer, or null when it is not one — the ONE
 *         home for the "all-digits, edge-to-edge, > 0" gate the reminder's numeric boundaries share.
 * .why = three boundaries need the identical strict parse: `--interval-ms`, `--say-timeout-ms`, and
 *        the on-disk pid handle. a lenient `Number.parseInt` reads a numeric PREFIX and drops the
 *        rest, so `1200000abc` → 1200000 and `12 34` → 12 pass a bare integer guard — the exact
 *        silent-continuation-on-bad-input the failfast clause forbids (rule.require.failfast). three
 *        re-inlined copies of the same `/^\d+$/` guard is a drift hazard on a SECURITY boundary: a
 *        regex loosened in one copy but not the others silently reopens the DoS/failhide holes the
 *        callers guard against. one strict transformer removes that drift (rule.prefer.wet-over-dry,
 *        rule.require.named-transformers).
 *
 * .note = pure gate, no policy: it returns the parsed int (or null); each CALLER owns its own error
 *         type + message on null (a `BadRequestError` for a cli flag, an `UnexpectedCodePathError` for
 *         a torn handle) and its own range bounds (a min/max cadence, a pid). this transformer decides
 *         ONLY "is this a strict positive integer", so no caller loses its named-fix error.
 */
export const asStrictPositiveInteger = (input: {
  raw: string;
}): number | null => {
  const trimmed = input.raw.trim();
  const parsed = Number.parseInt(trimmed, 10);
  if (!/^\d+$/.test(trimmed) || !Number.isInteger(parsed) || parsed <= 0)
    return null;
  return parsed;
};
