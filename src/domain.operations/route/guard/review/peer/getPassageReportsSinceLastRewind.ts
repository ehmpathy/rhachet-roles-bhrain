import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

/**
 * .what = of one stone's passage reports, the ones appended AFTER its most recent rewind
 * .why = a rewind voids the round, so every declaration made within it is void too.
 *
 * 🔴 a stance keys to its given's PATH, and that key alone does NOT survive a rewind.
 *    `delStoneGuardArtifacts` deletes the givens; a re-run over an UNCHANGED artifact then
 *    re-mints the identical path — the hash is a function of the artifact set, and the
 *    iteration restarts at i001 once the prior review files are gone. so a rewound stance
 *    would silently re-attach to the fresh given, and the one undo the design offers a
 *    driver who regrets a dispute would quietly do naught (r10 b6).
 *
 * .note = the ledger is append-only and read in append order, so "after the last rewind"
 *         is a slice rather than a timestamp comparison. the rewound rows themselves stay
 *         in the ledger — a rewind voids a stance, it does not erase the record of one.
 */
export const getPassageReportsSinceLastRewind = (input: {
  /** one stone's reports, in append order */
  reports: PassageReport[];
}): PassageReport[] => {
  const indexRewoundLast = input.reports
    .map((report) => report.status)
    .lastIndexOf('rewound');

  // no rewind on record → every report stands
  if (indexRewoundLast === -1) return input.reports;

  return input.reports.slice(indexRewoundLast + 1);
};
