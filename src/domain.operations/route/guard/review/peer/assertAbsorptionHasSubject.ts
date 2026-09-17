import { BadRequestError } from 'helpful-errors';

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
 *    (getStoneUndeclaredConcerns) still DEMANDS a stance only where the verdict rejects — a
 *    driver is never forced to declare on an approved lane. but they MAY, and this is where that
 *    is allowed. the two operations answer two questions, so they no longer share the approved
 *    check.
 *
 * .the three refusals that remain, none of which is a reviewer verdict:
 *
 * 🔴 a FORGIVEN level: a human already lifted that gate, and `getNonOverruledReviewFiles` drops
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
export const assertAbsorptionHasSubject = (
  given: RouteGuardReviewPeerGiven | null | undefined,
  context: {
    slug: string;
    isLevelForgiven: boolean;
  },
): RouteGuardReviewPeerGiven => {
  if (context.isLevelForgiven)
    throw new BadRequestError(
      [
        `${context.slug}'s level is already forgiven; there is no verdict to dispute`,
        ``,
        `a human lifted that gate, so its concerns no longer count toward the tally.`,
      ].join('\n'),
      { slug: context.slug, reason: 'forgiven' },
    );

  if (!given)
    throw new BadRequestError(
      `${context.slug} has not spoken on this stone, so there is no concern to take a stance on`,
      { slug: context.slug, reason: 'no-given' },
    );

  // 🔴 an unreadable given carries a FABRICATED count, never a verdict — no numeric count was
  //    readable, so `contract.reviewer-output` scored it 1 blocker to gate. a stance judges a
  //    real concern, and a malfunction has none. its remedy is a RE-RUN, never a stance
  //    (rule.always.diagnose-reviewer-malfunctions). the entrance gate skips it for the same
  //    reason (getStoneUndeclaredConcerns), so the two gates agree — a driver cannot declare a
  //    stance the entrance gate never owed (F030).
  if (given.unreadable)
    throw new BadRequestError(
      [
        `${context.slug} malfunctioned; there is no verdict to take a stance on`,
        ``,
        `no numeric count was readable, so this is a broken PROCESS, never a rejection.`,
        `diagnose why the reviewer could not render, fix it, then re-arrive so it re-runs.`,
        `a stance skips or claims a verdict that does not exist.`,
      ].join('\n'),
      { slug: context.slug, reason: 'unreadable' },
    );

  // every gate passed — `given` is narrowed to non-null by the throws above, so hand it back
  // as the subject the caller reads (no `given!` downstream). an approved lane reaches here on
  // purpose: its concerns count toward the stone-wide tally, so they must be disputable
  return given;
};
