import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

/**
 * .what = finds a stone by its exact name
 * .why = extracts array find with inline callback for narrative flow
 */
export const findStoneByName = (input: {
  stones: RouteStone[];
  name: string;
}): RouteStone | undefined => {
  return input.stones.find((s) => s.name === input.name);
};
