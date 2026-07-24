import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { getAllPassageReportsRaw } from './getAllPassageReportsRaw';

/**
 * .what = the true chronologically-latest passage entry for a stone (raw file order)
 * .why = passage.jsonl is append-only, so the LAST line for a stone is its most recent
 *        state. this is the single shared source the disposition + blocker reads use, so
 *        the "latest passage" concept has one correct home (rule.prefer.wet-over-dry, 3+
 *        call sites) rather than three divergent copies.
 *
 * .note = this MUST read raw file order (getAllPassageReportsRaw), NOT getAllPassageReports.
 *         that op re-buckets its output (sticky approvals first, then overrules, then
 *         latest-per-stone), so its array order is NOT write order once a sticky
 *         `approved`/`overruled` entry exists. a `.pop()` over its bucketed output returns
 *         the wrong entry for the approve-then-wait window: `[blocked(approval), approved]`
 *         on disk re-buckets to `[approved, blocked]`, whose last element is the stale
 *         `blocked` — so the statusline would ask `approved? 👋` after a human already
 *         approved. raw file order avoids that by construction and keeps
 *         forward-motion-clears-blocker honest for the `approved` flow the vision uses as
 *         its flagship example.
 */
export const getLatestPassageForStone = async (input: {
  stone: string;
  route: string;
}): Promise<PassageReport | null> => {
  // read every entry in raw append order via the one shared parser
  const allReports = await getAllPassageReportsRaw({ route: input.route });

  // the last entry for this stone in file order is its true-latest state
  const forStone = allReports.filter((report) => report.stone === input.stone);
  return forStone[forStone.length - 1] ?? null;
};
