import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getAllPassageReports } from './getAllPassageReports';

/**
 * .what = reads latest passage report for a stone from passage.jsonl
 * .why = enables current passage state lookup
 */
export const getOnePassageReport = async (input: {
  stone: string;
  status?: 'passed' | 'approved' | 'blocked';
  route: string;
}): Promise<PassageReport | null> => {
  const reports = await getAllPassageReports({ route: input.route });

  // filter by stone and optionally by status
  const matched = reports
    .filter((r) => r.stone === input.stone)
    .filter((r) => !input.status || r.status === input.status);

  // return latest (last in array)
  return matched.length > 0 ? matched[matched.length - 1]! : null;
};
