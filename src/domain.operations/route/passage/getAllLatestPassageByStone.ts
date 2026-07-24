import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getAllPassageReportsRaw } from './getAllPassageReportsRaw';

/**
 * .what = the true chronologically-latest passage entry for EVERY stone (raw file order)
 * .why = the hook pre-check scans all stones for a hard-stop halt (malfunction / driver
 *        wall). it needs each stone's most recent state, and passage.jsonl is append-only,
 *        so the LAST line per stone is that state. this is the many-stone twin of
 *        getLatestPassageForStone — same raw-file-order guarantee, one row per stone.
 *
 * .note = this MUST read raw file order (getAllPassageReportsRaw), NOT getAllPassageReports.
 *         that op re-buckets its output (sticky approvals + overrules come out SEPARATELY
 *         from the latest-per-stone bucket), so a stone with `[malfunction, approved]` yields
 *         BOTH an `approved` row and a `malfunction` row — a scan would see a false
 *         malfunction halt after the human already approved. raw last-wins per stone avoids
 *         that by construction.
 */
export const getAllLatestPassageByStone = async (input: {
  route: string;
}): Promise<PassageReport[]> => {
  // read every entry in raw append order via the one shared parser
  const allReports = await getAllPassageReportsRaw({ route: input.route });

  // last-wins per stone, in raw file order (NO sticky re-bucket)
  const latestByStone = new Map<string, PassageReport>();
  for (const report of allReports) latestByStone.set(report.stone, report);

  return [...latestByStone.values()];
};
