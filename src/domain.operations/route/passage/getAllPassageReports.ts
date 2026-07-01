import * as fs from 'fs/promises';
import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { compareStonePrefix } from '../stones/compareStonePrefix';
import { getStoneOrderPrefixFromName } from '../stones/computeStoneOrderPrefix';

/**
 * .what = reads current passage state per stone from passage.jsonl
 * .why = enables current passage state lookup
 *
 * .note = passage.jsonl is append-only with specific deduplication rules:
 *         - passage states (passed/blocked/malfunction): last entry wins
 *         - approved: sticky (persists) unless rewound after it
 *         - overruled: sticky per (stone, level), persists unless rewound after it
 *         - rewound: clears approvals AND overrules for this stone AND all later
 *           stones (cross-stone invalidation)
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

  // track latest passage state, sticky approvals, and sticky overrules
  const latestByStone = new Map<string, PassageReport>();
  const approvedByStone = new Map<string, PassageReport>();
  // overrules are sticky per (stone, level) so multiple levels can be overruled
  // .why = level-scoped overrule: l1 overrule must survive a later l3 block/pass
  const overruledByKey = new Map<string, PassageReport>();
  const overruledKey = (report: PassageReport): string =>
    `${report.stone}::${report.level ?? 'all'}`;

  for (const report of allReports) {
    if (report.status === 'approved') {
      // approved is sticky until rewound
      approvedByStone.set(report.stone, report);
    } else if (report.status === 'overruled') {
      // overruled is sticky per (stone, level) until rewound
      overruledByKey.set(overruledKey(report), report);
    } else if (report.status === 'rewound') {
      // rewound clears approvals AND overrules for this stone and all later stones
      const rewoundPrefix = getStoneOrderPrefixFromName(report.stone);
      for (const [stoneName] of approvedByStone) {
        const stonePrefix = getStoneOrderPrefixFromName(stoneName);
        if (compareStonePrefix({ a: rewoundPrefix, b: stonePrefix }) <= 0) {
          approvedByStone.delete(stoneName);
        }
      }
      for (const [key, overrule] of overruledByKey) {
        const stonePrefix = getStoneOrderPrefixFromName(overrule.stone);
        if (compareStonePrefix({ a: rewoundPrefix, b: stonePrefix }) <= 0) {
          overruledByKey.delete(key);
        }
      }
      latestByStone.set(report.stone, report);
    } else {
      // other statuses: last entry wins
      latestByStone.set(report.stone, report);
    }
  }

  // combine: sticky approvals + sticky overrules + latest passage state
  const results: PassageReport[] = [];

  // add sticky approvals first
  for (const report of approvedByStone.values()) {
    results.push(report);
  }

  // add sticky overrules
  for (const report of overruledByKey.values()) {
    results.push(report);
  }

  // add latest passage states
  for (const report of latestByStone.values()) {
    results.push(report);
  }

  return results;
};
