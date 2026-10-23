import type { TokenSpendRepaidRow } from '@src/domain.objects/Reflector/TokenSpendReport';

/**
 * .what = the total tokens a repaid row was paid at, across every span
 * .why = the rank, the render, and the empty-row filter must agree on this one number;
 *        one owner makes that agreement structural rather than coincidental
 */
export const asTokenRepaidTotal = (input: {
  tokens: TokenSpendRepaidRow['tokens'];
}): number =>
  input.tokens.cacheRead +
  input.tokens.cacheWrite5m +
  input.tokens.cacheWrite1h +
  input.tokens.input;
