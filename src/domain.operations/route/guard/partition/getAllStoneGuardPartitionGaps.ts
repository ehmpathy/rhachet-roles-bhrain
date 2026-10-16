import type { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { asStoneGuardPartitionGapsOfCoverage } from './asStoneGuardPartitionGapsOfCoverage';
import { getAllStoneGuardPartitionCoverage } from './getAllStoneGuardPartitionCoverage';
import type { StoneGuardPartitionGap } from './StoneGuardPartitionGap';

/**
 * .what = each partition scope a stone's reviewers read that leaves a changed file
 *         unclaimed, or a partition without the bound route — with its repair
 * .why = 🔴 the same check `rhx review` runs per lane, run ONCE at the stone's entrance. per
 *        lane, one stale glob refused every lane that split — ten refusals for one cause,
 *        each after the pour began. at the entrance it refuses once, before any brain is
 *        called, and prints the repaired set as one command (rule.forbid.workarounds)
 *
 * .note = the gaps of the one stone-wide coverage computation
 *         (`getAllStoneGuardPartitionCoverage`), which the coverage read renders whole — so a
 *         driver's preview and this gate cannot disagree
 */
export const getAllStoneGuardPartitionGaps = async (input: {
  stone: { name: string; guard: RouteStoneGuard | null };
  /** the route dir — relative to cwd, or absolute */
  route: string;
  cwd: string;
}): Promise<StoneGuardPartitionGap[]> => {
  const coverages = await getAllStoneGuardPartitionCoverage(input);
  return asStoneGuardPartitionGapsOfCoverage({ coverages });
};
