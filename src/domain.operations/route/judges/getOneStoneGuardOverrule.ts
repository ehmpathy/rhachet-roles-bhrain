import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getAllPassageReports } from '../passage/getAllPassageReports';

/**
 * .what = retrieves overrule marker for a stone if present and valid
 * .why = enables reviewed? judge to check if human has overruled thresholds
 *
 * .note = delegates to getAllPassageReports which handles cross-stone invalidation:
 *         rewind of stone M invalidates overrules for all stones >= M
 */
export const getOneStoneGuardOverrule = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{ overruled: true } | null> => {
  // get passage reports with cross-stone invalidation applied
  const reports = await getAllPassageReports({ route: input.route });

  // find overrule for this stone
  const overrule = reports.find(
    (r) => r.stone === input.stone.name && r.status === 'overruled',
  );
  if (!overrule) return null;

  // overrule is valid
  return { overruled: true };
};
