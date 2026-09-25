import type { PassageReport } from '@src/domain.objects/Driver/PassageReport';

/**
 * .what = the true chronologically-latest passage entry from an ALREADY-READ reports snapshot
 * .why = passage.jsonl is append-only, so the LAST line in raw file order is the drive's current
 *        state — the vision's `tail -1 passage.jsonl`. this names that fold ONCE, so a caller reads
 *        "the latest entry" as narrative, not the `.at(-1)` idiom inline in an orchestrator body
 *        (rule.forbid.inline-decode-friction). it is a PURE fold over reports in hand: the caller
 *        supplies the snapshot, so a single-read caller (stepRouteDrive reads passage.jsonl once,
 *        then derives every view) reuses its one read instead of a second file read that could
 *        observe a concurrent append and disagree (rule.forbid.behavior-hazards).
 *
 * .note = pairs with getLatestPassageForRoute, which reads the file THEN folds via this op — the
 *         one place the `.at(-1)` tail-read lives, shared by the file reader and the single-read
 *         orchestrator (rule.prefer.most-common-denominator).
 */
export const getLatestPassageFromReports = (input: {
  reports: PassageReport[];
}): PassageReport | null =>
  // the last entry in raw file order is the drive's true-latest state (tail -1)
  input.reports.at(-1) ?? null;
