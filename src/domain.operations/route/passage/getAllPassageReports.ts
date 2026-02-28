import * as fs from 'fs/promises';
import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

/**
 * .what = reads all passage reports from passage.jsonl
 * .why = enables passage history lookup
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

  // read and parse
  const content = await fs.readFile(passagePath, 'utf-8');
  return content
    .split('\n')
    .filter(Boolean)
    .map((line) => new PassageReport(JSON.parse(line)));
};
