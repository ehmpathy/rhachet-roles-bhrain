/**
 * .what = the phrase that marks an exhaustion halt as a CONCESSION halt
 * .why = the reason string is the only channel the exhaustion halt has to the surfaces
 *        that render it — the disposition op is pure over the passage row, and the
 *        statusline fires every ~300ms, so neither may pay a route read. so the fact
 *        travels in the reason, and this constant is the ONE literal both ends share.
 *
 * 🔴 it is a PREFIX, deliberately. `computeBlockRemedyGroups` parses the slugs with
 *    `/budget exhausted:\s*(.+)/`, which takes all that follows the colon — so a
 *    concession phrase appended to the tail would be swallowed into the slug list and
 *    rendered as a `--peer` argument. ahead of the colon it costs that parse naught.
 */
export const REASON_MARK_CONCESSION =
  'concessions await the round that confirms them';

/**
 * .what = the phrase that marks an exhaustion halt as an URGENT concession halt
 * .why = the severity split (F028/S14). an all-`better` concession hit is the driver's own
 *        (the `better` mark above → push, no human). an `urgent` concession ships nameable
 *        harm, so it earns a human's glance and a round — a DIFFERENT halt, and it says so
 *        in its own mark. `define.invariant.review.peer.budget.urgent-earns-budget`.
 *
 * 🔴 it must be DISJOINT from `REASON_MARK_CONCESSION` — the `better` predicate matches on
 *    `.includes`, so an urgent mark that held the better phrase as a sub-part would falsely
 *    read as a push halt, which drops the human the invariant owes. they share no phrase.
 * 🔴 and, like the better mark, it is a PREFIX ahead of the `budget exhausted:` colon, so
 *    the `/budget exhausted:\s*(.+)/` slug parse never swallows it.
 */
export const REASON_MARK_CONCESSION_URGENT =
  'an urgent concession earned a round';

/**
 * .what = builds the reason an exhaustion halt persists
 * .why = `budget exhausted: <slugs>` is a parsed contract, not prose — three surfaces
 *        key off that phrase and one parses the slugs out of it. it was built inline
 *        at each write site, so a change had to land in every one of them by hand. this
 *        is the single builder (rule.require.single-source-of-truth-for-render).
 *
 * @param concession — the exhaustion kind (F028/S14):
 *        - `none`   — a lane the driver never conceded still awaits a human. the ordinary wait.
 *        - `better` — EVERY skipped lane carries a live `better` concession. the driver's own:
 *          the maintenance floor was met, so the stone proceeds with no human.
 *        - `urgent` — every lane conceded and ≥1 is `urgent`. needs increased budget, and a
 *          human is warned this PR (`define.invariant.review.peer.budget.urgent-earns-budget`).
 */
export const genRouteGuardExhaustedReason = (input: {
  slugs: string[];
  concession: 'none' | 'better' | 'urgent';
}): string => {
  const tail = `peer reviewer budget exhausted: ${input.slugs.join(', ')}`;
  if (input.concession === 'none') return tail;
  if (input.concession === 'urgent')
    return `${REASON_MARK_CONCESSION_URGENT}; ${tail}`;
  return `${REASON_MARK_CONCESSION}; ${tail}`;
};

/**
 * .what = whether an exhaustion halt is a BETTER concession halt — the driver's own (push)
 * .why = the one read of the better mark above. the disposition op and both drive surfaces
 *        call this rather than each carry the literal, so the write and the reads cannot drift.
 *
 * 🔴 it matches the `better` mark ONLY. an `urgent` concession is a human halt, so it must
 *    NOT read as this push case — the two marks are disjoint by construction.
 * .note = a null reason is NOT a concession halt. absence is not a claim — an exhausted
 *         status with no reason is the ordinary human wait it has always been.
 */
export const isRouteGuardConcessionExhaustion = (input: {
  reason: string | null | undefined;
}): boolean => (input.reason ?? '').includes(REASON_MARK_CONCESSION);

/**
 * .what = whether an exhaustion halt is an URGENT concession halt — a warned human wait
 * .why = the one read of the urgent mark. the emit surfaces call this to add the warn line
 *        that tells the human an urgent concession earned the round they must grant.
 */
export const isRouteGuardUrgentConcessionExhaustion = (input: {
  reason: string | null | undefined;
}): boolean => (input.reason ?? '').includes(REASON_MARK_CONCESSION_URGENT);

/**
 * .what = the reason line a CONCESSION exhaustion halt shows a driver, in place of the raw mark
 * .why = the raw reason carries the parseable `REASON_MARK_CONCESSION` phrase — a decode channel,
 *        not prose. every surface that renders a concession halt shows this human line instead, so
 *        the synchronous `--as passed` emit and the route.drive halt read as one story
 *        (rule.require.single-source-of-truth-for-render). one literal, shared.
 */
export const REASON_TEXT_CONCESSION =
  'you conceded — the round to confirm your fix needs more budget';

/**
 * .what = the warn line an URGENT concession halt adds — the human's cue that a grant is owed
 * .why = `severity: urgent` exists so a shipped-harm concession is never missed. the warn is the
 *        surface that makes the invariant real, so it must reach EVERY halt a driver sees — the
 *        synchronous emit as much as the route.drive halt, or the primary CLI path drops it
 *        (define.invariant.review.peer.budget.urgent-earns-budget). one literal, shared.
 */
export const WARN_TEXT_CONCESSION_URGENT = `an urgent concession stands — its harm ships if unfixed, so this round is owed a human's grant`;
