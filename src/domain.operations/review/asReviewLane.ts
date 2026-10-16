import * as path from 'path';

/**
 * .what = one review lane — the reviewer slug, the prompt head, and the brain it ran
 *         with, within the log root its runs land in
 * .why = a lane is the unit a prompt cache is shared over, and a cached prefix is the
 *        model plus the system prompt. the head is the system prompt, and the system
 *        prompt is the affinity key (rule.require.name-the-shared-prefix-as-the-cache-anchor);
 *        the brain names the model tier the run asked for — so two runs can share a
 *        prefix only where they share a slug, a head, AND a brain. a slug whose rubric, briefs,
 *        or focus changed has a new head, and so a new prefix: it starts a new lane. the
 *        log root is part of the lane because two worktrees of one repo share slug
 *        names, and the grove fold reads them all.
 *
 * 🔴 .note = a shared lane is NECESSARY for a shared cache, never SUFFICIENT. a brain
 *     slug names a tier, not a host: a router brain (`openrouter/*`) walks its hosts
 *     cheapest-first per ask and skips one that throttled or replied badly, and a
 *     cache lives on the host that served. so two runs of one lane — or a round and
 *     the prime poke before it — can land on two hosts and share naught. the slug
 *     is the finest key this repo can read; no artifact records which host served
 *     (research.review-cost-and-cache). every lane fold reads its warm/cold figures
 *     as the BEST case a host pin would reach
 *
 * .note = route and stone are NOT part of the lane. they ride in the user message,
 *         behind the cached prefix, so a slug that moves to the next stone with the
 *         same head keeps its warm prefix — and its ordinal
 */
export interface ReviewLane {
  /** the dir the lane's run dirs sit in — `<cwd>/.log/bhrain/review` */
  root: string;
  /** the reviewer slug the lane runs as */
  slug: string;
  /**
   * the content digest of the prompt head (`getOneReviewRunHead`) — null where the run
   * wrote no head. null pairs only with null, so a run with no head on record never
   * joins a lane whose prefix it cannot be shown to share
   */
  head: string | null;
  /**
   * the brain slug the run rode on — null where the run recorded none. a different
   * brain can never share a cache, so it is a different lane; one brain may still
   * span hosts (see the note above). null pairs only with null, for the same reason
   * a null head does
   */
  brain: string | null;
}

/**
 * .what = the lane a review run belongs to, or null where it has no guard identity
 * .why = the one definition every lane fold reads, so no two folds can disagree on
 *        which runs share a prefix
 *
 * .note = a run with no identity is in no lane. a fold that must still bucket it (the
 *         ordinal) names that bucket itself
 */
export const asReviewLane = (input: {
  run: {
    dir: string;
    identity: { slug: string } | null;
    head: string | null;
    brain: string | null;
  };
}): ReviewLane | null =>
  input.run.identity
    ? {
        root: path.dirname(input.run.dir),
        slug: input.run.identity.slug,
        head: input.run.head,
        brain: input.run.brain,
      }
    : null;
