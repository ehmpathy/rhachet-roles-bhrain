import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getAllPassageReports } from '../passage/getAllPassageReports';

/**
 * .what = retrieves the set of review levels a human has overruled for a stone
 * .why = overrule is level-scoped: an overrule at level N forgives only the
 *        reviewers at level N, so higher levels still gate passage
 *
 * .note = delegates to getAllPassageReports which handles cross-stone
 *         invalidation: a rewind of stone M clears overrules for stones >= M
 * .note = `all` is true when a legacy (level-less) overrule is present; such an
 *         overrule forgives every level, to preserve pre-level-scope behavior
 */
export const getStoneGuardOverruledLevels = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<{ levels: Set<number>; all: boolean }> => {
  // get passage reports with cross-stone invalidation applied
  const reports = await getAllPassageReports({ route: input.route });

  // collect overrules for this stone
  const overrules = reports.filter(
    (r) => r.stone === input.stone.name && r.status === 'overruled',
  );

  // a legacy (level-less) overrule forgives every level
  const all = overrules.some((o) => o.level === undefined);

  // collect the explicitly-overruled levels
  const levels = new Set(
    overrules.flatMap((o) => (o.level !== undefined ? [o.level] : [])),
  );

  return { levels, all };
};
