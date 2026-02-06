import { getRouteBindByBranch } from './getRouteBindByBranch';

/**
 * .what = queries the bound route for the current branch
 * .why = enables visibility into current bind state
 */
export const getRouteBind = async (): Promise<{ route: string } | null> => {
  return getRouteBindByBranch({ branch: null });
};
