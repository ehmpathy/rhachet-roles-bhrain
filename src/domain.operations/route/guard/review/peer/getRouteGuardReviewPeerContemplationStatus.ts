import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { computeStoneReviewInputHash } from '../computeStoneReviewInputHash';
import {
  getAllRouteGuardReviewPeerGivensAtHash,
  type RouteGuardReviewPeerGiven,
} from './getAllRouteGuardReviewPeerGivensAtHash';
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
 *        hash-scope + stale-iteration logic cannot drift between the two (B2)
 *
 * givens are filtered to the CURRENT iteration hash so a stale prior-iteration
 * given can never block forever; a taken pairs a given by (slug, hash). an
 * optional slug scope narrows the readiness to one reviewer (--as contemplated).
 */
export const getRouteGuardReviewPeerContemplationStatus = async (input: {
  route: string;
  stone: RouteStone;
  scope?: { slug: string };
}): Promise<{
  ready: boolean;
  readyReason?: 'responded' | 'no-blockers';
  uncontemplated: RouteGuardReviewPeerUncontemplated[];
}> => {
  // the current-iteration hash — the generation the driver must contemplate
  const hashCurrent = await computeStoneReviewInputHash({
    stone: input.stone,
    route: input.route,
  });

  // read both sides of the conversation via their communicators
  const givens = await getAllRouteGuardReviewPeerGivensAtHash({
    route: input.route,
    stone: input.stone.name,
    hashCurrent,
  });
  const takens = await getAllRouteGuardReviewPeerTakenMetas({
    route: input.route,
    stone: input.stone.name,
  });

  // narrow to one reviewer when a slug scope is supplied (single-slug path)
  const givensScoped = getGivensForScope({ givens, scope: input.scope });

  // the pure diff yields the uncontemplated slugs + their absent/stale tag
  const uncontemplatedRaw = getAllRouteGuardReviewPeersUncontemplated({
    hashCurrent,
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

  return { ready, readyReason, uncontemplated };
};
