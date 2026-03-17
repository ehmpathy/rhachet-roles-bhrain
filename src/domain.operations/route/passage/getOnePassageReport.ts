import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getAllPassageReports } from './getAllPassageReports';

/**
 * .what = reads passage report for a stone from passage.jsonl
 * .why = enables passage state and approval gate lookup
 *
 * .note = getAllPassageReports handles deduplication semantics
 */
export const getOnePassageReport = async (input: {
  stone: string;
  status?: 'passed' | 'approved' | 'blocked' | 'rewound' | 'malfunction';
  route: string;
}): Promise<PassageReport | null> => {
  const reports = await getAllPassageReports({ route: input.route });

  // find entry for this stone with status (if provided)
  const found = reports.find(
    (r) => r.stone === input.stone && (!input.status || r.status === input.status),
  );

  return found ?? null;
};
