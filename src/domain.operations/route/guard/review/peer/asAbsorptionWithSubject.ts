import { ConstraintError } from 'helpful-errors';

import { asRouteStoneAbsorbCommand } from './asRouteStoneAbsorbCommand';
import { asRouteStoneSetCommandHead } from './asRouteStoneSetCommandHead';
import type { RouteGuardReviewPeerGiven } from './getAllRouteGuardReviewPeerGivens';

/**
 * .what = confirms a stance has a real subject: a readable concern on a lane that still
 *         counts toward the tally
 *
 * 🔴 it does NOT key on the verdict. EVERY concern is disputable regardless of the lane's
 *    reviewer status — approved, rejected, or exhausted alike. the `reviewed?` judge tallies
 *    nitpicks STONE-WIDE across every non-overruled lane, so an approved lane's nitpicks still
 *    count against the threshold. if only a rejected lane were disputable, the driver would hold
 *    no lever to shed an approved lane's concern from a tally it pushes over the floor — and a
 *    stone with many small-nitpick lanes could never pass. so a stance is the driver's per-concern
 *    tally-exclusion, at every lane that counts (a fundamental invariant, 2026-09-15).
 *
 * ⚠️ OWED and PERMITTED differ, and this guard is the PERMITTED half. the entrance gate
 *    (getAllStoneUndeclaredConcerns) still DEMANDS a stance only where the verdict rejects — a
 *    driver is never forced to declare on an approved lane. but they MAY, and this is where that
 *    is allowed. the two operations answer two questions, so they no longer share the approved
 *    check.
 *
 * .the three refusals that remain, none of which is a reviewer verdict:
 *
 * 🔴 a FORGIVEN level: a human already lifted that gate, and `getAllNonOverruledReviewFiles` drops
 *    its files from the tally — so its concerns count naught, and there is naught to shed.
 *
 * 🔴 NO given: the reviewer never spoke, so there is no concern to name.
 *
 * 🔴 an UNREADABLE given: it carries no verdict at all, only a fabricated count. a malfunction is
 *    a broken PROCESS, answered by a RE-RUN, never a stance
 *    (rule.always.diagnose-reviewer-malfunctions). the entrance gate skips it for the same reason,
 *    so the two gates agree (F030).
 *
 * 🔴 it RETURNS the narrowed subject, never `void`: past a bare `if (!given) throw` the compiler
 *    cannot see the throw guarantees a subject, so a caller leans on `given!` at every later read
 *    — an ad-hoc cast a reordered call would silently keep valid. so this yields the non-null
 *    given (the `type-fns` `.assure` shape — throw, or return the narrowed value), and the caller
 *    reads that return instead of the nullable local (rule.require.assure-via-type-checks,
 *    rule.forbid.as-cast).
 */
export const asAbsorptionWithSubject = (input: {
  given: RouteGuardReviewPeerGiven | null | undefined;
  slug: string;
  isLevelForgiven: boolean;
}): RouteGuardReviewPeerGiven => {
  const { given } = input;
  if (input.isLevelForgiven)
    throw new ConstraintError(
      [
        `${input.slug}'s level is already forgiven; there is no verdict to dispute`,
        ``,
        `a human lifted that gate, so its concerns no longer count toward the tally.`,
        `naught is owed here — drive on; no stance is needed.`,
      ].join('\n'),
    );

  if (!given)
    throw new ConstraintError(
      [
        `${input.slug} has not spoken on this stone, so there is no concern to take a stance on`,
        ``,
        `re-arrive so the reviewer runs, then take a stance on what it raises:`,
        `  ${asRouteStoneSetCommandHead({ stone: '<stone>' })} --as arrived`,
      ].join('\n'),
    );

  // 🔴 an unreadable given carries a FABRICATED count, never a verdict — no numeric count was
  //    readable, so `contract.reviewer-output` scored it 1 blocker to gate. a stance judges a
  //    real concern, and a malfunction has none. its remedy is a RE-RUN, never a stance
  //    (rule.always.diagnose-reviewer-malfunctions). the entrance gate skips it for the same
  //    reason (getAllStoneUndeclaredConcerns), so the two gates agree — a driver cannot declare a
  //    stance the entrance gate never owed (F030).
  // 🔴 a REFUSED given is unreadable too, but it is no malfunction: it names its cause and its
  //    lever, and a re-run returns the same refusal. so it says so, and names the path that
  //    discharges it — spend the lever, write the .taken, absorb (rule.require.errors-name-the-fix)
  if (given.unreadable && given.constraint)
    throw new ConstraintError(
      [
        `${input.slug} refused to run (✋ ${given.constraint.cause}); there is no verdict to take a stance on`,
        ``,
        `a refusal is a constraint, never a rejection: it raised no concern to concede or dispute.`,
        `spend the lever its .given names, write its .taken, then absorb it:`,
        `  ${asRouteStoneAbsorbCommand({ stone: '<stone>', that: input.slug }).command}`,
      ].join('\n'),
    );
  if (given.unreadable)
    throw new ConstraintError(
      [
        `${input.slug} malfunctioned; there is no verdict to take a stance on`,
        ``,
        `no numeric count was readable, so this is a broken PROCESS, never a rejection.`,
        `diagnose why the reviewer could not render, fix it, then re-arrive so it re-runs.`,
        `a stance skips or claims a verdict that does not exist.`,
      ].join('\n'),
    );

  // every gate passed — `given` is narrowed to non-null by the throws above, so hand it back
  // as the subject the caller reads (no `given!` downstream). an approved lane reaches here on
  // purpose: its concerns count toward the stone-wide tally, so they must be disputable
  return given;
};
