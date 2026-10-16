import { HEADLINE_OF_REVIEW_OVERFLOW } from '@src/domain.operations/review/ReviewOverflowRefusedError';

/**
 * .what = the refusal a constrained peer given names — its cause, and the partitions its lever
 *         proposes, if any
 * .why = a reviewer that REFUSED (exit 2, no verdict) left no count to read, so its given reads as
 *        unreadable. but a refusal is not a malfunction: it names its own cause and its own lever,
 *        and the driver's next move is to spend that lever. the surfaces that halt on such a given
 *        must say so, so they read the refusal here, once (rule.require.errors-name-the-fix)
 */
export interface RouteGuardReviewPeerGivenConstraint {
  /** the headline of the refusal — e.g. `prompt exceeds 75% of context window` */
  cause: string;
  /**
   * whether the refusal was an overflow — the one refusal a partition or a narrower bind
   * cures. an unknown flag or an absent rubric is refused too, and a partition fixes neither
   */
  overflowed: boolean;
  /** the `--partition` values the refusal's lever proposes; empty where it proposes none */
  partitions: string[];
}

/**
 * .what = reads the refusal out of an unreadable given's content, or null where it holds none
 * .why = every refusal this repo throws prints `✋ ConstraintError: <cause>`, and the overflow
 *        refusal prints one `--partition '<slug>=<globs>'` line per partition its lever proposes
 *
 * .note = a given with a readable verdict is never a refusal, so the caller passes only an
 *         unreadable one; a placeholder `--partition '<slug>=<globs>'` is a template, never a
 *         proposal, so it is dropped
 */
export const asPeerGivenConstraint = (input: {
  content: string;
}): RouteGuardReviewPeerGivenConstraint | null => {
  // a given with no refusal headline is a malfunction, never a constraint
  const cause = /ConstraintError: ([^\n]+)/.exec(input.content)?.[1]?.trim();
  if (!cause) return null;

  // the partitions the lever proposes, in the order it prints them, once each
  const partitions = [
    ...new Set(
      [...input.content.matchAll(/--partition '([^']+)'/g)]
        .map((match) => match[1] ?? '')
        .filter((value) => value.length > 0 && !value.startsWith('<')),
    ),
  ];
  // an overflow is told apart by the one headline its writer prints
  const overflowed = cause.startsWith(HEADLINE_OF_REVIEW_OVERFLOW);

  return { cause, overflowed, partitions };
};
