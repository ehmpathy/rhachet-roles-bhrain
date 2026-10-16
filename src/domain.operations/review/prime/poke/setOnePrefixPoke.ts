import { asIsoPriceHuman } from 'iso-price';
import type { BrainChoice, ContextBrain } from 'rhachet';
import { genArtifactGitFile } from 'rhachet-artifact-git';
import { z } from 'zod';

import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';
import { asReviewRunSupplyOfAnswer } from '@src/domain.operations/review/asReviewRunSupplyOfAnswer';
import { asRoleOfSharedPrefix } from '@src/domain.operations/review/asRoleOfSharedPrefix';
import { getOnePromptTokens } from '@src/domain.operations/review/getOnePromptTokens';
import { ReviewBrainCallError } from '@src/domain.operations/review/ReviewBrainCallError';
import { ReviewTimeoutError } from '@src/domain.operations/review/ReviewTimeoutError';
import { withDeadline } from '@src/domain.operations/review/withDeadline';
import { withTransientBrainRetry } from '@src/domain.operations/review/withTransientBrainRetry';

import { asPrefixPokeHeadPath } from './asPrefixPokeHeadPath';
import { getOneMsOfPokeWait } from './getOneMsOfPokeWait';

/**
 * .what = the shape a poke asks the brain to answer with
 * .why = a poke wants the SMALLEST legal answer. its whole job is to make the
 *        provider READ the prefix — the reply is waste heat, and every output
 *        token is billed at the dearest rate on the card.
 *
 *        a one-field object is the floor a structured-output call can reach: the
 *        schema still parses, and the model has one short word to emit.
 */
const schemaOfPokeAck = z.object({
  ack: z.string().describe('the single word "ack"'),
});

/**
 * .what = the line appended to a poke's tail, which asks for the tiny answer
 * .why = it rides at the END of the tail, never the front, so every byte the real
 *        review sends still prefixes what the poke sends. a line at the head would
 *        part the two at byte 0 and warm a prefix the real call never shares.
 */
const ASK_OF_POKE = `

---
this is a cache poke, not a review. review no file here.
reply with exactly: {"ack":"ack"}`;

/**
 * .what = why the poke's head rides as a file (its path: `asPrefixPokeHeadPath`, one per head)
 * .why = the head must reach the brain as the SYSTEM prompt — the replica affinity
 *        key derives from the system prompt, and a cache lives per replica
 *        (rule.require.name-the-shared-prefix-as-the-cache-anchor). `role.briefs`
 *        is the only door to that slot, and a brief is a FILE.
 *
 * .note = the digest hashes the brief's TEXT, never its path, so the poke's own path
 *         costs the pin naught, and the poke never writes into a review run's log dir,
 *         which is that run's record.
 *
 *         ✅ verified against the adapter's own readme: *"the key is coarse on
 *         purpose. it covers the model and the system prompt only — not the
 *         prompt, the episode, or the tool defs."* so neither this path nor the
 *         poke's own `schemaOfPokeAck` (which differs from the review's schema)
 *         can part the two pins.
 */

/**
 * .what = the longest a single poke may wait on the provider before it is abandoned
 *
 * .why = a prime holds a whole pour behind it. an unbounded `await` here lets a
 *        suspended account, a wedged replica, or a dropped socket park every partition
 *        of the lane on one promise, so the lane never runs at all
 *        (rule.forbid.behavior-hazards: an unbounded wait ahead of real work).
 *
 * .note = generous on purpose. a poke replays a real review's prefix, which runs to
 *         hundreds of thousands of tokens, so a tight bound would abandon slow but
 *         healthy calls and spend the budget on retries that each re-pay full input
 *         rate. this bound exists to catch a WEDGE, never to tune latency.
 *
 * .note = a timeout ABANDONS the wait; it cannot cancel the provider's work, so a
 *         poke that times out may still have warmed the replica. recorded as a
 *         fault rather than a hit, since only a measured `cache.get` proves one
 *         (rule.forbid.failhide).
 */
const MS_OF_POKE_TIMEOUT = 120_000;

/**
 * .what = the waits between asks of a poke that faulted transiently
 * .why = one gateway 502 must not make a prime pour cold; a 502 tends to clear within seconds. one retry, short, so it fits well inside
 *        the wedge bound — and the bound's `signal` still gates it, so a retry never
 *        starts after the bound elapsed
 */
const DELAYS_OF_TRANSIENT_POKE_RETRY = [{ seconds: 3 }];

/**
 * .what = sends ONE poke and reports what the provider measured
 * .why = needs no new brain surface — a poke IS an ordinary completion, and
 *        `brain.choice.ask` already returns `size.tokens.cache.get` and
 *        `cost.cash.total`, the whole measurement a poke row carries.
 *
 * .note = it is a `set`: a poke mutates two states — it writes the head brief to
 *         disk, and writes the prefix into the provider's cache. the measurement it
 *         returns reports that mutation.
 *
 * .note = it lives in `review/prime/poke/`, beside its fault predicates: only a prime
 *         sends it — the lane prime and the partition prime, before a pour — so it
 *         sits under the prime it serves (rule.prefer.most-common-denominator)
 */
export const setOnePrefixPoke = async (
  input: {
    cwd: string;
    reviewer: string;
    head: string;
    tail: string;
    /**
     * the time this poke may wait; null takes `MS_OF_POKE_TIMEOUT`. a caller may only
     * SHORTEN the wedge bound — a prime passes the time its lane has left, a test a tiny
     * bound to fire it — never lengthen it
     */
    msOfTimeout: number | null;
  },
  context: { brain: ContextBrain<BrainChoice> },
): Promise<{
  promptTokens: number;
  cacheGetTokens: number;
  cost: string;
  /** the provider's own metrics, whole — a partition prime records them as a run's realized figures */
  metrics: Awaited<
    ReturnType<ContextBrain<BrainChoice>['brain']['choice']['ask']>
  >['metrics'];
  /** who served the poke, where the brain package reported it */
  supply: ReviewRunMetricsRealized['supply'];
  /**
   * each fault the transient retry swallowed before the ask that answered. any may have
   * been billed with no figures reported, so a caller that records a run's spend must
   * weigh them (`isFaultOfUnbilledCall`)
   */
  faultsSwallowed: { error: unknown }[];
}> => {
  // the head rides as a brief, which is the system slot the affinity pin derives from.
  // one file per head, so two primes of one reviewer never overwrite each other's head
  const headBrief = genArtifactGitFile({
    uri: asPrefixPokeHeadPath({
      cwd: input.cwd,
      reviewer: input.reviewer,
      head: input.head,
    }),
  });
  await headBrief.set({ content: input.head });

  // the wedge bound — the declared default, or a caller's shorter bound, never a longer one
  const msOfTimeout = getOneMsOfPokeWait({
    msOfCaller: input.msOfTimeout,
    msOfWedge: MS_OF_POKE_TIMEOUT,
  });

  // each fault the retry swallows, so the caller can weigh it in a run's spend
  // .note = deliberate mutation, in a scoped zone: the retry reports each via `onRetry`
  const faultsSwallowed: { error: unknown }[] = [];

  // ask under the wedge bound, through the transient retry — the same two policies
  // the review ask wears (`getOneReviewAnswerOfBrain`), so one act has one timeout
  // mechanism and one retry policy. the deadline is outermost, so it bounds every
  // ask together, and its `signal` gates the retry: no new ask is billed after the
  // bound elapsed
  const answer = await withDeadline(
    {
      timeoutMs: msOfTimeout,
      operation: async ({ signal }) =>
        await withTransientBrainRetry({
          signal,
          operation: async () =>
            await context.brain.brain.choice.ask({
              // the shared constructor, never a literal — it is the ONE place the
              // review's brief list and this one are held equal, and the pin this
              // poke pays for is derived from that list (`asRoleOfSharedPrefix`)
              role: asRoleOfSharedPrefix({ prefix: headBrief }),
              prompt: `${input.tail}${ASK_OF_POKE}`,
              schema: { output: schemaOfPokeAck },
            }),
          delays: DELAYS_OF_TRANSIENT_POKE_RETRY,
          // a swallowed fault reports no figures; it is handed back, and each caller
          // decides how to weigh it (a prime refuses to state a total)
          onRetry: (event) => void faultsSwallowed.push(event),
        }),
    },
    { msOfBound: msOfTimeout },
  ).catch((error: unknown) => {
    // the wedge is the PROVIDER's, so it rejects as a brain call fault — never as a
    // class that names a defect in our own code. the deadline's own timeout rides as
    // the cause, so the fault row still quotes the bound it waited. a rejection,
    // never a nil answer: a nil would be recorded as a free poke of zero tokens
    // (rule.forbid.failhide). every other fault passes through as itself
    if (!(error instanceof ReviewTimeoutError)) throw error;
    throw new ReviewBrainCallError({ error });
  });

  // prompt tokens by the meter's own definition, so a poke row and a review row
  // can never disagree on what "prompt" counts
  const { metrics } = answer;
  return {
    promptTokens: getOnePromptTokens({
      tokens: {
        input: metrics.size.tokens.input,
        cacheSet: metrics.size.tokens.cache.set,
        cacheGet: metrics.size.tokens.cache.get,
      },
    }),
    cacheGetTokens: metrics.size.tokens.cache.get,
    cost: asIsoPriceHuman(metrics.cost.cash.total),
    metrics,
    supply: asReviewRunSupplyOfAnswer({ answer }),
    faultsSwallowed,
  };
};
