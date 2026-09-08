import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import {
  getAllRouteGuardReviewPeerGivens,
  type RouteGuardReviewPeerGiven,
} from './getAllRouteGuardReviewPeerGivens';
import { getAllRouteGuardReviewPeersUncontemplated } from './getAllRouteGuardReviewPeersUncontemplated';
import { getAllRouteGuardReviewPeerTakenMetas } from './getAllRouteGuardReviewPeerTakenMetas';
import { getRouteGuardReviewPeerPathTaken } from './getRouteGuardReviewPeerPathTaken';

/**
 * .what = one uncontemplated reviewer, render-ready for the reply-prompt
 * .why = carries the tag (absent vs stale) + the two conversation paths + verdict
 */
export interface RouteGuardReviewPeerUncontemplated {
  slug: string;
  tag: 'absent' | 'stale';
  blockers: number;
  nitpicks: number;
  /** true when the counts are fabricated because no verdict could be read */
  unreadable: boolean;
  pathGiven: string;
  pathTaken: string;
}

/**
 * .what = enriches one uncontemplated slug with its given data + paired taken path
 * .why = pure transform from (slug, tag) + the givens to a render-ready record;
 *        keeps the find-and-shape out of the orchestrator narrative
 */
const asUncontemplatedReviewer = (input: {
  entry: { slug: string; tag: 'absent' | 'stale' };
  givens: RouteGuardReviewPeerGiven[];
}): RouteGuardReviewPeerUncontemplated => {
  const given = input.givens.find((g) => g.slug === input.entry.slug)!;
  return {
    slug: input.entry.slug,
    tag: input.entry.tag,
    blockers: given.blockers,
    nitpicks: given.nitpicks,
    unreadable: given.unreadable,
    pathGiven: given.pathGiven,
    pathTaken: getRouteGuardReviewPeerPathTaken({ pathGiven: given.pathGiven }),
  };
};

/**
 * .what = of the givens, keeps only those for the scoped slug (or all when unscoped)
 * .why = the single-slug path (--as contemplated --that <slug>) narrows readiness
 *        to one reviewer; a named narrow keeps the orchestrator narrative
 */
const getGivensForScope = (input: {
  givens: RouteGuardReviewPeerGiven[];
  scope?: { slug: string };
}): RouteGuardReviewPeerGiven[] =>
  input.scope
    ? input.givens.filter((given) => given.slug === input.scope?.slug)
    : input.givens;

/**
 * .what = why a scoped reviewer counts as ready — a response was recorded, or it
 *         had no blockers to answer
 * .why = a scoped-ready reviewer is ready for exactly one of two reasons, and the
 *        ack copy must tell the truth about which. it derives PURELY from the
 *        given already read: if the given carries blockers yet is ready, it can
 *        only be ready because a .taken paired it (else it would be uncontemplated),
 *        so 'responded'; otherwise there was no critique to answer, so 'no-blockers'.
 *        no second directory scan (r11 #1)
 */
const asScopedReadyReason = (input: {
  slug: string;
  givens: RouteGuardReviewPeerGiven[];
}): 'responded' | 'no-blockers' => {
  const given = input.givens.find((g) => g.slug === input.slug);
  return !given || given.blockers === 0 ? 'no-blockers' : 'responded';
};

/**
 * .what = THE shared readiness computation for the peer-review contemplation gate
 * .why = both the single-slug (--as contemplated --that <slug>) and the all-slug
 *        (passed/arrived/stophook) paths flow through ONE computation, so the
 *        latest-per-slug read and the given↔taken match cannot drift between the
 *        two. readiness has no hash scope at all.
 *
 * givens are the LATEST per reviewer across every hash. a taken answers the given
 * whose path DERIVES it. an optional slug scope narrows readiness to one reviewer
 * (--as contemplated --that <slug>).
 *
 * 🔴 a debt is keyed to the REVIEWER, never to the artifact hash. so an edit to the
 * code under review does not discharge it, and the cheapest exit from a blocker is
 * an answer rather than a one-line change.
 *
 * exactly TWO paths discharge a debt, and both require an actor:
 *   1. the driver answers — a .taken at the path that given derives
 *   2. a human overrules the level (getStoneGuardReviewPeerUncontemplatedUnforgiven)
 *
 * ⚠️ no path clears a debt on its own. a reviewer that speaks again with 0 blockers
 * supersedes its own prior blocker, but only after 1 or 2 unlocked the round: the
 * entrance gate in setStoneAsPassed is stone-level and returns BEFORE any reviewer
 * runs, so while a debt stands no reviewer speaks.
 *
 * ⇒ a stale given cannot be waited out. it is answered, or it is overruled.
 */
export const getRouteGuardReviewPeerContemplationStatus = async (input: {
  route: string;
  stone: RouteStone;
  scope?: { slug: string };
}): Promise<{
  ready: boolean;
  readyReason?: 'responded' | 'no-blockers';
  uncontemplated: RouteGuardReviewPeerUncontemplated[];
  /**
   * 🔴 every reviewer slug that has authored a given on this stone — reported BEFORE the
   * scope narrows, so it is the whole corpus rather than the scoped view.
   *
   * .why = `--as contemplated --that <slug>` must accept a RETIRED reviewer (absent from the
   *        live config by definition) while it still refuses a typo. that valid set is
   *        (configured ∪ spoken), and `spoken` is exactly what this operation already read.
   *        reported here so the caller derives it from the same read rather than a second
   *        full corpus scan of its own (r11 blocker.1 i004 for the single source; r11
   *        nitpick.1 i005 for the duplicated read).
   */
  slugsSpoken: string[];
}> => {
  // read both sides of the conversation via their communicators
  // .note = no hash is computed here. the debt is keyed to the reviewer, so the
  //         current hash is not an input to readiness at all
  const givens = await getAllRouteGuardReviewPeerGivens({
    route: input.route,
    stone: input.stone.name,
  });
  const takens = await getAllRouteGuardReviewPeerTakenMetas({
    route: input.route,
    stone: input.stone.name,
  });

  // narrow to one reviewer when a slug scope is supplied (single-slug path)
  const givensScoped = getGivensForScope({ givens, scope: input.scope });

  // the pure diff yields the uncontemplated slugs + their absent/stale tag
  const uncontemplatedRaw = getAllRouteGuardReviewPeersUncontemplated({
    givens: givensScoped,
    takens,
  });

  // enrich each uncontemplated slug with its given data for the reply-prompt
  const uncontemplated = uncontemplatedRaw.map((entry) =>
    asUncontemplatedReviewer({ entry, givens }),
  );

  const ready = uncontemplated.length === 0;

  // when scoped to one reviewer and ready, say WHY it is ready so the ack can
  // tell the truth (response recorded vs no critique to answer) — sourced from
  // the givens already read, no second directory scan (r11 #1)
  const readyReason =
    input.scope && ready
      ? asScopedReadyReason({ slug: input.scope.slug, givens: givensScoped })
      : undefined;

  // the whole-corpus slug set, taken from the UNSCOPED givens — sorted + deduped so the
  // "valid options" a caller lists are stable per machine rather than in glob order, which
  // is the filesystem's (rule.forbid.order-dependence)
  const slugsSpoken = [...new Set(givens.map((given) => given.slug))].sort();

  return { ready, readyReason, uncontemplated, slugsSpoken };
};
