import type { ReviewWarmerPlan } from './asReviewWarmerPlan';

/**
 * .what = the prompt prefix one lane now sends — the head of its system prompt, and
 *         the brain it is sent to
 * .why = a prompt cache keys on exactly this pair, so it is what a warmer keeps warm
 *        and what tells a warmer its work is still wanted
 *
 * .note = `head` is null where a run wrote no head digest; a null never proves a change
 *         (`isReviewLanePrefixSuperseded`)
 */
export interface ReviewWarmerPrefix {
  head: string | null;
  brain: string;
}

/**
 * .what = the watermark of one prefix's warmer — what it was asked to spend, who runs
 *         it, when it last poked, and when it next promises to wake
 * .why = every question a round or a warmer asks about another warmer is a question of
 *        STATE, answered here rather than by a held lock
 *        (rule.require.locks-via-with-simple-mutex):
 *
 *        | the question                         | the field             |
 *        |--------------------------------------|-----------------------|
 *        | is a warmer awake for this prefix?   | `endedAt`, `wakeBy`   |
 *        | which pid stops it?                  | `pid`                 |
 *        | what will it spend?                  | `plan`                |
 *        | did a peer warmer poke this window?  | `pokedAt`             |
 *
 * .note = instants are full iso stamps, read on the warmer's own clock. the record sits
 *         in the git-ignored `.agent/.cache/` tree, outside the route-artifact boundary
 *         rule.forbid.timestamps-in-route-artifacts governs; a cadence measured in
 *         minutes cannot be read off a date
 */
export interface ReviewWarmerRecord {
  /** the plan of the round that spawned this prefix's warmer */
  plan: ReviewWarmerPlan;
  /** the pid of the warmer that last beat — null until the child's first beat */
  pid: number | null;
  /** when the round spawned it */
  spawnedAt: string;
  /** the latest instant by which it promised its next beat */
  wakeBy: string;
  /** when any warmer of this prefix last poked it, or null where none has */
  pokedAt: string | null;
  /** when its warmer exited, or null while it runs */
  endedAt: string | null;
}
