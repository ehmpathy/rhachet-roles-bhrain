import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getAllPassageReports } from './getAllPassageReports';

/**
 * .what = reads latest passage report for a stone from passage.jsonl
 * .why = enables current passage state lookup
 *
 * .note = returns latest entry for stone, only if status matches filter (if provided)
 *         this ensures 'rewound' invalidates prior 'passed' entries
 */
export const getOnePassageReport = async (input: {
  stone: string;
  status?: 'passed' | 'approved' | 'blocked' | 'rewound';
  route: string;
}): Promise<PassageReport | null> => {
  const reports = await getAllPassageReports({ route: input.route });

  // get latest entry for this stone (no filter)
  const stoneReports = reports.filter((r) => r.stone === input.stone);
  const latest =
    stoneReports.length > 0 ? stoneReports[stoneReports.length - 1]! : null;

  // if status filter provided, return null if latest doesn't match
  if (input.status && latest?.status !== input.status) {
    return null;
  }

  return latest;
};
