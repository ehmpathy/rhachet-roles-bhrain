import type { ReviewTreeRead } from '@src/domain.operations/review/grove/asTreeReadsSplit';

/**
 * .what = the first tree's denial, where NO tree was readable and at least one was denied
 * .why = a grove where every tree with logs is barred has no figure left to report — an
 *        isolated denial would fold into `no review logs to price`, the one sentence that
 *        sends a driver to re-run reviews that already ran. so the first denial surfaces
 *        to the shared barred-root refusal, exactly as the tree breadth does. isolation
 *        holds only while at least one tree still prices.
 *
 * .note = wrapped as `{ denial }` rather than bare, so `null` means "no refusal owed"
 *         and can never be confused with a denial value. a vanished root is no denial,
 *         so it never feeds this refusal
 */
export const getOneDenialOfBarredGrove = (input: {
  reads: ReviewTreeRead[];
  /** how many trees were readable; any one of them lifts the refusal */
  readableCount: number;
}): { denial: unknown } | null => {
  // a grove where any tree still prices owes no refusal
  if (input.readableCount > 0) return null;

  // the first denial in tree order, if any tree was denied at all
  const readDenied = input.reads.find((one) => one.read.denial !== null);
  if (readDenied === undefined) return null;
  return { denial: readDenied.read.denial };
};
