import * as fs from 'fs/promises';
import * as path from 'path';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';

/**
 * .what = every passage entry from passage.jsonl, in raw append (file) order
 * .why = passage.jsonl is append-only; the raw sequence of entries is the one true
 *        substrate every passage read builds on. this is the single shared parser
 *        (fs.access → fs.readFile → split → JSON.parse → PassageReport) that
 *        getLatestPassageForStone, getAllLatestPassageByStone, and getAllPassageReports
 *        all consume — so a change to the encode format, corrupt-line rules, or the parse
 *        shape lands in ONE place, not three that drift apart (rule.prefer.wet-over-dry,
 *        3+ call sites; rule.forbid.maintenance-hazards).
 *
 * .note = this returns entries VERBATIM in write order — NO dedup, NO sticky re-bucket.
 *         callers apply their own reduction: last-per-stone (raw), latest-for-one-stone
 *         (raw), or the sticky approval/overrule re-bucket (getAllPassageReports).
 */
export const getAllPassageReportsRaw = async (input: {
  route: string;
}): Promise<PassageReport[]> => {
  const passagePath = path.join(input.route, '.route', 'passage.jsonl');

  // no file → no passage yet
  const fileFound = await fs
    .access(passagePath)
    .then(() => true)
    .catch(() => false);
  if (!fileFound) return [];

  // parse every entry in raw append order (last line = most recent write)
  const content = await fs.readFile(passagePath, 'utf-8');
  return content
    .split('\n')
    .filter(Boolean)
    .map((line) => new PassageReport(JSON.parse(line)));
};
