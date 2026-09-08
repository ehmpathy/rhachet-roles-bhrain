import { BadRequestError } from 'helpful-errors';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import { getGuardPeerReviews } from '@src/domain.objects/Driver/RouteStoneGuard';

import { getRepoRootWithFallback } from '../guard/getRepoRootWithFallback';
import { asSanitizedPeerReviewSlug } from '../guard/review/peer/asSanitizedPeerReviewSlug';
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

  // the shared readiness computation, scoped to this one reviewer (B2). it also reports
  // every slug that has SPOKEN on this stone, which the validity check below reads
  const status = await getRouteGuardReviewPeerContemplationStatus({
    route: input.route,
    stone: stoneMatched,
    scope: { slug: input.slug },
  });

  // validate --that names a real peer reviewer (compare sanitized slugs)
  //
  // 🔴 the valid set is the live config UNION every reviewer that has actually spoken —
  //    never the config alone. a RETIRED reviewer is absent from the config by definition
  //    (that is what `retired` MEANS), and the halt prompt names it and prints this exact
  //    command for it. a config-only check therefore rejects the one move the prompt just
  //    instructed, with `invalid peer reviewer slug` — so the guard refuses its own
  //    guidance, on the reviewer whose copy exists to make it legible (r10 blocker.1, i004).
  //
  // ⚠️ the union does NOT weaken the typo guard, which is what this check is for: a
  //    mistyped slug names no configured reviewer AND has authored no given, so it still
  //    throws, and the listed options now name every slug the driver could legitimately
  //    pass rather than only the subset that still runs.
  //
  // .note = this runs AFTER the status rather than before, so the spoken half comes from
  //         the read the status already did — one full corpus read per invocation rather
  //         than two (r11 nitpick.1, i005). the throw still precedes every USE of the
  //         status, so an invalid slug is rejected exactly as before; the only difference
  //         is one wasted read on the typo path, which is the rare one
  const peerReviews = stoneMatched.guard
    ? getGuardPeerReviews(stoneMatched.guard)
    : [];
  // .note = the sanitize is the WRITE side's grammar, so it is reached for, never
  //         re-typed — `--that <slug>` names the sanitized form the prompt printed
  const slugsConfigured = peerReviews.map((r) =>
    asSanitizedPeerReviewSlug({ slug: r.slug }),
  );
  const validSlugs = [
    ...new Set([...slugsConfigured, ...status.slugsSpoken]),
  ].sort();
  if (!validSlugs.includes(input.slug))
    throw new BadRequestError(
      `invalid peer reviewer slug: "${input.slug}". valid options: ${validSlugs.join(', ')}`,
      { stone: input.stone, slug: input.slug, validSlugs },
    );

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

  // .note = read HERE rather than at the top, so the ready path — the common one —
  //         pays no git subprocess. only a halt prints a path, so only a halt needs
  //         the root to print it against
  const root = await getRepoRootWithFallback({ from: input.route });

  return {
    contemplated: false,
    emit: {
      stdout: formatRouteGuardReviewPeerContemplatePrompt({
        case: reviewer.tag,
        stone: stoneMatched.name,
        root,
        reviewer,
      }),
    },
  };
};
