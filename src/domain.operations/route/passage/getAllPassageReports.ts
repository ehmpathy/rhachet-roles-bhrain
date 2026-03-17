import * as fs from 'fs/promises';
import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

/**
 * .what = reads current passage state per stone from passage.jsonl
 * .why = enables current passage state lookup
 *
 * .note = passage.jsonl is append-only with specific deduplication rules:
 *         - passage states (passed/blocked/malfunction): last entry wins
 *         - approved: sticky (persists) unless rewound after it
 *         - rewound: clears both passage state AND approval
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

  // track latest passage state and approval per stone
  const latestByStone = new Map<string, PassageReport>();
  const approvedByStone = new Map<string, PassageReport>();

  for (const report of allReports) {
    if (report.status === 'approved') {
      // approved is sticky until rewound
      approvedByStone.set(report.stone, report);
    } else if (report.status === 'rewound') {
      // rewound clears approval
      approvedByStone.delete(report.stone);
      latestByStone.set(report.stone, report);
    } else {
      // other statuses: last entry wins
      latestByStone.set(report.stone, report);
    }
  }

  // combine: sticky approvals + latest passage state
  const results: PassageReport[] = [];

  // add sticky approvals first
  for (const report of approvedByStone.values()) {
    results.push(report);
  }

  // add latest passage states
  for (const report of latestByStone.values()) {
    results.push(report);
  }

  return results;
};
