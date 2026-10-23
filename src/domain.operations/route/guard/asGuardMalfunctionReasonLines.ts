/**
 * .what = the header and the per-lane lines of a persisted malfunction reason
 * .why = the one reader of the shape `asGuardMalfunctionReason` writes, so a render never
 *        re-splits the string by hand
 *
 * .note = null for a record with no reason — a malfunction persisted before the reason was
 *         recorded. the render still owes the driver its levers then; it merely cannot
 *         name the lanes.
 */
export const asGuardMalfunctionReasonLines = (input: {
  reason: string | null;
}): { header: string; lanes: string[] } | null => {
  const lines = (input.reason ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const [header, ...lanes] = lines;
  if (!header) return null;
  return { header, lanes };
};
