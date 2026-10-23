import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';

/**
 * .what = the realized figures a review run returns in memory
 * .why = the artifact's figures, minus its peer pointers, with each figure that can go
 *        unmeasured typed nullable — named once, so a merge of partitions and the step
 *        that returns them read one shape
 *
 * .note = 🔴 `cost` and `tokens` are null where the run's spend is UNMEASURED — an ask was
 *         billed with no reported spend: a reply that ran to its output limit with no
 *         reported output count, or a fault a retry swallowed that the provider may have
 *         billed. that is the run the artifact writer refuses to write, and the meter
 *         grades `unknown`; null carries the same verdict here, so no caller can print a
 *         number the artifact refused (`0.wish`: never under-report)
 * .note = 🔴 `tokens` goes null WHOLE, never the output count alone. an unmeasured ask
 *         spent input too, so an input figure summed over the measured asks alone would
 *         read precise and low — the same under-read a low cost would be
 */
export type ReviewRunMetricsRealizedOfResult = Omit<
  ReviewRunMetricsRealized,
  'compiled' | 'supply' | 'runaways' | 'cost' | 'tokens'
> & {
  tokens: ReviewRunMetricsRealized['tokens'] | null;
  cost: ReviewRunMetricsRealized['cost'] | null;
};
