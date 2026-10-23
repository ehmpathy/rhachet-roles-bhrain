/**
 * .what = whether the census can stand behind its own attribution
 * .why = 🔴 `markup` is the RESIDUAL, so the rows sum to `chars` by algebra
 *        whatever enters the prompt. an input added with no row of its own lands
 *        there in silence, and every figure downstream inherits the lie.
 *
 *        so the census states its COVERAGE beside its figures. this is the same
 *        shape `getOneAccountedCost` already uses for spend — `measured` vs the two
 *        nils — and for the same reason: a measurement that cannot state its own
 *        coverage is not a measurement (rule.forbid.failhide).
 *
 * .note = 🔴 `unattributed` does NOT mean a defect was found. it means the census
 *         cannot PART a real unnamed input from legitimate scaffold, so it
 *         declines to vouch for the rows. the reader is told; naught is hidden.
 */
export type AttributionGrade =
  /** the residual is small enough to be render overhead — the rows can be trusted */
  | 'attributed'
  /** the residual is too large to vouch for — it may hide an input with no row */
  | 'unattributed';
