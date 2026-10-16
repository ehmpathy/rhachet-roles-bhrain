import { asCountHuman } from '@src/domain.operations/review/asCountHuman';
import { MARK_OF_ABSENT } from '@src/domain.operations/review/meter/asFigureHuman';
import type { ReviewRunawayEvidence } from '@src/domain.operations/review/withOutputLimitBrainRetry';
import { asCountedNoun } from '@src/utils/asCountedNoun';

/**
 * .what = the stderr line a review prints when its brain's reply ran to the output limit,
 *         and it asks once more
 * .why = the first ask was billed in full. the run's realized metrics fold its spend in;
 *        this line is where its host and generation are seen at once, auditable on the
 *        router's side (https://openrouter.ai/activity)
 *
 * .note = the billed count renders through the shared figure + noun agreement
 *         (`asCountHuman`, `asCountedNoun`), and an unreported count renders
 *         `MARK_OF_ABSENT`, never a bare `?` — the same vocabulary as every cost surface
 */
export const asOutputLimitRetryLine = (input: {
  evidence: ReviewRunawayEvidence;
}): string =>
  [
    "💥 MalfunctionError: the brain's reply ran to its output limit with no verdict",
    `(${asTokensBilledPhrase({ tokensOutput: input.evidence.tokensOutput })},`,
    `provider ${input.evidence.provider ?? 'unknown'},`,
    `generation ${input.evidence.generationId ?? 'none'});`,
    'one retry',
  ].join(' ');

/**
 * .what = the billed output count as a phrase — `131,072 output tokens billed`, or the
 *         absent mark where the brain package reported no count
 */
const asTokensBilledPhrase = (input: {
  tokensOutput: number | null;
}): string => {
  // an unreported count is absent, never a guess
  if (input.tokensOutput === null)
    return `${MARK_OF_ABSENT} output tokens billed`;

  // the count with its separators, beside a noun that agrees with it
  const counted = asCountedNoun(
    { count: input.tokensOutput, one: 'output token', many: 'output tokens' },
    { figure: (count) => asCountHuman({ of: count }) },
  );
  return `${counted} billed`;
};
