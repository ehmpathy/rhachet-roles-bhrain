/**
 * .what = every env var by which a review parent speaks to a child, in one table, each
 *         with its lifetime
 * .why = the three markers form one contract between a parent and the processes it
 *        spawns. declared apart, a reader had to piece the contract together from three
 *        docblocks, and whoever adds a fourth had no home for it and no stated rule for
 *        which lifetime it takes. each marker's own predicate still lives beside its
 *        reader (`isReviewSubprocess`, `isProgressSilenced`, `asReviewPrimeMeetFromEnv`)
 *
 * | marker           | it says                      | lifetime                                  |
 * |------------------|------------------------------|-------------------------------------------|
 * | `subprocess`     | "you are a review's child"   | INHERITED — set on every capture path, and|
 * |                  |                              | every descendant keeps it                 |
 * | `progressSilent` | "draw no live progress"      | INHERITED — set only on the buffered path,|
 * |                  |                              | since a streamed child must draw its own  |
 * | `primeMeet`      | "you were poured with peers" | CONSUMED — the pour sets or strips it per |
 * |                  |                              | child (`asEnvWithReviewPrimeMeet`), and   |
 * |                  |                              | the review cli deletes it on read, so no  |
 * |                  |                              | grandchild inherits a grant it never got  |
 *
 * .note = a new marker joins this table, and states which of the two lifetimes it takes.
 *         an inherited marker names a fact true of the whole subtree; a consumed one names
 *         a grant to one process alone
 *
 * .note = `progressSilent` keeps its historical value, `RHACHET_GUARD_CONTEXT`, so a
 *         guard and its child agree across one install
 */
export const ENV_OF_REVIEW_CHILD = {
  subprocess: 'RHACHET_REVIEW_SUBPROCESS',
  progressSilent: 'RHACHET_GUARD_CONTEXT',
  primeMeet: 'RHACHET_REVIEW_PRIME_MEET',
} as const;
