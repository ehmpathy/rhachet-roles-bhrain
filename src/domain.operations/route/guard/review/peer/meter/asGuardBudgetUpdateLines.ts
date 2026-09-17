import { asMeterCountDisplay } from '../../../asMeterCountDisplay';

/**
 * the suffix on a budget line for a lane a DISPUTE has quieted.
 *
 * .why = `case=1` `[t4b]`: a driver who tops up a disputed lane on purpose must be told the lane
 *        does not run, "rather than a silent no-op" (rule.forbid.surprises). the rounds are real
 *        and they are not lost — under `S03` the skip lapses when the artifact next moves — so the
 *        line must say DEFERRED, never wasted.
 *
 * 🔴 .note = the scope word is `this generation`, and it is the same scope
 *        `formatGuardReviewerTree`'s `DISPUTED_NARRATIVE` states. the two surfaces phrase the fact
 *        differently on purpose (a tree detail line vs a suffix on an arithmetic), and they must
 *        never disagree on the SCOPE — `this stone` would overstate the skip by every generation
 *        after the next edit, which is the exact cost `F004` is graded on. pinned by a test that
 *        reads both constants.
 */
export const DISPUTED_UPDATE_SUFFIX =
  'disputed 🌙 — it does not run this generation; the rounds carry to the next';

/**
 * the line for a lane a dispute has quieted that this command did NOT touch.
 *
 * .why = `case=9` §2: a top-up lands on a stone that holds both a conceded lane and a disputed
 *        one, and "the same command re-arms the first and buys the second naught at all". if the
 *        emit reports only the lane it raised, "the driver is left to infer the architect's
 *        silence" — so the untouched lane is named in the SAME block.
 */
export const DISPUTED_UNTOUCHED_SUFFIX =
  'untouched — disputed 🌙, so it does not run this generation';

/**
 * .what = formats budget update entries as tree structure lines, with the dispute state of every
 *         lane this command touched OR left dark
 * .why = encapsulates treestruct output format for guard budget updates
 *
 * 🔴 .note = it renders TWO row kinds, and the second is the hard one. a lane the `--peer` filter
 *        skipped produces no update record at all, so it cannot be annotated — it must be ADDED.
 *        that is why `disputeSkippedSlugs` is a separate parameter rather than a field on the
 *        update: the rows it produces are for lanes that have no update to carry a field.
 *
 * .note = `updates[].peer` and `disputeSkippedSlugs` are both the CONFIG slug vocabulary — the
 *        first from the guard YAML's `- slug:` line, the second from `GuardPeerMeterStatus.slug`,
 *        which the guard parse produces. so they match directly. ⚠️ they would NOT match the
 *        sanitized form `--with` takes (`asSanitizedPeerReviewSlug` swaps a path separator for a
 *        hyphen), which is the `F16` hazard — do not feed a sanitized slug in here.
 */
export const asGuardBudgetUpdateLines = (input: {
  updates: Array<{
    peer: string;
    budgetBefore: number;
    budgetAfter: number;
  }>;
  /**
   * the slugs a dispute has taken out of this generation's round, from
   * `getDisputeSkippedReviewerSlugs`. required — an empty array is the explicit "none is quiet"
   * value (rule.forbid.undefined-inputs).
   */
  disputeSkippedSlugs: string[];
}): string[] => {
  const skipped = new Set(input.disputeSkippedSlugs);

  // the lanes this command raised, each annotated when a dispute has quieted it
  const raised = input.updates.map((update) => {
    const arithmetic = `${update.peer}: ${asMeterCountDisplay(update.budgetBefore)} → ${asMeterCountDisplay(update.budgetAfter)}`;
    return skipped.has(update.peer)
      ? `${arithmetic} — ${DISPUTED_UPDATE_SUFFIX}`
      : arithmetic;
  });

  // the lanes a dispute has quieted that this command did NOT raise. named here, in the same
  // block, so the driver never has to infer a lane's silence from its absence.
  // set of touched peers, so the dark filter is O(1) per lane.
  const updatedPeers = new Set(input.updates.map((update) => update.peer));
  const dark = input.disputeSkippedSlugs
    .filter((slug) => !updatedPeers.has(slug))
    .map((slug) => `${slug}: ${DISPUTED_UNTOUCHED_SUFFIX}`);

  const rows = [...raised, ...dark];
  return rows.map((row, i) => {
    const prefix = i === rows.length - 1 ? '      └─' : '      ├─';
    return `${prefix} ${row}`;
  });
};
