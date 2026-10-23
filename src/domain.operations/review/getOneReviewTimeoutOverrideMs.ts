import { asGuardPositiveInt } from '@src/domain.operations/asGuardPositiveInt';

/**
 * .what = the `RHACHET_REVIEW_TIMEOUT_MS` override, guarded, or null when unset
 * .why = two bounds read this one var — the subprocess bound in `runOneReview` and the
 *        brain-call bound of a direct review. it holds only what the human set: a wrapper
 *        hands its derived bound down through an internal var of its own
 *        (`ENV_OF_REVIEW_BRAIN_CALL_TIMEOUT_MS`), never through this one. each caller
 *        applies only its own default
 *
 * 🔴 .why a lazy getter, never a module-level const = `asGuardPositiveInt` THROWS on a
 *     malformed value. read at module load, a stray `export RHACHET_REVIEW_TIMEOUT_MS=`
 *     in a shell profile or CI would throw the moment ANY command imports a reader — a
 *     break in the whole cli/test graph, before an error could name the var. a getter
 *     defers the throw to the one review that reads it, loud and attributable
 *
 * 🔴 .why `asGuardPositiveInt`, never a bare `parseInt` = `parseInt` answers `NaN` for
 *     a typo, and a `NaN` bound never compares true, so a typo'd override made a review
 *     NEVER time out. `0` and a negative are refused too, since a zero bound reads to a
 *     driver as every reviewer malfunctioned at once. it shares one transformer with
 *     `concurrency:`, `budget:`, `level:`, and `RHACHET_LEVEL_CONCURRENCY`, so the
 *     strictness cannot drift between the knobs
 */
export const getOneReviewTimeoutOverrideMs = (): number | null =>
  process.env.RHACHET_REVIEW_TIMEOUT_MS !== undefined
    ? asGuardPositiveInt({
        raw: process.env.RHACHET_REVIEW_TIMEOUT_MS,
        key: 'timeout',
        at: 'env RHACHET_REVIEW_TIMEOUT_MS',
      })
    : null;
