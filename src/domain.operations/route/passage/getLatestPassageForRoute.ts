import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getAllPassageReportsRaw } from './getAllPassageReportsRaw';
import { getLatestPassageFromReports } from './getLatestPassageFromReports';

/**
 * .what = the true chronologically-latest passage entry across ALL stones (raw file order)
 * .why = passage.jsonl is append-only and the route advances one stone at a time, so the LAST
 *        line is the drive's current state — the vision's `tail -1 passage.jsonl`. this names
 *        that read once, so a caller reads "the latest entry" as narrative, not the `[len-1]`
 *        idiom inline (rule.forbid.inline-decode-friction). pairs with getLatestPassageForStone
 *        (which scopes to one stone); this scopes to the whole route.
 *
 * .note = MUST read raw file order (getAllPassageReportsRaw), NOT getAllPassageReports — that
 *         op re-buckets its output (sticky approvals first), so its last element is not the
 *         last write. raw file order is the true tail by construction. a single canonical
 *         reader also keeps r8.n4's "tail -1" intent honest: were getAllPassageReportsRaw to
 *         ever filter, "latest" changes in one place, not silently across callers.
 */
export const getLatestPassageForRoute = async (input: {
  route: string;
}): Promise<PassageReport | null> => {
  // read every entry in raw append order via the one shared parser
  const allReports = await getAllPassageReportsRaw({ route: input.route });

  // fold to the true-latest entry via the shared named tail-read (no `.at(-1)` idiom inline)
  return getLatestPassageFromReports({ reports: allReports });
};
