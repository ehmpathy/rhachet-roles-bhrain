import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { JUDGE_LEVEL } from '../guard/review/peer/meter/JUDGE_LEVEL';
import { getAllPassageReports } from '../passage/getAllPassageReports';

/**
 * .what = retrieves the set of review levels a human has overruled for a stone
 * .why = overrule is level-scoped: an overrule at level N forgives only the
 *        reviewers at level N, so higher levels still gate passage. the judge is
 *        the top rung (JUDGE_LEVEL), so an overrule of the judge is just a level in
 *        this set — there is no stone-wide "forgive all rungs at once" marker
 *        (see define.review.human-forgiveness.md).
 *
 * .note = delegates to getAllPassageReports which handles cross-stone
 *         invalidation: a rewind of stone M clears overrules for stones >= M
 * .note = a legacy (level-less) overrule record maps to JUDGE_LEVEL — the honest
 *         read of an old "stone-wide" wave under the top-rung model: it forgives the
 *         judge rung (the top rung), not a stone-wide skeleton key. new overrules always
 *         carry a level, so JUDGE_LEVEL enters this set only via a judges-only stone's
 *         judge overrule or such a legacy record.
 */
export const getStoneGuardOverruledLevels = async (input: {
  stone: RouteStone;
  route: string;
}): Promise<Set<number>> => {
  // get passage reports with cross-stone invalidation applied
  const reports = await getAllPassageReports({ route: input.route });

  // collect overrules for this stone
  const overrules = reports.filter(
    (r) => r.stone === input.stone.name && r.status === 'overruled',
  );

  // collect the overruled levels; a legacy level-less record maps to the judge rung
  const levels = new Set(
    overrules.map((o) => (o.level !== undefined ? o.level : JUDGE_LEVEL)),
  );

  return levels;
};
