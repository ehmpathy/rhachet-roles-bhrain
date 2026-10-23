import type { IsoPriceHuman } from 'iso-price';

/**
 * .what = the payload `metrics.expected.json` carries — the projected token count
 *         and spend of one review run, computed from the files read, before the
 *         brain was ever called
 *
 * .why = the same defect class `ReviewRunMetricsRealized` guards against: a
 *        write side and a read side declared apart let a rename turn a
 *        measured figure into a coerced `0`, silently, unless a shared
 *        declaration catches it.
 *
 * .why = it has no reader in `src/` today, which is why it is worth a type
 *        now rather than later — the grove and tree rollups already reason
 *        about expected vs realized, and a reader added against an untyped
 *        writer would inherit the bug on its first commit
 *        (rule.require.clamp-edge-cases).
 *
 * .note = the artifact's shape is flat — `{files, tokens, cost}` — where the
 *         in-memory `StepReviewResult` nests `expected: {tokens, cost}` beside a
 *         peer `files`. that divergence is deliberate: the artifact is a
 *         standalone record a reader opens with no caller context, so it
 *         carries the file counts it was computed from. this type declares
 *         the artifact, the side that crosses a process boundary.
 *
 * .note = a future reader binds through `Partial<…>`, exactly as
 *         `getOneReviewRunMeter` does for the realized peer — a file on disk is
 *         untrusted input, and the link that matters is the field names.
 */
export interface ReviewRunMetricsExpected {
  /** what the prompt was built from — the counts behind the estimate */
  files: {
    rulesCount: number;
    refsCount: number;
    /** the prior peer-review dialogue — a first-class input, counted like the rest */
    conversationCount: number;
    targetsCount: number;
  };
  /** the projected prompt size, and what share of the window it claims */
  tokens: {
    estimate: number;
    contextWindowPercent: number;
  };
  /**
   * the projected spend.
   *
   * an estimate, and the field name says so. it is priced off a rate card
   * against a token estimate, so it must never be summed with a realized figure
   * nor read as one — `getOneAccountedCost` grades only measured spend, and this
   * value is deliberately outside its reach.
   */
  cost: {
    estimate: IsoPriceHuman;
  };
}
