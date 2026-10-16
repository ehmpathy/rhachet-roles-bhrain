import { asIsoPriceHuman, type IsoPriceHuman } from 'iso-price';
import { type BrainSpec, calcBrainOutputCost } from 'rhachet/brains';

import type { PromptComposition } from '@src/domain.objects/Reviewer/PromptComposition';

import { asGoalInstructions } from './asGoalInstructions';
import { asPercentHuman } from './asPercentHuman';
import { asPromptHeadStatic } from './asPromptHeadStatic';
import { asPromptTailVariable } from './asPromptTailVariable';
import { asSuppliedFilesSection } from './asSuppliedFilesSection';
import { asTargetSection } from './asTargetSection';
import { estimateTokenCount } from './estimateTokenCount';
import { getOneEstimatedOutputTokens } from './getOneEstimatedOutputTokens';
import { getOnePercentOfWindow } from './getOnePercentOfWindow';
import { getOnePercentRounded } from './getOnePercentRounded';
import { getOnePromptComposition } from './getOnePromptComposition';
import { ReviewContextOverflowError } from './ReviewContextOverflowError';

/**
 * .what = compiles the review prompt from rules and target files
 * .why = prepares the prompt for brain invocation with token safeguards
 */
export const compileReviewPrompt = (input: {
  rules: Array<{ path: string; content: string }>;
  refs: Array<{ path: string; content: string }>;
  conversation?: Array<{ path: string; content: string }>;
  targets: Array<{
    path: string;
    content: string | null;
    diff?: string | null;
    changeKind?: 'new' | 'edited' | 'deleted';
  }>;
  /**
   * the targets a partition run carries as context only — another partition grades them.
   * absent on a whole run
   */
  targetsAsContext?: string[];
  /**
   * the targets every partition of a split carries — they render ahead of this run's own,
   * so the shared prefix the prime wrote reaches past them. absent on a whole run
   */
  targetsShared?: string[];
  /**
   * the other partitions of a split, by slug and declared globs — where the rest of the lane
   * sits. absent on a whole run
   */
  partitionPeers?: Array<{ name: string; globs: string[] }>;
  focus: 'pull' | 'push';
  goal: 'exhaustive' | 'representative';
  contextWindowSize: number;
  costSpec: BrainSpec['cost']['cash'];
  diffRange?: string;
}): {
  prompt: string;
  /**
   * the cacheable head — `prompt` is exactly `promptHeadStatic + promptTailVariable`.
   *
   * exposed so the caller can hand it to the brain as the system prompt — the
   * slot a provider pins a cache replica to, so a shared prefix that lives only
   * in the user message can earn no cache hit
   * (rule.require.name-the-shared-prefix-as-the-cache-anchor).
   */
  promptHeadStatic: string;
  /** the round-variable tail — the target, then the conversation */
  promptTailVariable: string;
  /**
   * where this prompt's chars actually went, by section.
   *
   * a hit rate says how much cached, never what the uncacheable remainder
   * was made of. persisted per run so a corpus can be asked where the next
   * lever sits (rules? diffs? file context?).
   */
  composition: PromptComposition;
  tokenEstimate: number;
  contextWindowPercent: number;
  costEstimate: IsoPriceHuman;
  warnings: string[];
} => {
  const contextWindow = input.contextWindowSize;

  // the rubric. it coalesces to `''` where the three peers below stay null: the
  // `<rules>` tag is emitted unconditionally, because `asPromptSectionChars` reads
  // its presence as the witness that a prompt is a review prompt
  const rulesSection = asSuppliedFilesSection({ files: input.rules }) ?? '';

  // the reference documents the reviewer judges WITH
  const refsSection = asSuppliedFilesSection({ files: input.refs });

  // the prior peer-review dialogue.
  // .why = distinct from refs so the reviewer knows it reads a back-and-forth of
  //        its own prior critiques (.given) and the driver's responses (.taken)
  const conversation = input.conversation ?? [];
  const conversationSection = asSuppliedFilesSection({ files: conversation });

  // the target block — a path list in pull focus, diff + content in push
  const targetSection = asTargetSection({
    targets: input.targets,
    focus: input.focus,
    diffRange: input.diffRange,
    shared: input.targetsShared,
  });

  // build goal instructions
  const goalInstructions = asGoalInstructions({ goal: input.goal });

  // the static head — every block byte-identical across the rounds of one lane
  const promptHeadStatic = asPromptHeadStatic({
    goalInstructions,
    rulesSection,
    refsSection,
  });

  // the variable tail — the target, then the conversation
  const promptTailVariable = asPromptTailVariable({
    targetSection,
    targetsAsContext: input.targetsAsContext,
    partitionPeers: input.partitionPeers,
    conversationSection,
  });

  const prompt = `${promptHeadStatic}${promptTailVariable}`;

  // measure what the prompt is made of BEFORE the gate, so a refusal can say which
  // named input overran the window — not only that one did
  const composition = getOnePromptComposition({
    focus: input.focus,
    rules: input.rules,
    refs: input.refs,
    conversation: input.conversation ?? [],
    targets: input.targets,
    targetsAsContext: input.targetsAsContext,
    promptHeadStatic,
    promptTailVariable,
  });

  // estimate tokens
  const tokenEstimate = estimateTokenCount({ content: prompt });
  const contextWindowPercent = getOnePercentOfWindow({
    tokens: tokenEstimate,
    window: contextWindow,
  });

  // check thresholds (only in push mode - pull mode is inherently lighter)
  if (input.focus === 'push') {
    // failfast if >75%
    if (contextWindowPercent > 75) {
      throw new ReviewContextOverflowError(
        {
          percentOfWindow: contextWindowPercent,
          windowTokens: contextWindow,
          promptTokens: tokenEstimate,
        },
        composition,
      );
    }
  }

  // warn if >60% (only in push mode - pull mode is inherently lighter)
  const warnings: string[] =
    input.focus === 'push' && contextWindowPercent > 60
      ? [
          `potential quality degradation: prompt uses ${asPercentHuman({ of: contextWindowPercent })} of context window`,
        ]
      : [];

  // estimate cost via brain spec rates
  const estimatedOutputTokens = getOneEstimatedOutputTokens({
    tokens: tokenEstimate,
  });
  const costResult = calcBrainOutputCost({
    for: {
      tokens: {
        input: tokenEstimate,
        output: estimatedOutputTokens,
        cache: { get: 0, set: 0 },
      },
    },
    with: { cost: { cash: input.costSpec } },
  });
  const costEstimate = asIsoPriceHuman(costResult.cash.total);

  return {
    prompt,
    promptHeadStatic,
    promptTailVariable,
    composition,
    tokenEstimate,
    contextWindowPercent: getOnePercentRounded({
      percent: contextWindowPercent,
    }),
    costEstimate,
    warnings,
  };
};
