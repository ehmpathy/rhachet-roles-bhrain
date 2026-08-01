import type { ReviewVibe } from './asReviewRubricsConfig';

/**
 * .what = the failhide-safe verdict slice for one rubric's review
 * .why = carries the tally + the outcome the runner resolved. `outcome` distinguishes a clean
 *        pass from a rejection (blockers) from a malfunction (no trustworthy verdict) — a
 *        malfunction is never a silent 0/0. see rule.forbid.failhide.
 */
export interface ReviewVerdict {
  blockers: number;
  nitpicks: number;
  outcome: 'passed' | 'rejected' | 'malfunctioned';
  tallier: 'deterministic' | 'probabilistic' | null;
  reason?: string;
}

/**
 * .what = the outcome of one rubric's review
 * .why = folds the runner's verdict together with the rubric identity + where its review landed.
 */
export interface ReviewRubricResult {
  slug: string;
  purpose?: string;
  verdict: ReviewVerdict;
  outputPath: string;
  // wall-clock of the rubric's review, parsed from its stdout; null when the review printed none.
  // .why = the peer-style row shows `approved 41.3s`, so the settled tree needs each rubric's
  //        duration — the same field formatGuardReviewerTree renders for a route peer reviewer.
  durationMs: number | null;
  // the raw stdout the base `rhx review` printed for this rubric.
  // .why = a single-scope run (`--for $one`) DISINTERMEDIATES: the cli prints this verbatim
  //        instead of the review.by tree, so review.by --for looks exactly like a plain review —
  //        a clean drop-in for a route guard peer slot. the aggregate (no --for) run ignores it
  //        and renders the summary tree instead.
  stdout: string;
}

/**
 * .what = a live progress event for one rubric, emitted before + after its review runs
 * .why = review.by runs rubrics serially and each review is a slow LLM call (timeout PT21M);
 *        with no live signal the human faces a silent terminal for minutes
 *        (rule.require.status-feedback). the orchestrator stays narrative — it emits these
 *        events; the cli boundary renders them to stdout via the SAME formatGuardReviewerTree a
 *        route peer review streams with. `phase='start'` fires before a rubric's review runs,
 *        `phase='done'` after, with the resolved verdict + duration + output path so the cli can
 *        render the completed peer-style row.
 */
export interface ReviewRubricProgress {
  phase: 'start' | 'done';
  index: number; // 1-based position of this rubric in the run
  total: number; // count of rubrics in this run
  slug: string;
  verdict?: ReviewVerdict; // present on 'done'
  durationMs?: number | null; // present on 'done' — the review's wall-clock
  outputPath?: string; // present on 'done' — the `given:` path of the completed row
}

/**
 * .what = the aggregate outcome of a full review.by run
 * .why = the shape the cli renders + exits on — per-rubric results plus the summed totals the
 *        guard `reviewed?` mechanism parses off stdout.
 */
export interface ReviewByResult {
  role: string;
  for: string | null;
  vibe: ReviewVibe;
  results: ReviewRubricResult[];
  blockersTotal: number;
  nitpicksTotal: number;
}
