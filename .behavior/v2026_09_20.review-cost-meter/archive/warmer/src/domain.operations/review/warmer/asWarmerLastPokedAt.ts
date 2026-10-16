import type { WarmerCost } from '@src/domain.operations/review/warmer/getOneWarmerCost';

/**
 * .what = the instant of a warmer's last ledger row, or null where none can be read
 * .why = an absent row and a stamp that does not parse both leave no instant to measure
 *        a reach from; one cast keeps the open and the passed checks from a drift apart
 */
export const asWarmerLastPokedAt = (input: {
  warmer: Pick<WarmerCost, 'lastAt'>;
}): Date | null => {
  // no row → no instant
  if (input.warmer.lastAt === null) return null;

  // an unparseable stamp reads the same as an absent row
  const lastAt = new Date(input.warmer.lastAt);
  if (Number.isNaN(lastAt.getTime())) return null;
  return lastAt;
};
