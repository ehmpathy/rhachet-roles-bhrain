import { DomainLiteral } from 'domain-objects';

import type { RouteStoneGuardBlockerType } from './RouteStoneGuardBlockerReport';

/**
 * .what = a report of a stone's passage status in passage.jsonl
 * .why = consolidates all passage markers (passed, approved, blocked, rewound) into one file
 *
 * status values:
 * - 'passed': stone has passed all guards
 * - 'approved': stone has been approved
 * - 'blocked': stone is blocked from passage by a hard driver wall (--as blocked)
 * - 'exhausted': peer-review budget is spent; a human must approve or extend
 * - 'arrived': driver entered the guard's reviews — in flight (push)
 * - 'promised': driver promised a self-review — forward motion (push)
 * - 'absorbed': driver absorbed a peer review — forward motion (push)
 * - 'rewound': stone validation state has been cleared for fresh evaluation
 * - 'malfunction': reviewer or judge malfunctioned (exit code != 0 and != 2)
 * - 'overruled': human bypassed the review threshold for one review level
 * - 'disputed': driver declared ONE concern fine to continue; it leaves the judge's tally
 * - 'conceded': driver declared ONE concern correct and owes a fix; the hold stands
 *
 * .note = 'arrived', 'promised', and 'absorbed' are review-flow markers. they
 *         record forward motion so that a prior blocker clears (latest-entry-wins) —
 *         see rule.require.forward-motion-clears-blocker. 'arrived' is written on
 *         ENTRY to the guard (before the reviews run) so a stale halt clears at once,
 *         not after. they are NOT passage (only 'passed' is); their disposition is
 *         push (the machine's own review work).
 */
export interface PassageReport {
  /**
   * the stone this report is for
   */
  stone: string;

  /**
   * the passage status
   */
  status:
    | 'passed'
    | 'approved'
    | 'blocked'
    | 'exhausted'
    | 'arrived'
    | 'promised'
    | 'absorbed'
    | 'rewound'
    | 'malfunction'
    | 'overruled'
    | 'disputed'
    | 'conceded';

  /**
   * what blocks passage (only for status='blocked')
   */
  blocker?: RouteStoneGuardBlockerType;

  /**
   * the review level this report scopes to (only for status='overruled')
   *
   * .why = overrule is level-scoped: an overrule with level=N forgives the
   *        blockers of reviewers at level N only, so higher levels still run.
   * .note = absent on legacy overrule rows (pre-level-scope); absent treated
   *         as "all levels" for backward compatibility.
   */
  level?: number;

  /**
   * the peer reviewer this report scopes to (only for status='disputed' | 'conceded')
   *
   * .why = a stance is per-reviewer (F01): budget is a per-reviewer meter and the debt is
   *        reviewer-keyed, so a stone-level stance could not be checked at either grain.
   * .note = the SANITIZED slug form — the form the halt prompt prints and the form
   *         setStoneAsFeedbackAbsorbed validates (asSanitizedPeerReviewSlug.ts:17).
   */
  reviewer?: string;

  /**
   * the ONE concern this stance answers (only for status='disputed' | 'conceded')
   *
   * .why = a stance targets one concern, never a whole lane (S07). a lane-grained stance
   *        sheds every concern that lane raised, even the ones the driver never read
   *        (rule.forbid.suppression-of-undeclared-concerns).
   * .note = an ordinal WITHIN ONE given — `blocker.3`, `nitpick.4` (F020 fork A). a fresh
   *         given renumbers, so a stance is scoped to the given it answered (S08).
   */
  about?: string;

  /**
   * the reviewer given this stance answers (only for status='disputed' | 'conceded')
   *
   * 🔴 .why = invariant 3 — a stance is keyed to the slug's LATEST given, never to the
   *        artifact hash. so this records WHICH given it answered, and a stance lapses by
   *        construction: the lane speaks again, a new given lands, and the old stance no
   *        longer covers it. S03's per-generation lapse falls out rather than needs code.
   *
   * ⚠️ a HASH key would look equivalent and is not. the hash moves on any edit the stone's
   *    glob sees; the given moves only when THAT LANE speaks again. so a hash key would void
   *    a stance the reviewer never re-raised.
   */
  given?: string;

  /**
   * the fulcrum entry that argues this dispute (only for status='disputed')
   *
   * .why = a dispute is a guarantee to the council, so it must cite the argument a human
   *        will read. stored VERBATIM as the driver supplied it — a copy of an argument,
   *        which is the one shape that cannot drift from itself.
   * .note = the driver AUTHORS the entry; this command only resolves the path (F018).
   *         absent for 'conceded' — a concede claims no judgment, so it cites naught.
   */
  fulcrum?: string;

  /**
   * the severity a concession carries (only for status='conceded')
   *
   * .why = a review budget is a maintenance floor: spend at least the budget, and what
   *        remains is good enough and evolves later (F028, S14). the ONE exception is a
   *        defect that ships harm — security | safety | monetary | reputation | behavioral —
   *        which is what 'urgent' names. a budget hit with a live 'urgent' concession needs
   *        increased budget and warns the human; an all-'better' hit is good enough, no human.
   * .note = 'better' is the DEFAULT and the common case — code idealism, maintenance, polish,
   *         graded by the same harm test a blocker uses (rule.forbid.overzealous-blockers).
   *         'better' must NEVER earn increased budget. absent treated as 'better' (a legacy
   *         or ungraded concede is a 'better' one). absent for 'disputed'.
   */
  severity?: 'better' | 'urgent';

  /**
   * human-readable reason (optional)
   */
  reason?: string;
}

export class PassageReport
  extends DomainLiteral<PassageReport>
  implements PassageReport {}
