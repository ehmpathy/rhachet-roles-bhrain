import type { FulcrumVerdictRow } from '@src/domain.objects/Driver/FulcrumVerdictRow';
import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

/**
 * .what = decides whether a stone's newest approval row follows every fulcrum verdict on the route
 * .why = a verdict ruled after an approval asks the human to approve once more (F6): the earlier
 *        approval never saw the repair a concession owes. so an approval stands as already on
 *        record only while no verdict follows it; else the human's re-approval is a new act
 *
 * .note = a verdict row's `after` is the passage-log length at the verdict, so an approval at an
 *         index at or past it was granted after the verdict
 */
export const isStoneApprovalAfterEveryVerdict = (input: {
  stone: string;
  reports: PassageReport[];
  rows: FulcrumVerdictRow[];
}): boolean => {
  const indexApproved = input.reports.reduce(
    (latest: number, report, index) =>
      report.stone === input.stone && report.status === 'approved'
        ? index
        : latest,
    -1,
  );
  const indexVerdictLatest = Math.max(0, ...input.rows.map((row) => row.after));
  return indexApproved >= indexVerdictLatest;
};
