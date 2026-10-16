import type { AttributionGrade } from '@src/domain.objects/Reviewer/AttributionGrade';

/**
 * .what = the share above which the residual can no longer be vouched for
 * .why = measured: a realistic prompt's tags and headers run ~1%. a tenth of the
 *        prompt is far past that, so the census stops to claim the rows are whole.
 *
 * .note = 🔴 a HEURISTIC, not a derived law — 10× headroom over the measured
 *         overhead. it is stated here rather than inferred, so a reader weighs
 *         the grade at its true strength rather than at an invariant's. that is
 *         precisely why it GRADES rather than refuses (`getOneAttributionGrade`).
 */
export const BOUND_OF_MARKUP_SHARE = 0.1;

/**
 * .what = the prompt size below which the markup SHARE carries no signal
 * .why = 🔴 the same law the cache rate already follows: a rate over a tiny
 *        denominator is noise, never a measurement. a real review prompt always
 *        carries its instruction preamble and its output contract — thousands of
 *        chars before one rule or target is added — so no prompt under this floor
 *        was ever sent to a brain.
 *
 *        without the floor the check reads a 200-char fixture whose markup is
 *        `'head' + 'tail'` as 100% unattributed, which is arithmetically true and
 *        says naught about coverage.
 */
export const FLOOR_OF_MEASURABLE_CHARS = 1_000;

/**
 * .what = the mass below which a residual cannot BE an unattributed input
 * .why = 🔴 the share alone is not the discriminator, and a real compiled prompt
 *        proved it. markup scales with the NUMBER of blocks rendered — a tag, a
 *        header, and a `---` per block — while an unattributed INPUT scales with
 *        the corpus. so a lane whose supplies are tiny reads a high share off
 *        constant decoration.
 *
 *        measured 2026-09-21, `compileReviewPrompt.test.ts [case-conversation]`:
 *        a genuinely compiled prompt, 5,276 chars, whose rubric is 6 chars and
 *        whose target is 4. its 789 chars of markup are real tags around five
 *        real blocks — and they read as 15.0%, over a 10% bound.
 *
 * .note = 🟡 this floor bounds the SMALL end only, and it cannot bound the large
 *         one — see `.the hazard a floor cannot reach` on `getOneAttributionGrade`.
 */
export const FLOOR_OF_ATTRIBUTABLE_CHARS = 2_000;

/**
 * .what = grades a non-negative markup residual against its prompt, by the shared bound
 * .why = ONE home for the floors and the bound, so the compiled lane and the re-parse
 *        lane (`asPromptSectionChars`) grade their residual by the same law. a second
 *        copy of the thresholds would let the two lanes vouch for the same prompt
 *        differently (rule.require.distinguish-every-review-input).
 *
 * .note = the caller owns the NEGATIVE case, because its disposition differs per lane:
 *         the compiled lane throws (a code defect), the re-parse lane declines to grade
 *         (an archaeological layout it does not know).
 */
export const getOneAttributionGradeOfMarkup = (input: {
  markupChars: number;
  promptChars: number;
}): AttributionGrade => {
  // a share over a denominator this small is noise, never a measurement
  if (input.promptChars < FLOOR_OF_MEASURABLE_CHARS) return 'attributed';

  // 🔴 and a residual this small is decoration, whatever share it reads. markup
  // scales with the block COUNT and an unattributed input scales with the corpus,
  // so the share alone cannot part a supplies-light lane from a real defect
  if (input.markupChars < FLOOR_OF_ATTRIBUTABLE_CHARS) return 'attributed';

  const share = input.markupChars / input.promptChars;
  return share >= BOUND_OF_MARKUP_SHARE ? 'unattributed' : 'attributed';
};
