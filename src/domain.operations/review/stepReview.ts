import { BadRequestError } from 'helpful-errors';
import * as path from 'path';
import { type BrainChoice, type ContextBrain, isBrainRepl } from 'rhachet';

import { emitReviewRefusal } from '@src/domain.operations/emitReviewRefusal';
import { asGlobList } from '@src/domain.operations/review/asGlobList';
import { asReviewRunDir } from '@src/domain.operations/review/asReviewRunDir';
import { asRulesGlobEmptyRefusalLines } from '@src/domain.operations/review/asRulesGlobEmptyRefusalLines';
import { emitReviewSkip } from '@src/domain.operations/review/emitReviewSkip';
import { enumFilesForReviewSupplies } from '@src/domain.operations/review/enumFilesForReviewSupplies';
import { genLogDirName } from '@src/domain.operations/review/genLogDirName';
import { genReviewDir } from '@src/domain.operations/review/genReviewDir';
import { getOneReviewBrainCallTimeoutMsFromEnv } from '@src/domain.operations/review/getOneReviewBrainCallTimeoutMsFromEnv';
import { getOneReviewScopeSettled } from '@src/domain.operations/review/getOneReviewScopeSettled';
import { isReviewRulesSkip } from '@src/domain.operations/review/getReviewOptionalSkipDecision';
import {
  getSuppliesUnsupported,
  SUPPLIES_OPTIONAL_SUPPORTED,
} from '@src/domain.operations/review/getSuppliesOptionalSupported';
import { isReviewSupplyAsked } from '@src/domain.operations/review/isReviewSupplyAsked';
import { isReviewPlanWithoutDeclaration } from '@src/domain.operations/review/partition/isReviewPlanWithoutDeclaration';
import { refuseReviewPlanWithoutSplit } from '@src/domain.operations/review/partition/refuseReviewPlanWithoutSplit';
import { ReviewRefusalEmittedError } from '@src/domain.operations/review/ReviewRefusalEmittedError';
import type { StepReviewInput } from '@src/domain.operations/review/StepReviewInput';
import type { StepReviewResult } from '@src/domain.operations/review/StepReviewResult';
import { stepReviewOfScope } from '@src/domain.operations/review/stepReviewOfScope';

/**
 * .what = executes a code review against specified rules and targets — the public sdk step
 * .why = core orchestration flow for reviewer role. the two fields only a split sets
 *        (`partition`, `prime`) stay off this contract, so no sdk caller can reach them
 */
export const stepReview = (
  input: Omit<StepReviewInput, 'partition' | 'prime'>,
  context: { brain: ContextBrain<BrainChoice> },
): Promise<StepReviewResult> => _stepReview(input, context);

/**
 * .what = executes a code review: gates the flags, settles the scope ONCE, then compiles and
 *         asks over that settled scope
 * .why = the scope step and the compile-and-ask step are apart, so a split lane walks and
 *        reads its scope once and each partition run narrows it (`stepReviewOfScope`), never
 *        re-walks it
 */
const _stepReview = async (
  input: Omit<StepReviewInput, 'partition' | 'prime'>,
  context: {
    brain: ContextBrain<BrainChoice>;
  },
): Promise<StepReviewResult> => {
  // mark when the review began, so the brain call is charged for the work ahead of it
  const msOfReviewStart = Date.now();
  const cwd = input.cwd ?? process.cwd();

  // validate that pull focus is only used with brains that have tool use
  const choiceIsRepl = isBrainRepl(context.brain.brain.choice);
  if (input.focus === 'pull' && !choiceIsRepl)
    throw new BadRequestError(
      `focus 'pull' requires a brain with tool use (BrainRepl). ` +
        `brain '${context.brain.brain.choice.slug}' is a BrainAtom without tool use. ` +
        `use focus 'push' instead, or choose a BrainRepl.`,
    );

  // validate that at least one of rules, diffs, or paths is specified
  if (
    !isReviewSupplyAsked({
      rules: input.rules,
      diffs: input.diffs,
      paths: input.paths,
    })
  )
    throw new BadRequestError(
      'must specify at least one of --rules, --diffs, or --paths',
    );

  // validate --optional supply names against the shared allow-list (defense-in-depth)
  // .why = stepReview is a public SDK export; a direct caller bypasses the CLI's own
  //        validation, so the domain op must own its invariant too — a typo'd or unsupported
  //        supply must fail loud here, never silently no-op (rule.forbid.failhide)
  const optionalUnsupported = getSuppliesUnsupported({
    supplies: input.optional ?? [],
  });
  if (optionalUnsupported.length > 0)
    throw new BadRequestError(
      `--optional does not support: ${optionalUnsupported.join(', ')} (supported: ${SUPPLIES_OPTIONAL_SUPPORTED.join(', ')})`,
    );

  // enumerate rule files
  // .note = no `--output` parent is minted here: it is a side effect above three gates, so a
  //         refusal would leave an empty dir. each writer of `--output` makes its own parent
  //         at write time (`setReviewOutputFile`)
  const ruleGlobs = asGlobList({ of: input.rules });
  const ruleFiles = await enumFilesForReviewSupplies({ glob: ruleGlobs, cwd });

  // when rules are flagged --optional, an empty rules glob is a valid skip, not an error:
  // emit a 0/0 skip (exit 0) so the guard tallies approved and the stone proceeds.
  // .note = defense-in-depth — the CLI (review.ts) already skips before brain discovery; this
  //         branch covers direct SDK callers that bypass review.ts. it shares one trigger rule
  //         (isReviewRulesSkip) with the CLI, against the rule files enumerated just above.
  if (isReviewRulesSkip({ ruleGlobs, ruleFiles, optional: input.optional }))
    return emitReviewSkip({
      supply: 'rules',
      ruleGlobs,
      output: input.output,
      cwd,
    });

  // validate the timeout env var eagerly — before any output so a malformed var
  // refuses clean, at the top of the output, rather than after the metrics block
  // .why = `getOneReviewBrainCallTimeoutMsFromEnv` is lazy by design (module-load safety), but that
  //        laziness places the throw AFTER `console.log('')` at the spinner call
  //        site and before the cli's `console.error('\n✋ ...')` handler, which
  //        produces a doubled blank line when `RHACHET_REVIEW_TIMEOUT_MS` is bad.
  //        read eagerly here, the throw lands at the top of the output where every
  //        other `BadRequestError` refusal lands, and the double-blank cannot arise
  // 🔴 .why BELOW the skip branch = a skip reads no timeout, so a stray var must not defeat a
  //        zero-cost skip; no line above writes output, so the throw still lands first
  const brainCallTimeoutMs = getOneReviewBrainCallTimeoutMsFromEnv();

  // refuse a --rules glob that matched no file, before the log dir is minted
  // .why = a refusal is a gate, and the log dir below is a side effect that
  //        must not precede a gate
  if (ruleGlobs.length > 0 && ruleFiles.length === 0) {
    emitReviewRefusal({
      kind: 'constraint',
      headline: '--rules glob found nada',
      lines: asRulesGlobEmptyRefusalLines({ ruleGlobs }),
    });
    throw new ReviewRefusalEmittedError('--rules glob was ineffective');
  }

  // refuse a plan that has no partition declared at all, before the log dir is minted
  // .why = it is a check on the caller's flags, so it is a gate, and the log dir below must
  //        not precede a gate. a route set that this lane narrows to none is refused later,
  //        once the targets are known, by the same refusal
  if (isReviewPlanWithoutDeclaration({ review: input }))
    return refuseReviewPlanWithoutSplit();

  // 🔴 the log dir is minted BELOW every gate, and that placement is the point
  // .why = it is a real side effect, so a refusal or a skip above leaves no orphan dir behind
  // .why it is still EARLY = every path below can write a debug artifact (the scope dump
  //        first), so the dir exists for each path that can use it and for none that cannot
  const logDir = asReviewRunDir({ cwd, name: genLogDirName() });
  await genReviewDir({ dir: logDir });

  // settle the scope ONCE: targets, patches, refs, conversation, and every body they need
  const settled = await getOneReviewScopeSettled(
    {
      review: input,
      brain: context.brain.brain.choice.slug,
      ruleFiles,
      logDir,
      logDirRelative: path.relative(cwd, logDir),
    },
    { cwd },
  );

  // compile and ask over the settled scope: split, refuse, prime, or review
  return await stepReviewOfScope(
    {
      review: input,
      settled,
      logDir,
      cwd,
      clock: { msOfReviewStart, brainCallTimeoutMs },
    },
    { brain: context.brain },
  );
};
