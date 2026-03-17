import * as fs from 'fs/promises';
import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

/**
 * .what = reads latest passage report per stone from passage.jsonl
 * .why = enables current passage state lookup with "last entry wins" semantics
 *
 * .note = passage.jsonl is append-only; later entries supersede earlier ones
 *         this returns only the latest entry per stone, not full history
 */
export const getAllPassageReports = async (input: {
  route: string;
}): Promise<PassageReport[]> => {
  const passagePath = path.join(input.route, '.route', 'passage.jsonl');

  // check if file exists
  const fileFound = await fs
    .access(passagePath)
    .then(() => true)
    .catch(() => false);
  if (!fileFound) return [];

  // read and parse all entries
  const content = await fs.readFile(passagePath, 'utf-8');
  const allReports = content
    .split('\n')
    .filter(Boolean)
    .map((line) => new PassageReport(JSON.parse(line)));

  // group by stone, keep only latest (last entry wins)
  const latestByStone = new Map<string, PassageReport>();
  for (const report of allReports) {
    latestByStone.set(report.stone, report);
  }

  return [...latestByStone.values()];
};
