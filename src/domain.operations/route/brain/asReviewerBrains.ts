import type { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';
import {
  getGuardPeerReviews,
  getReviewPeerRunCmd,
} from '@src/domain.objects/Driver/RouteStoneGuard';

import type { ReviewPeerBrainRead } from './asReviewPeerBrain';
import { asReviewPeerBrain } from './asReviewPeerBrain';

/**
 * .what = one row per peer reviewer — its slug, beside what its `run:` line says about its brain
 * .why = an intersection keeps the read's union arms intact; a loose `{ slug; brain; cause? }`
 *        would admit `{ brain: null }` with no cause, the state `ReviewPeerBrainRead` forbids
 */
export type ReviewerBrainRow = { slug: string } & ReviewPeerBrainRead;

/**
 * .what = each peer reviewer the guard declares, beside the brain its own `run:` line asks for
 * .why = `case=9` [t4] answers "what did i just buy?" at stone entry, which needs every
 *        reviewer's brain beside the driver's; named once, so `setStoneBrain` reads as one
 *        call (`rule.require.named-transformers`)
 *
 * .note = a `null` brain carries its CAUSE (declared none vs unreadable), so the type — not
 *         a comment — parts the two states
 * .note = PURE, and named `as*` for what it returns: it reshapes parsed reviewers, reads none
 */
export const asReviewerBrains = (input: {
  guard: RouteStoneGuard;
}): ReviewerBrainRow[] =>
  getGuardPeerReviews(input.guard).map((review) => ({
    slug: review.slug,
    // read `run:` via the declared accessor, as `runStoneGuardReviews` does
    // .note = SPREAD, never `brain: read.brain` — a pick would drop the cause arm
    ...asReviewPeerBrain({ run: getReviewPeerRunCmd(review) }),
  }));
