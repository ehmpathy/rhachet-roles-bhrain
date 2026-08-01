import type { IsoDuration } from 'iso-time';
import * as path from 'path';

import { runOneReview } from '../review/runOneReview';
import type { ContextReviewBrainSupply } from '../route/genReviewBrainSupply';
import { asReviewRubricsConfig } from './asReviewRubricsConfig';
import { asReviewVerdict } from './asReviewVerdict';
import { computeReviewRubricTotals } from './computeReviewRubricTotals';
import { genReviewRubricCmd } from './genReviewRubricCmd';
import { getAllReviewRubricsToRun } from './getAllReviewRubricsToRun';
import { getOneRoleReviewRubricsYml } from './getOneRoleReviewRubricsYml';
import type {
  ReviewByResult,
  ReviewRubricProgress,
  ReviewRubricResult,
} from './ReviewByResult';

/**
 * .what = default per-rubric review timeout
 * .why = mirrors the guard's DEFAULT_REVIEW_TIMEOUT so review.by and the guard time out alike.
 */
const DEFAULT_REVIEW_TIMEOUT: IsoDuration = 'PT21M';

/**
 * .what = orchestrates a role's review.by run — reads its rubrics, runs each one at a time,
 *         and aggregates the verdicts
 * .why = the composition core. serial `for...of await` (NO Promise.all) mirrors the route
 *        guard's runner. each rubric dispatches the shared runOneReview subprocess (imported
 *        directly, exactly as the guard's runStoneGuardReviews does — a same-repo domain op is
 *        composed, never injected; see rule.forbid.inject-same-repo-domain-ops). so review.by
 *        and the guard share one execution path. narrative only — no console/exit (those live at
 *        the cli boundary). see rule.require.orchestrators-as-narrative.
 */
export const stepReviewBy = async (
  input: {
    role: string;
    cwd: string;
    for: string | null;
    paths: string | null;
    diffs: string | null;
    mode: string | null;
    brain: string | null;
    output: string | null;
  },
  context: ContextReviewBrainSupply & {
    // .why = optional live-progress emitter. review.by runs slow LLM reviews serially, so the
    //        cli boundary passes a stderr renderer to break the silent wait
    //        (rule.require.status-feedback). absent under a guard, which renders its own tree.
    //        a context callback, not an input field — exempt from rule.forbid.undefined-inputs.
    onRubricProgress?: (event: ReviewRubricProgress) => void;
    // .why = optional raw-stdout tee, forwarded straight to runOneReview. the cli passes it ONLY
    //        for a human `--for` run (one rubric), so the disintermediated child review streams
    //        progressively — the same live output a direct `rhx review` gives. absent for aggregate
    //        + guard runs. flows through the `context` handoff below, so no extra wiring is needed.
    onStdoutChunk?: (chunk: string) => void;
  },
): Promise<ReviewByResult> => {
  // read + parse the role's rubrics.yml
  const { raw } = await getOneRoleReviewRubricsYml({
    role: input.role,
    cwd: input.cwd,
  });
  const config = asReviewRubricsConfig({ raw });

  // narrow to a single rubric when --for is set (throws if the slug is absent)
  const rubrics = getAllReviewRubricsToRun({
    rubrics: config.rubrics,
    for: input.for,
  });

  // where each rubric's review output lands
  const outputDir = input.output ?? path.join('.reviews', `by=${input.role}`);

  // run each rubric one at a time — serial, like the guard's runStoneGuardReviews. emit a
  // start/done progress event around each so the cli can render live feedback as the slow
  // LLM review runs, instead of a silent wait (rule.require.status-feedback).
  const results: ReviewRubricResult[] = [];
  for (const [index, rubric] of rubrics.entries()) {
    // announce the rubric before its (slow) review begins
    context.onRubricProgress?.({
      phase: 'start',
      index: index + 1,
      total: rubrics.length,
      slug: rubric.slug,
    });

    const outputPath = path.join(outputDir, `rubric=${rubric.slug}.md`);
    const cmd = genReviewRubricCmd({
      rubric,
      output: outputPath,
      paths: input.paths,
      diffs: input.diffs,
      mode: input.mode,
      brain: input.brain,
    });
    const run = await runOneReview(
      { cmd, timeout: DEFAULT_REVIEW_TIMEOUT, cwd: input.cwd },
      context,
    );
    const verdict = asReviewVerdict({ run });
    results.push({
      slug: rubric.slug,
      purpose: rubric.purpose,
      verdict,
      outputPath,
      durationMs: run.durationMs,
      // keep the base review's raw stdout so the cli can disintermediate a single-scope
      // (`--for`) run — print this verbatim rather than the review.by tree
      stdout: run.stdout,
    });

    // report the resolved verdict the moment the rubric finishes, with all the cli needs to
    // render the completed peer-style row (verdict + duration + the given: path)
    context.onRubricProgress?.({
      phase: 'done',
      index: index + 1,
      total: rubrics.length,
      slug: rubric.slug,
      verdict,
      durationMs: run.durationMs,
      outputPath,
    });
  }

  // sum the in-memory verdicts for the cli exit + the stdout summary
  const { blockersTotal, nitpicksTotal } = computeReviewRubricTotals({
    results,
  });

  return {
    role: input.role,
    for: input.for,
    vibe: config.vibe,
    results,
    blockersTotal,
    nitpicksTotal,
  };
};
