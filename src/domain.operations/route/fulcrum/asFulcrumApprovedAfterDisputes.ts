import * as path from 'path';

import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

import { asFulcrumCaseFromFileName } from './asFulcrumCaseFromFileName';

/**
 * .what = for each case a dispute cites or a verdict row rules, the first stone a human approved
 *         AFTER both the newest dispute that cites it and the verdict on it — or null while no
 *         approval has followed
 * .why = a conceded verdict needs an end state, and the passage log gives one in order. the halt
 *        that carried a concession asks the human to approve only once the repair lands, so once
 *        an approval follows the verdict, "repair owed" no longer prints at every later gate. the
 *        fold proves an approval followed, never that a repair landed; the line says exactly that
 *
 * .note = `afterOf` maps a case to the passage-log index its verdict row recorded; an approval at
 *         a lower index was given before the verdict, so it never answers it. every case in
 *         `afterOf` is seeded, so a verdict whose dispute a rewind retired still owes, and can
 *         still be answered — the debt and its answer share one key space (r011 i008 blocker.2)
 * .note = a newer dispute on the same case resets the answer, since that dispute has not yet met
 *         a human. a `rewound` row voids every answer found so far, but keeps each case: a rewind
 *         can void the approval that answered, so the human is asked again, and any approval
 *         after the rewind answers
 */
export const asFulcrumApprovedAfterDisputes = (input: {
  reports: PassageReport[];
  afterOf: Map<string, number>;
}): Map<string, string | null> =>
  input.reports.reduce(
    (approved: Map<string, string | null>, report, index) => {
      // a rewind voids every answer so far; each case stays, so a later approval can answer it
      if (report.status === 'rewound')
        return new Map([...approved.keys()].map((key) => [key, null]));

      // a dispute that cites a fulcrum opens (or re-opens) its case
      if (report.status === 'disputed' && report.fulcrum) {
        const name = path.basename(report.fulcrum);
        const key = asFulcrumCaseFromFileName({ name })?.slug ?? name;
        return new Map(approved).set(key, null);
      }

      // an approval answers every open case whose verdict it follows
      if (report.status === 'approved')
        return new Map(
          [...approved].map(([key, stone]) => [
            key,
            stone ??
              (index >= (input.afterOf.get(key) ?? 0) ? report.stone : null),
          ]),
        );
      return approved;
    },
    new Map([...input.afterOf.keys()].map((key) => [key, null])),
  );
