import { UnexpectedCodePathError } from 'helpful-errors';

import type { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import type { RouteGuardReviewPeerGivenConstraint } from './asPeerGivenConstraint';
import {
  getAllRouteGuardReviewPeerGivens,
  type RouteGuardReviewPeerGiven,
} from './getAllRouteGuardReviewPeerGivens';
import { getAllRouteGuardReviewPeersFeedbackUnabsorbed } from './getAllRouteGuardReviewPeersFeedbackUnabsorbed';
import { getAllRouteGuardReviewPeerTakenMetas } from './getAllRouteGuardReviewPeerTakenMetas';
import { getAllSlugsSpoken } from './getAllSlugsSpoken';
import { getRouteGuardReviewPeerPathTaken } from './getRouteGuardReviewPeerPathTaken';

/**
 * .what = one feedbackUnabsorbed reviewer, render-ready for the reply-prompt
 * .why = carries the tag (absent vs stale) + the two conversation paths + verdict
 */
export interface RouteGuardReviewPeerFeedbackUnabsorbed {
  slug: string;
  tag: 'absent' | 'stale';
  blockers: number;
  nitpicks: number;
  /** true when the counts are fabricated because no verdict could be read */
  unreadable: boolean;
  /** the refusal an unreadable given names, or null where it is no refusal */
  constraint: RouteGuardReviewPeerGivenConstraint | null;
  pathGiven: string;
  pathTaken: string;
}

/**
 * .what = enriches one feedbackUnabsorbed slug with its given data + paired taken path
 * .why = pure transform from (slug, tag) + the givens to a render-ready record;
 *        keeps the find-and-shape out of the orchestrator narrative
 */
const asFeedbackUnabsorbedReviewer = (input: {
  entry: { slug: string; tag: 'absent' | 'stale' };
  givens: RouteGuardReviewPeerGiven[];
}): RouteGuardReviewPeerFeedbackUnabsorbed => {
  const given = input.givens.find((g) => g.slug === input.entry.slug);

  // the entry was DERIVED from these same givens one line up (asFeedbackUnabsorbedReviewer
  // is only ever called with the corpus its entry's slug was found in), so an absent
  // match here is not a legal input state — the two reads no longer agree. fail loud
  // with the slug in question rather than crash on `undefined.blockers` with no
  // context (r002 nitpick.2, i005; rule.forbid.maintenance-hazards)
  if (!given)
    throw new UnexpectedCodePathError(
      'feedbackUnabsorbed entry names a slug absent from its own givens corpus',
      { slug: input.entry.slug },
    );

  return {
    slug: input.entry.slug,
    tag: input.entry.tag,
    blockers: given.blockers,
    nitpicks: given.nitpicks,
    unreadable: given.unreadable,
    constraint: given.constraint,
    pathGiven: given.pathGiven,
    pathTaken: getRouteGuardReviewPeerPathTaken({ pathGiven: given.pathGiven }),
  };
};

/**
 * .what = of the givens, keeps only those for the scoped slug (or all when unscoped)
 * .why = the single-slug path (--as absorbed --that <slug>) narrows readiness
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
 * .what = why a scoped reviewer counts as ready — a response was recorded, it raised no
 *         concern at all, or it raised nitpicks that no .taken answers yet
 * .why = the ack copy must tell the truth about which. the gate holds only on blockers, so
 *        a nitpick-only lane is ready with or without an answer — but the REVIEWER weighs
 *        points, and re-raises each nitpick that carries no response. to reply "no response
 *        needed" there affirms the exact exit `rule.always.converge-with-reviewers.via-a-
 *        taken-per-point` forbids. derived from the givens and takens already read; no
 *        second directory scan (r11 #1)
 */
const asScopedReadyReason = (input: {
  slug: string;
  givens: RouteGuardReviewPeerGiven[];
  takens: { pathTaken: string }[];
}): 'responded' | 'no-concerns' | 'nitpicks-unanswered' => {
  // no given, or a given with naught in it, owes no answer
  const given = input.givens.find((g) => g.slug === input.slug);
  if (!given || (given.blockers === 0 && given.nitpicks === 0))
    return 'no-concerns';

  // a .taken at the path this given derives is an answer, whatever the counts
  const pathTaken = getRouteGuardReviewPeerPathTaken({
    pathGiven: given.pathGiven,
  });
  if (input.takens.some((taken) => taken.pathTaken === pathTaken))
    return 'responded';

  // ready with no answer is only possible with zero blockers, so nitpicks stand open
  return 'nitpicks-unanswered';
};

/**
 * .what = the .taken path the scoped reviewer's latest given derives, or null with no given
 * .why = an ack that says nitpicks stand unanswered must name WHERE the answer goes, so the
 *        driver copies one path rather than derives the grammar by hand
 */
const getOneScopedPathTaken = (input: {
  slug: string;
  givens: RouteGuardReviewPeerGiven[];
}): string | null => {
  const given = input.givens.find((g) => g.slug === input.slug);
  if (!given) return null;
  return getRouteGuardReviewPeerPathTaken({ pathGiven: given.pathGiven });
};

/**
 * .what = the scoped reviewer's ready reason and taken path — both absent unless the read
 *         is scoped to one reviewer AND that reviewer is ready
 * .why = names the one condition both fields share, so the orchestrator reads one claim
 *        rather than two copies of a two-term ternary (r006 nitpick.3, i013)
 */
const getOneScopedReadiness = (input: {
  scope?: { slug: string };
  ready: boolean;
  givens: RouteGuardReviewPeerGiven[];
  takens: { pathTaken: string }[];
}): {
  readyReason?: 'responded' | 'no-concerns' | 'nitpicks-unanswered';
  readyPathTaken?: string | null;
} => {
  // an unscoped read, or a reviewer still owed, carries neither field
  if (!input.scope || !input.ready) return {};

  // the scoped reviewer is ready — say why, and where its answer belongs
  return {
    readyReason: asScopedReadyReason({
      slug: input.scope.slug,
      givens: input.givens,
      takens: input.takens,
    }),
    readyPathTaken: getOneScopedPathTaken({
      slug: input.scope.slug,
      givens: input.givens,
    }),
  };
};

/**
 * .what = THE shared readiness computation for the peer-review feedbackAbsorption gate
 * .why = both the single-slug (--as absorbed --that <slug>) and the all-slug
 *        (passed/arrived/stophook) paths flow through ONE computation, so the
 *        latest-per-slug read and the given↔taken match cannot drift between the
 *        two. readiness has no hash scope at all.
 *
 * givens are the LATEST per reviewer across every hash. a taken answers the given
 * whose path DERIVES it. an optional slug scope narrows readiness to one reviewer
 * (--as absorbed --that <slug>).
 *
 * 🔴 a debt is keyed to the REVIEWER, never to the artifact hash. so an edit to the
 * code under review does not discharge it, and the cheapest exit from a blocker is
 * an answer rather than a one-line change.
 *
 * exactly TWO paths discharge a debt, and both require an actor:
 *   1. the driver answers — a .taken at the path that given derives
 *   2. a human overrules the level (getAllStoneGuardReviewPeerFeedbackUnabsorbedUnforgiven)
 *
 * 🟡 no path clears a debt on its own. a reviewer that speaks again with 0 blockers
 * supersedes its own prior blocker, but only after 1 or 2 unlocked the round: the
 * entrance gate in setStoneAsPassed is stone-level and returns BEFORE any reviewer
 * runs, so while a debt stands no reviewer speaks.
 *
 * ⇒ a stale given cannot be waited out. it is answered, or it is overruled.
 */
export const getOneRouteGuardReviewPeerFeedbackAbsorptionStatus =
  async (input: {
    route: string;
    stone: RouteStone;
    scope?: { slug: string };
  }): Promise<{
    ready: boolean;
    readyReason?: 'responded' | 'no-concerns' | 'nitpicks-unanswered';
    /** the .taken path the scoped reviewer's latest given derives — set only when scoped */
    readyPathTaken?: string | null;
    feedbackUnabsorbed: RouteGuardReviewPeerFeedbackUnabsorbed[];
    /**
     * 🔴 every reviewer slug that has authored a given on this stone — reported BEFORE the
     * scope narrows, so it is the whole corpus rather than the scoped view.
     *
     * .why = `--as absorbed --that <slug>` must accept a RETIRED reviewer (absent from the
     *        live config by definition) while it still refuses a typo. that valid set is
     *        (configured ∪ spoken), and `spoken` is exactly what this operation already read.
     *        reported here so the caller derives it from the same read rather than a second
     *        full corpus scan of its own.
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

    // the pure diff yields the feedbackUnabsorbed slugs + their absent/stale tag
    const feedbackUnabsorbedRaw = getAllRouteGuardReviewPeersFeedbackUnabsorbed(
      {
        givens: givensScoped,
        takens,
      },
    );

    // enrich each feedbackUnabsorbed slug with its given data for the reply-prompt
    const feedbackUnabsorbed = feedbackUnabsorbedRaw.map((entry) =>
      asFeedbackUnabsorbedReviewer({ entry, givens }),
    );

    const ready = feedbackUnabsorbed.length === 0;

    // when scoped to one reviewer and ready, say WHY it is ready so the ack can
    // tell the truth (response recorded vs no critique to answer), and name the path the
    // scoped answer belongs at — sourced from the givens already read (r11 #1)
    const { readyReason, readyPathTaken } = getOneScopedReadiness({
      scope: input.scope,
      ready,
      givens: givensScoped,
      takens,
    });

    // the whole-corpus slug set, taken from the UNSCOPED givens — sorted + deduped so the
    // "valid options" a caller lists are stable per machine rather than in glob order, which
    // is the filesystem's (rule.forbid.order-dependence)
    const slugsSpoken = getAllSlugsSpoken({ givens });

    return {
      ready,
      readyReason,
      readyPathTaken,
      feedbackUnabsorbed,
      slugsSpoken,
    };
  };
