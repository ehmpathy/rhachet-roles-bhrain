import type { ReviewRunArgsRecordRead } from '@src/domain.objects/Reviewer/ReviewRunArgsRecord';
import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import type { ReviewRunMetricsRealizedRead } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';
import { asReviewRunIdentity } from '@src/domain.operations/review/asReviewRunIdentity';
import { asReviewTokensFromRealized } from '@src/domain.operations/review/asReviewTokensFromRealized';
import { asRunArtifactPath } from '@src/domain.operations/review/asRunArtifactPath';
import { getOneReviewRunHead } from '@src/domain.operations/review/getOneReviewRunHead';
import { asIsoPriceOfRunArtifact } from '@src/domain.operations/review/meter/asIsoPriceOfRunArtifact';
import { getAllNamesOfUnmeasuredFields } from '@src/domain.operations/review/meter/getAllNamesOfUnmeasuredFields';
import { getOneCacheSavedPriceWherePriced } from '@src/domain.operations/review/meter/getOneCacheSavedPriceWherePriced';
import { getOnePromptSections } from '@src/domain.operations/review/meter/getOnePromptSections';
import { getOneReviewRunGrade } from '@src/domain.operations/review/meter/getOneReviewRunGrade';
import { getOneRunArtifactJson } from '@src/domain.operations/review/meter/getOneRunArtifactJson';
import { isRealizedTokenRecordComplete } from '@src/domain.operations/review/meter/isRealizedTokenRecordComplete';
import { isRunArtifactPresent } from '@src/domain.operations/review/meter/isRunArtifactPresent';
import { ReviewRunArtifactError } from '@src/domain.operations/review/ReviewRunArtifactError';

/**
 * .what = meters one review run from its log directory
 * .why = the leaf the corpus-wide meter maps over. reads ONLY measured artifacts —
 *        `metrics.realized.json`, never `metrics.expected.json` — so no estimate can
 *        ever enter a reported figure.
 */
export const getOneReviewRunMeter = async (input: {
  dir: string;
  /**
   * also place the target mass by directory — see `getOnePromptSections` (meter/getOnePromptSections.ts)
   *
   * .note = required, so every caller states its choice. the corpus-wide breadths
   *         that map this over hundreds of runs pass false and never pay for a read
   *         they do not render; `--of run` passes true.
   */
  withLocus: boolean;
}): Promise<ReviewRunMeter> => {
  // the reads are independent, so they share one wait. the prompt census is read on
  // every grade: an unknown run compiled its inputs, so it counts toward the by-input
  // census even where its spend never can — why the stats are written at compile time
  // rather than beside the realized metrics. where both of its sources are absent the
  // read answers null itself
  const [args, realized, head, prompt] = await Promise.all([
    getOneRunArtifactJson({ dir: input.dir, artifact: 'args' }),
    getOneRunArtifactJson({ dir: input.dir, artifact: 'realized' }),
    getOneReviewRunHead({ dir: input.dir }),
    getOnePromptSections(input),
  ]);

  // recover the guard identity from the --output path the review was given
  // .note = the reader already proved the body a record; the `as` binds only the
  //         field NAMES of the deep-partial read shape, and the optional-chained reads
  //         beneath are what gate each field
  const argsRecord = args as ReviewRunArgsRecordRead | null;
  const output = argsRecord?.args?.output;

  // the fields every grade carries, built once so no grade can drop one
  // .note = held in three parts, not one, because the row is published as json
  //         (`--output json`) and a key's place in it is part of that contract. a
  //         single spread would push the graded keys behind `prompt`; each return
  //         below lays the parts around them in the published order
  const lead = {
    dir: input.dir,
    identity: output ? asReviewRunIdentity({ output }) : null,
    head,
    brain: argsRecord?.args?.brain ?? null,
    // the provider rides in the realized metrics, so a run with none reports none
    provider:
      (realized as ReviewRunMetricsRealizedRead | null)?.supply?.provider ??
      null,
    defect: null,
  } satisfies Pick<
    ReviewRunMeter,
    'dir' | 'identity' | 'head' | 'brain' | 'provider' | 'defect'
  >;
  const scope: ReviewRunMeter['scope'] = argsRecord
    ? {
        rulesCount: argsRecord.scope?.ruleFiles?.length ?? null,
        refsCount: argsRecord.scope?.refFiles?.length ?? null,
        targetsCount: argsRecord.scope?.targetFiles?.length ?? null,
        focus: argsRecord.args?.focus ?? null,
      }
    : null;
  const tail = { prompt } satisfies Pick<ReviewRunMeter, 'prompt'>;

  // no realized metrics: part a refusal (never reached the brain) from an unknown
  // (the brain may have been billed, and we cannot prove otherwise)
  if (!realized) {
    const [promptPresent, compiledPresent, responsePresent, reviewPresent] =
      await Promise.all([
        isRunArtifactPresent({
          at: asRunArtifactPath({ dir: input.dir, artifact: 'prompt' }),
        }),
        isRunArtifactPresent({
          at: asRunArtifactPath({ dir: input.dir, artifact: 'compiled' }),
        }),
        isRunArtifactPresent({
          at: asRunArtifactPath({ dir: input.dir, artifact: 'response' }),
        }),
        isRunArtifactPresent({
          at: asRunArtifactPath({ dir: input.dir, artifact: 'review' }),
        }),
      ]);
    return {
      ...lead,
      // three witnesses, never one. the brain's answer proves the call outright;
      // the prompt is the megabyte artifact a disk-conscious driver prunes; the
      // compiled metrics are written in the same call and survive that prune — see
      // `getOneReviewRunGrade`
      grade: getOneReviewRunGrade({
        promptPresent,
        compiledPresent,
        answerPresent: responsePresent || reviewPresent,
      }),
      scope,
      tokens: null,
      cost: null,
      ...tail,
    };
  }

  /**
   * .what = the parsed `metrics.realized.json`, seen through the one declared
   *         shape of that artifact rather than a second inline copy of it
   *
   * .why = a prior hand-typed copy of every field let a rename on the write
   *        side compile clean while the reader saw an absent field, coerced it
   *        to `0` below, and reported a measured figure that was wrong. bound
   *        to `ReviewRunMetricsRealized`, a rename fails to compile on both
   *        sides at once.
   *
   * .note = `Partial` is deliberate, not a weaker guard: a file on disk is
   *         untrusted input, so its fields genuinely may be absent. the bind
   *         carries the field names, the half that drifted before.
   */
  const realizedRecord = realized as ReviewRunMetricsRealizedRead;

  const costTotal = realizedRecord.cost?.total;
  if (costTotal === undefined)
    throw new ReviewRunArtifactError(
      'metrics.realized.json is present but carries no cost.total',
      { dir: input.dir },
    );

  // the token figures are read as strictly as `cost.total` above, for the
  // identical reason. a `?? 0` here is the absence-reads-as-zero shape this
  // whole operation exists to refuse — it would mint a run graded `metered`
  // (whose contract is every figure is measured) out of an artifact that
  // measured none of them, and that zero then flows into a cache-hit-rate
  // denominator and reads as a legitimate 0% (rule.forbid.failhide).
  //
  // .note = deliberately asymmetric with `getOnePromptSections`, which
  //         tolerates the FULL absence of its sources — and only that: a compiled
  //         artifact that is present but torn still throws there. not an
  //         oversight: a prompt census is an enrichment whose absence is itself a
  //         reported grade, where a token figure is the measurement the grade
  //         asserts. a `metered` run that lacks a token is a corrupt artifact,
  //         not a partial one.
  const read = {
    tokens: {
      input: realizedRecord.tokens?.input,
      inputCacheCreation: realizedRecord.tokens?.inputCacheCreation,
      inputCacheRead: realizedRecord.tokens?.inputCacheRead,
      output: realizedRecord.tokens?.output,
    },
  };
  if (!isRealizedTokenRecordComplete(read))
    throw new ReviewRunArtifactError(
      'metrics.realized.json states a cost but not every token figure',
      {
        dir: input.dir,
        // the unmeasured names ARE the diagnosis — which half of the artifact was
        // lost, or written as aught but a finite number (a `null`, a string)
        tokensAbsent: getAllNamesOfUnmeasuredFields({ fields: read.tokens }),
      },
    );
  // cast once at the named seam, the same one the per-run stdout reads
  const tokens = asReviewTokensFromRealized({ tokens: read.tokens });

  return {
    ...lead,
    grade: 'metered',
    scope,
    tokens,
    cost: {
      total: asIsoPriceOfRunArtifact({ dir: input.dir, costTotal }),
      cacheSaved: getOneCacheSavedPriceWherePriced({
        tokens: { input: tokens.input, cacheGet: tokens.cacheGet },
        cost: realizedRecord.cost,
      }),
    },
    ...tail,
  };
};
