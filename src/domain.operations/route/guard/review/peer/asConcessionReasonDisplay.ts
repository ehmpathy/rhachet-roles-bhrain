import {
  isRouteGuardConcessionExhaustion,
  isRouteGuardUrgentConcessionExhaustion,
  REASON_TEXT_CONCESSION_BETTER,
  REASON_TEXT_CONCESSION_URGENT,
  WARN_TEXT_CONCESSION_URGENT,
} from './genRouteGuardExhaustedReason';

/**
 * .what = decodes a halt reason into the two display values a concession exhaustion needs
 * .why = the exhaustion reason carries a PARSEABLE marker phrase, not prose — it is meant to
 *        be decoded by the surface that renders it, never shown raw. four surfaces render this
 *        reason (formatRouteStoneEmit, formatGuardTree, formatRouteDriveBudgetExhausted, and the
 *        drive halts), and each used to decide the decode itself — or, in the emit + guard-tree
 *        case, skip it and print the marker verbatim. that is the two-homes drift hazard
 *        `rule.require.single-source-of-truth-for-render` exists to close: an urgent concession
 *        was invisible on the primary CLI surface (r011 blocker.1). this is the ONE decoder every
 *        surface calls, so the marker never reaches a driver and the urgent warn reaches every halt.
 *
 * @returns
 *   - `reasonText` — the human line to show in place of the raw reason. for a concession this is
 *     the friendly `REASON_TEXT_CONCESSION`; for any other halt it is the reason unchanged, so a
 *     caller may render `reasonText` unconditionally.
 *   - `warnText` — the urgent warn line, or null. present only for an urgent concession, where the
 *     stone owes more budget (`define.invariant.review.peer.budget.urgent-earns-budget`).
 *   - `isConcession` — true for EITHER severity. a caller that must branch its own layout on
 *     "did a concession cause this halt?" reads this rather than re-derives it from the marks.
 *     🔴 it is NOT the disposition: a `better` concession is the driver's own push while an
 *     `urgent` one is a human wait, so a surface that branches its HEADER and TAIL on the
 *     disposition keys on `isRouteGuardConcessionExhaustion` (better-only) and keys only its
 *     REASON LINE on this. `formatRouteDriveBudgetExhausted` conflated the two and printed
 *     `reason: peer reviewer budget exhausted` on an urgent halt, where the synchronous emit
 *     printed the concession words for the same persisted reason — one halt, two contradictory
 *     statements on two surfaces a driver meets consecutively (r1 b2).
 */
export const asConcessionReasonDisplay = (input: {
  reason: string | null;
}): {
  reasonText: string | null;
  warnText: string | null;
  isConcession: boolean;
} => {
  // 🔴 the two marks are DISJOINT by construction — `isRouteGuardConcessionExhaustion` matches
  //    the `better` mark ONLY, because it drives the push-vs-human-wait DISPOSITION (a better
  //    concession is the driver's own push; an urgent one is a human wait). but for DISPLAY,
  //    both severities ARE concessions, so both must shed the raw marker for the human line —
  //    else an urgent halt ships its parseable marker verbatim, which is the very defect this
  //    decoder closes. so the reason text keys on `better OR urgent`, the warn on urgent alone.
  const isUrgent = isRouteGuardUrgentConcessionExhaustion({
    reason: input.reason,
  });
  const isConcession =
    isRouteGuardConcessionExhaustion({ reason: input.reason }) || isUrgent;
  // 🔴 and the human line now SPLITS on that same severity, where the marker does not. the budget
  //    became a bound, so only an urgent concession earns the round its text names — a `better`
  //    halt that kept it would report a remedy the gate refuses, one line above a remedy block
  //    that correctly offers the fix instead (F04).
  //
  // 🟡 the three-way is an IIFE with early returns, never a chained ternary. `warnText` beside it
  //    stays a ternary because it is two-way, and a two-way ternary reads at a glance — a chained
  //    one does not, and `rule.forbid.else-branches` names the chained form as the hazard. the
  //    IIFE is the paved shape this repo already uses where a branch must produce a value.
  const reasonText = ((): string | null => {
    if (isUrgent) return REASON_TEXT_CONCESSION_URGENT;
    if (isConcession) return REASON_TEXT_CONCESSION_BETTER;
    return input.reason;
  })();
  return {
    reasonText,
    warnText: isUrgent ? WARN_TEXT_CONCESSION_URGENT : null,
    isConcession,
  };
};
