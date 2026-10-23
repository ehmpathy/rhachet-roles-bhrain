import type { IsoDuration } from 'iso-time';
import * as path from 'path';

import { getAllSettledResultsInBoundedPool } from '@src/utils/getAllSettledResultsInBoundedPool';

import type { ContextReviewBrainSupply } from '../brain/genReviewBrainSupply'; // brain/ is a declared shared subdomain (its .readme.md)
import { asReviewRubricOutputPath } from './asReviewRubricOutputPath';
import { asReviewRubricResultOfOutcome } from './asReviewRubricResultOfOutcome';
import { asReviewRubricsConfig } from './asReviewRubricsConfig';
import { computeReviewRubricTotals } from './computeReviewRubricTotals';
import { getAllReviewRubricsToRun } from './getAllReviewRubricsToRun';
import { getOneReviewRubricResult } from './getOneReviewRubricResult';
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
 * .what = how many rubrics may review at once
 * .why = each rubric is its own `rhx review` subprocess and its own brain call, so the pour
 *        is bounded by what a laptop and a provider rate limit bear, never by the roster. a
 *        role's rubric list is short (a handful), so four lets most rosters pour whole
 */
const BOUND_OF_CONCURRENT_RUBRICS = 4;

/**
 * .what = orchestrates a role's review.by run — reads its rubrics, pours them under a
 *         bound, and aggregates the verdicts
 * .why = the composition core. the rubrics are independent reviews of one corpus — none
 *        reads another's output — so they pour concurrently, as the guard pours the
 *        reviewers within a level (rule.forbid.serial-reviews-that-could-pour). each rubric
 *        dispatches the shared runOneReview subprocess (imported directly, exactly as the
 *        guard's runStoneGuardReviews does — a same-repo domain op is composed, never
 *        injected; see rule.forbid.inject-same-repo-domain-ops). so review.by and the guard
 *        share one execution path. narrative only — no console/exit (those live at the cli
 *        boundary). see rule.require.orchestrators-as-narrative.
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
    // .why = optional live-progress emitter. review.by pours slow LLM reviews, so the
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

  // pour the rubrics at once, under a bound — each is an independent review of the same
  // corpus, so none waits on another (rule.forbid.serial-reviews-that-could-pour). the pour
  // SETTLES, so a throw from one rubric never drops the verdicts its peers already returned
  // (rule.forbid.dropped-partial-review-progress). emit a start/done progress event around
  // each so the cli can render live feedback as the slow LLM reviews run, instead of a
  // silent wait (rule.require.status-feedback). the outcomes answer in rubric order,
  // whatever order they settle in
  const outcomes = await getAllSettledResultsInBoundedPool({
    items: rubrics.map((rubric, index) => ({ rubric, index })),
    bound: BOUND_OF_CONCURRENT_RUBRICS,
    map: ({ rubric, index }): Promise<ReviewRubricResult> =>
      getOneReviewRubricResult(
        {
          rubric,
          index,
          total: rubrics.length,
          outputDir,
          timeout: DEFAULT_REVIEW_TIMEOUT,
          cwd: input.cwd,
          paths: input.paths,
          diffs: input.diffs,
          mode: input.mode,
          brain: input.brain,
        },
        context,
      ),
  });

  // a rubric whose run threw still answers — a named malfunction row, never a dropped wave
  const results: ReviewRubricResult[] = outcomes.map((outcome, at) =>
    asReviewRubricResultOfOutcome({
      outcome,
      rubric: rubrics[at]!,
      outputPath: asReviewRubricOutputPath({
        outputDir,
        slug: rubrics[at]!.slug,
      }),
    }),
  );

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
