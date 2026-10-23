import type { IsoPriceWords } from 'iso-price';

import type { AttributionGrade } from '@src/domain.objects/Reviewer/AttributionGrade';
import type { PromptSectionChars } from '@src/domain.objects/Reviewer/PromptSectionChars';
import type { ReviewRunIdentity } from '@src/domain.objects/Reviewer/ReviewRunIdentity';
import type { ReviewTokens } from '@src/domain.objects/Reviewer/ReviewTokens';

/**
 * .what = how much of a review run's spend the log corpus can actually prove
 * .why = the difference between "naught was spent" and "we did not record it"
 *        is the whole honesty of this meter, so the grade is carried in the
 *        type, never flattened to a number.
 *
 *        - `metered`  = `metrics.realized.json` present. every figure is measured.
 *        - `refused`  = no metrics, and none of the three witnesses — no prompt, no
 *                       compiled metrics, no answer. the run was refused at validation
 *                       (bad glob, empty scope, context overflow) before the brain
 *                       was ever called, so nil cost is a fact, not an assumption.
 *        - `unknown`  = no metrics, but a witness survives. the brain may well
 *                       have been called and billed; the run then died or timed
 *                       out before it wrote metrics. this spend is unrecorded.
 *
 * .note = a domain object, apart from the operation that reads it
 *         (`getOneReviewRunMeter`): ~28 readers need the shape and none need the
 *         operation, so a type import never drags the reader in
 */
export type ReviewRunGrade = 'metered' | 'refused' | 'unknown';

/**
 * .what = the measured figures of one review run, keyed on its grade
 * .why = "every figure is measured" is what `metered` asserts, so a `metered` row
 *        with no cost is a contradiction the type must refuse — a sum that folds an
 *        absent cost in reads it as a silent `$0`, the exact unknown-as-nil inversion
 *        the grade exists to prevent. keyed on the grade, the compiler holds that law
 *        at every builder, never one function's convention
 */
export type ReviewRunFigures =
  | {
      grade: 'metered';
      tokens: ReviewTokens;
      cost: NonNullable<ReviewRunMeterShape['cost']>;
    }
  | {
      grade: 'refused' | 'unknown';
      tokens: null;
      cost: null;
    };

/**
 * .what = one review run, as the log corpus can account for it
 * .why = the row the meter aggregates and renders
 */
export type ReviewRunMeter = Omit<
  ReviewRunMeterShape,
  'grade' | 'tokens' | 'cost'
> &
  ReviewRunFigures;

/**
 * .what = the flat field declarations of a review run row, before the grade keys them
 * .why = one home for each field's contract; `ReviewRunMeter` narrows the graded three
 */
interface ReviewRunMeterShape {
  /** the log dir this was read from (the run's only durable id) */
  dir: string;
  /** the guard identity, when the guard ran it; null for a hand or `review.by` run */
  identity: ReviewRunIdentity | null;
  /**
   * the content digest of the run's prompt head (`getOneReviewRunHead`) — null where
   * the run wrote none. part of the run's lane, since a new head is a new prefix
   */
  head: string | null;
  /**
   * the brain slug the run rode on, from its args record — null where none was
   * recorded. part of the run's lane, since a new brain is a new provider's cache
   */
  brain: string | null;
  /**
   * the provider that served the answer, as the brain package reported it in
   * `metrics.realized.json` `supply.provider` — null where none was reported (a
   * run that never reached the brain, or a brain with no supply report).
   *
   * .why = a prompt cache lives on the provider that served the request, so one
   *        brain slug routed across several providers carries several caches. a
   *        rate grouped by brain alone cannot show that one provider caches naught
   */
  provider: string | null;
  /** how much of the spend is proven — see ReviewRunGrade */
  grade: ReviewRunGrade;
  /**
   * why this one run could not be read, where a defect stopped it — else null.
   *
   * .why = a corrupt artifact in one of hundreds of log dirs must not deny the
   *        report its other rows. the defective run is graded `unknown`, so it
   *        is excluded from every sum and rendered absent rather than `$0`,
   *        and this line lets the census name the dir a human must repair.
   *
   * .note = this is not a failhide. a failhide would grade the run `refused`
   *         and render a measured nil; `unknown` asserts the opposite — the
   *         spend is unrecorded, and the reason rides beside it.
   */
  defect: string | null;
  /** the scope the review was given; counts are always readable when args were written */
  scope: {
    rulesCount: number | null;
    refsCount: number | null;
    targetsCount: number | null;
    focus: string | null;
  } | null;
  /**
   * measured token counts, disjoint — each token counted exactly once.
   * null for every grade but `metered`.
   */
  tokens: ReviewTokens | null;
  /** measured spend. null for every grade but `metered`. */
  cost: {
    total: IsoPriceWords;
    /**
     * what the cache saved this review, priced at its own measured full rate
     * (`getOneCacheSavedPrice`) — the figure the cache lever is weighed by.
     *
     * null means unpriced, never "saved naught": the artifact predates the
     * per-dimension cost record, the run billed no full-rate token to derive a
     * rate from, or its breakdown does not sum to its bill (a supplier's
     * spec-rate estimate, never a measurement — `isRunCostBreakdownReconciled`).
     * a measured nil reads `USD 0`; to fold an unpriced
     * run in as zero would understate what the cache bought
     * (rule.forbid.failhide).
     */
    cacheSaved: IsoPriceWords | null;
  } | null;
  /**
   * where this run's prompt chars sat, by named input.
   *
   * null means unread, never "carried no inputs" — the prompt was absent (a
   * refusal never compiled one) or its markers did not parse. the grove census
   * counts the unread runs beside every share, so a figure is always weighed
   * against its coverage (rule.forbid.failhide).
   */
  prompt: {
    chars: number;
    targets: number;
    sections: PromptSectionChars;
    /**
     * how the figures were obtained — must travel with them.
     *
     * - `compiled` = read from `metrics.compiled.json`, measured at compile time
     *                from the source arrays. exact, and free.
     * - `parsed`   = recovered by a re-parse of the rendered `input.prompt.md`.
     *                the migration path for runs that predate the artifact —
     *                coarser (it cannot part the preamble from the markup) and
     *                expensive (megabytes per run).
     *
     * a census that blends the two with no provenance count states a coarse
     * figure with a precise one's authority.
     */
    source: 'compiled' | 'parsed';
    /**
     * whether the census that wrote these rows could vouch for them.
     *
     * `scaffold` is a residual at its source, so it absorbs an input that
     * entered with no row of its own and the rows still sum. this grade is the
     * one field that speaks to that, and must travel with the figures or a
     * reader takes a percentage the writer declined to stand behind
     * (`getOneAttributionGrade`, rule.forbid.failhide).
     *
     * .note = `null` means the run predates the grade — never `attributed`, since
     *         a default to the clean value is the exact absence-reads-as-a-fact
     *         defect this census exists to refuse.
     */
    attribution: AttributionGrade | null;
    /**
     * where the TARGET mass came from — one entry per target path, with its chars.
     *
     * .why = `sections` names the KIND of input that bought the prompt and cannot
     *        name the PLACE. `targetFiles is 87.6% of 1.0M chars` is true and
     *        prunable by nobody, so a reader who wants to cut scope has a total
     *        with no address
     *        (rule.require.report-both-cost-levers-with-trend-and-locus).
     *
     * 🔴 .note = THREE states, and they are not alike:
     *
     *     - a non-empty array = measured, per path
     *     - `[]`              = read, and there was no per-target mass to place.
     *                           a `pull`-focus prompt sends a path list and no
     *                           payload, so this is a FACT about that focus
     *     - `null`            = UNREAD. the run's source could not supply a locus —
     *                           a `compiled` artifact written before this row
     *                           existed carries per-input rows and no per-target
     *                           ones
     *
     *     to flatten `null` into `[]` would report "no directory carried mass" for
     *     a run whose directories were simply never recorded — the same
     *     absence-as-a-fact inversion `attribution` and `cost` each refuse
     *     (rule.forbid.failhide · hazard.a-status-read-cannot-report-absence).
     */
    locus: { path: string; chars: number }[] | null;
  } | null;
}
