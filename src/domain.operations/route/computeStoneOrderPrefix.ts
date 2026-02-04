import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

/**
 * .what = extracts the numeric prefix from a stone name
 * .why = enables stones to be grouped by parallel execution tier
 *
 * @example
 * "3.1.research.domain" → "3.1"
 * "1.vision" → "1"
 * "2.criteria" → "2"
 */
export const computeStoneOrderPrefix = (input: {
  stone: RouteStone;
}): string => {
  const match = input.stone.name.match(/^(\d+(?:\.\d+)*)/);
  if (!match || !match[1]) return '';
  return match[1];
};
