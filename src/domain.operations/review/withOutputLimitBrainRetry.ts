import { MalfunctionError } from 'helpful-errors';

import { isErrorOfReplyCutAtOutputLimit } from '@src/domain.operations/review/isErrorOfReplyCutAtOutputLimit';

/**
 * .what = runs a brain call, and asks once more if its reply was cut off at the output limit
 * .why = a think that never ends spends the model's whole output limit (131,072 tokens on
 *        `deepseek/flash`) and returns no content. measured on route 5.1, i015–i018: four
 *        such cutoffs, each on a lane whose same prompt completed on its other asks — so the
 *        runaway is sampled, not caused by the prompt. a second ask is the cure this repo
 *        holds; the alternative is a malfunctioned lane, scored a blocker, and a re-arrive of
 *        the whole round to buy the same second ask
 *
 * .note = ONE retry, never more. each cutoff bills the full output limit, so a third ask
 *         would double down on a lane that already ran away twice. a second cutoff
 *         malfunctions the lane, and names both asks
 * .note = no wait between asks: the cutoff is not a provider in distress, so a delay buys
 *         naught. the caller's `withDeadline` bounds both asks together, and its `signal`
 *         gates the second: a lane whose wait was abandoned bills no new ask
 * .note = it returns the runaway asks beside the answer. each was billed in full, and the
 *         brain's answer carries only the ask that answered — so the caller folds them into
 *         the run's realized metrics (`asReviewRunMetricsRealizedOfAsks`). `onRetry` is the
 *         moment one is seen, for a line on stderr while the second ask runs
 */
export const withOutputLimitBrainRetry = async <T>(input: {
  operation: () => Promise<T>;
  signal: AbortSignal | null;
  onRetry: (event: { error: unknown; evidence: ReviewRunawayEvidence }) => void;
}): Promise<{ answer: T; runaways: ReviewRunawayEvidence[] }> => {
  // first ask
  const attemptFirst = await input.operation().then(
    (answer) => ({ answered: true as const, answer }),
    (error: unknown) => ({ answered: false as const, error }),
  );
  if (attemptFirst.answered)
    return { answer: attemptFirst.answer, runaways: [] };
  const errorFirst = attemptFirst.error;

  // any fault but a cutoff rethrows unchanged; so does a cutoff after the deadline fired
  if (!isErrorOfReplyCutAtOutputLimit({ error: errorFirst })) throw errorFirst;
  if (input.signal?.aborted) throw errorFirst;

  // report the runaway, then ask once more
  const evidenceFirst = asCutoffEvidence({ error: errorFirst });
  input.onRetry({ error: errorFirst, evidence: evidenceFirst });
  try {
    const answer = await input.operation();
    return { answer, runaways: [evidenceFirst] };
  } catch (errorSecond) {
    // a different fault on the second ask keeps its own class and message
    if (!isErrorOfReplyCutAtOutputLimit({ error: errorSecond }))
      throw errorSecond;

    // a second cutoff malfunctions the lane, with both asks named
    // .note = it keeps `finishReason: 'length'`, so an outer retry can see that this
    //         runaway already spent its one retry (`withOneRetryOnBrainCallFault`)
    throw new MalfunctionError(
      'the brain ran to its output limit on two asks in a row, with no reply on either. the think did not end, so the lane has no verdict.',
      {
        cause: errorSecond instanceof Error ? errorSecond : undefined,
        finishReason: 'length',
        asks: [evidenceFirst, asCutoffEvidence({ error: errorSecond })],
        hint: 're-arrive to ask again; if a lane runs away round after round, choose another brain or host for it',
      },
    );
  }
};

/**
 * .what = the evidence one runaway ask carries: who served it, and what it spent
 * .why = each runaway ask is billed in full. the run's realized metrics fold it in, and a
 *        malfunction names both, so each is auditable on the provider's activity page
 * .note = each field is null where the brain package did not report it — null states
 *         "unreported", never "none"
 */
export interface ReviewRunawayEvidence {
  provider: string | null;
  generationId: string | null;
  tokensOutput: number | null;
}

/**
 * .what = reads the runaway evidence off a cutoff fault's metadata
 * .why = the fault is untrusted input; each field is narrowed to its type or to null
 */
const asCutoffEvidence = (input: { error: unknown }): ReviewRunawayEvidence => {
  // .note = the `as` reads field NAMES off a value `isErrorOfReplyCutAtOutputLimit` already
  //         proved carries an object `metadata`; each field is narrowed below
  const { metadata } = input.error as { metadata: Record<string, unknown> };
  return {
    provider: typeof metadata.provider === 'string' ? metadata.provider : null,
    generationId:
      typeof metadata.generationId === 'string' ? metadata.generationId : null,
    tokensOutput: Number.isFinite(metadata.tokensOutput)
      ? Number(metadata.tokensOutput)
      : null,
  };
};
