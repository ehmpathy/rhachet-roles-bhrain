import { BadRequestError } from 'helpful-errors';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import {
  getRouteGuardReviewPeerContemplationStatus,
  type RouteGuardReviewPeerUncontemplated,
} from '../guard/review/peer/getRouteGuardReviewPeerContemplationStatus';
import { formatRouteGuardReviewPeerContemplatePrompt } from '../guard/tree/formatRouteGuardReviewPeerContemplatePrompt';
import { setPassageReport } from '../passage/setPassageReport';
import { findOneStoneByPattern } from './asStoneGlob';
import { getAllStones } from './getAllStones';

/**
 * .what = the single uncontemplated reviewer in a single-slug-scoped status
 * .why = --as contemplated --that <slug> scopes readiness to one reviewer, so a
 *        not-ready status holds exactly one entry — a named accessor keeps the
 *        orchestrator narrative (no bare positional index)
 */
const getOneScopedUncontemplated = (input: {
  uncontemplated: RouteGuardReviewPeerUncontemplated[];
}): RouteGuardReviewPeerUncontemplated => input.uncontemplated[0]!;

/**
 * .what = sanitizes a peer slug the same way the guard does for filenames
 * .why = --that names the sanitized slug the driver saw in the reply-prompt;
 *        valid-slug validation must compare against that same sanitized form
 */
const asSanitizedSlug = (slug: string): string => slug.replace(/[/\\]/g, '-');

/**
 * .what = acknowledges one reviewer's contemplation, or guides the driver to it
 * .why = --as contemplated --that <slug> is the per-reviewer confirmation loop:
 *        it validates the named reviewer's .taken is present (the .taken IS the
 *        record), and emits crystal-clear guidance when it is absent or stale
 */
export const setStoneAsContemplated = async (input: {
  stone: string;
  route: string;
  slug: string;
}): Promise<{
  contemplated: boolean;
  emit: { stdout: string; stderr?: string } | null;
}> => {
  // find the stone
  const stones = await getAllStones({ route: input.route });
  const stoneMatched = findOneStoneByPattern({
    stones,
    pattern: input.stone,
  });
  if (!stoneMatched)
    throw new BadRequestError('stone not found', { stone: input.stone });

  // validate --that names a real peer reviewer (compare sanitized slugs)
  const peerReviews = stoneMatched.guard
    ? getGuardPeerReviews(stoneMatched.guard)
    : [];
  const validSlugs = peerReviews.map((r) => asSanitizedSlug(r.slug));
  if (!validSlugs.includes(input.slug))
    throw new BadRequestError(
      `invalid peer reviewer slug: "${input.slug}". valid options: ${validSlugs.join(', ')}`,
      { stone: input.stone, slug: input.slug, validSlugs },
    );

  // the shared readiness computation, scoped to this one reviewer (B2)
  const status = await getRouteGuardReviewPeerContemplationStatus({
    route: input.route,
    stone: stoneMatched,
    scope: { slug: input.slug },
  });

  // ready = the .taken is present, or the reviewer raised no blockers (clean /
  // nitpick-only). the ack must tell the truth about WHICH: the status reports
  // its own readyReason (sourced from the givens it already read), so do not
  // claim a response was recorded when the reviewer simply had no critique
  if (status.ready) {
    // record the forward motion in passage.jsonl so a prior blocker clears
    // .why = rule.require.forward-motion-clears-blocker — the latest entry wins, so
    //        this 'contemplated' status supersedes a stale escalation halt; its
    //        disposition is push (the machine's own peer-review reply), so the route
    //        keeps its own momentum
    await setPassageReport({
      report: new PassageReport({
        stone: stoneMatched.name,
        status: 'contemplated',
        reason: `contemplated review.peer: ${input.slug}`,
      }),
      route: input.route,
    });

    const tail =
      status.readyReason === 'responded'
        ? `   └─ your response is recorded — the reviewer will see it next round`
        : `   └─ this reviewer raised no blockers — no critique to answer, no response needed`;
    return {
      contemplated: true,
      emit: {
        stdout: [`🦉 contemplated: ${input.slug}`, tail].join('\n'),
      },
    };
  }

  // not ready — in single-slug scope exactly one reviewer is uncontemplated (the
  // scoped one); render its absent-or-stale guidance
  const reviewer = getOneScopedUncontemplated({
    uncontemplated: status.uncontemplated,
  });
  return {
    contemplated: false,
    emit: {
      stdout: formatRouteGuardReviewPeerContemplatePrompt({
        case: reviewer.tag,
        stone: stoneMatched.name,
        reviewer,
      }),
    },
  };
};
