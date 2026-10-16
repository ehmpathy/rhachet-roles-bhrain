import { asGuardMalfunctionReasonLines } from './asGuardMalfunctionReasonLines';

/**
 * .what = the one line of a halt reason a `reason =` row shows
 * .why = a malfunction reason carries a header and one line per broken part. the `reason =`
 *        row and the remedy groups read only the header; the clear block reads the parts. any
 *        other reason is one line already, and passes through unchanged
 */
export const asGuardReasonHead = (input: {
  passage: string;
  reason: string | null;
}): string | null => {
  if (!input.reason) return null;
  if (input.passage !== 'malfunction') return input.reason;
  return (
    asGuardMalfunctionReasonLines({ reason: input.reason })?.header ??
    input.reason
  );
};
