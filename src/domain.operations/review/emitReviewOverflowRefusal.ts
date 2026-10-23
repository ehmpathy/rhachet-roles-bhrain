import type { PromptComposition } from '@src/domain.objects/Reviewer/PromptComposition';
import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { asPercentHuman } from '@src/domain.operations/review/asPercentHuman';
import { asReviewOverflowScopeLines } from '@src/domain.operations/review/asReviewOverflowScopeLines';
import type { TargetInputName } from '@src/domain.operations/review/asTargetContentsByInput';
import type { ReviewGuardProvenance } from '@src/domain.operations/review/getOneReviewGuardProvenance';
import {
  HEADLINE_OF_REVIEW_OVERFLOW,
  ReviewOverflowRefusedError,
} from '@src/domain.operations/review/ReviewOverflowRefusedError';

/**
 * .what = refuses a review whose prompt overran its context window, and prints the
 *         scope that produced it — rules, diffs, paths, the join, the lever, and where to look
 * .why = the moment of overflow is the one moment a driver must judge WHICH flag
 *        widened their scope, so the refusal carries the whole scope tree rather
 *        than a bare percent (rule.require.errors-name-the-fix). it sat inline in
 *        `stepReview` as a catch body of ~40 `console.error` lines, which a reader of
 *        the orchestrator had to simulate end to end (rule.forbid.inline-decode-friction)
 *
 * .note = the one refusal whose block does NOT end at the frame — a scope dump
 *         follows the frame, so it calls the shared emitter, prints the dump, then
 *         throws itself
 */
export const emitReviewOverflowRefusal = (input: {
  figures: { percentOfWindow: number; windowTokens: number };
  rules: { flag: string | string[] | undefined; files: number; tokens: number };
  diffs: { flag: string | undefined; files: number };
  paths: { with: string[]; wout: string[]; files: number };
  joined: { mode: string; files: number; tokens: number };
  composition: PromptComposition;
  locus: Record<TargetInputName, { path: string; chars: number }[]>;
  logDirRelative: string;
  /** the partition this run already was, or null for a whole run */
  partition: string | null;
  /** the route this run was driven from, whose spec is never a suggested cut */
  route: string | null;
  /** where the lane's guard was stamped from; null for a hand run or a route-local guard */
  provenance: ReviewGuardProvenance | null;
}): never => {
  // the frame: what was refused, and where the lever is named
  emitReviewRefusal({
    kind: 'constraint',
    headline: HEADLINE_OF_REVIEW_OVERFLOW,
    lines: [
      `   ├─ ${asPercentHuman({ of: input.figures.percentOfWindow })} of ${asCountHuman({ of: input.figures.windowTokens })} tokens`,
      `   └─ the lever that makes it fit is named below`,
    ],
  });

  // the scope dump beneath the frame
  for (const line of asReviewOverflowScopeLines(input)) console.error(line);

  throw new ReviewOverflowRefusedError();
};
