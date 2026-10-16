import type { IsoPriceHuman } from 'iso-price';
import type { IsoDuration } from 'iso-time';

/**
 * .what = the payload `metrics.realized.json` carries — the measured tokens,
 *         spend, and wall time of one review run, plus a pointer to the peer
 *         artifact that records what the prompt was made of
 *
 * .why = a shared declaration for the write side and the read side, so a
 *        rename cannot leave the reader coerce an absent field to `0` and
 *        report a measured figure that is wrong — the `absence reads as
 *        zero` shape `rule.forbid.failhide` forbids, and the boundary a run's
 *        cost must never be guessed across.
 *
 * .note = it mirrors `NAME_OF_RUN_ARTIFACT`, one layer in. that constant
 *         unifies the artifacts' filenames so a reader and a writer cannot
 *         drift on which file; this unifies one artifact's fields so they
 *         cannot drift on what is inside it.
 *
 * .note = the read side binds through `Partial<…>` rather than this type
 *         directly, because a file on disk is untrusted input and its fields
 *         are genuinely optional to a parser. the link is the field names —
 *         `Partial` carries them, so a rename here fails both sides at compile
 *         time rather than at a silent `0`.
 */
export interface ReviewRunMetricsRealized {
  /** the four token counts the provider billed, exactly as it reported them */
  tokens: {
    input: number;
    inputCacheCreation: number;
    inputCacheRead: number;
    output: number;
  };
  /** the spend, per billed dimension, plus the total the meter reads */
  cost: {
    input: IsoPriceHuman;
    cacheWrite: IsoPriceHuman;
    cacheRead: IsoPriceHuman;
    output: IsoPriceHuman;
    total: IsoPriceHuman;
  };
  /** wall time of the brain call */
  time: IsoDuration;
  /**
   * who served the call, as the brain package reported it
   *
   * .why = a cache read of zero has two causes that look identical in the token
   *        counts: a replica that held no copy of the prefix, and a host that
   *        does not cache at all. the served provider and its generation id are
   *        what part the two, after the fact
   *
   * .note = each field is null where the brain package reported no supply — a
   *         brain other than openrouter declares none, and openrouter itself may
   *         omit the provider on a reply. null states "unreported", never "none"
   */
  supply: {
    /** the upstream host that served the call, e.g. `DeepSeek` or `Together` */
    provider: string | null;
    /** the id the router keeps for this one call, to audit it on its side */
    generationId: string | null;
  };
  /**
   * the filename of the peer artifact that records the prompt's composition
   *
   * .note = a pointer rather than an inlined census, because a run that
   *         compiles a prompt and then dies writes no realized metrics at all;
   *         its composition must survive that.
   * .note = null where the run compiled no prompt — a lane prime sends a head alone and
   *         writes no compiled artifact, so a pointer there would name a file that is absent
   */
  compiled: string | null;
  /**
   * the asks whose reply ran to the output limit before the ask that answered
   *
   * .why = each such ask was billed in full, and the brain's answer carries only the ask
   *        that answered. their spend is ALREADY summed into `tokens` and `cost` above, so
   *        a reader of the totals never under-reads the bill; this list attributes it
   *
   * .note = empty on a run with no runaway. absent on a file written before it existed,
   *         which a reader treats as empty — such a run had no retry to fold
   */
  runaways: ReviewRunRunawayAsk[];
}

/**
 * .what = the spend of one ask whose reply ran to the output limit, with no verdict
 * .why = its output tokens are what the provider billed; its prompt was the same prompt the
 *        answered ask sent, so its input is that count, priced at the full input rate off
 *        the brain's rate card — an upper bound, since a cache hit on it would have cost
 *        less. the meter must never under-report, so the unknown cache split is priced high
 */
export interface ReviewRunRunawayAsk {
  /** who served the runaway ask; null where the brain package did not report it */
  supply: {
    provider: string | null;
    generationId: string | null;
  };
  /** the prompt tokens sent and the output tokens billed */
  tokens: { input: number; output: number };
  /** the spend those tokens bought, at the brain's rate card */
  cost: { input: IsoPriceHuman; output: IsoPriceHuman; total: IsoPriceHuman };
  /** how each figure was found, so no reader mistakes an upper bound for a bill */
  basis: typeof BASIS_OF_RUNAWAY_ASK;
}

/**
 * .what = the one statement of how a runaway ask's figures were found
 * .why = a literal type, so the artifact can never claim a different basis than the code
 */
export const BASIS_OF_RUNAWAY_ASK =
  'output tokens as the provider billed them; input tokens as the answered ask sent the same prompt, priced at the full input rate of the rate card (an upper bound)' as const;

/**
 * .what = the shape a reader may assume of a `metrics.realized.json` off disk
 * .why = every level may be absent on an old or corrupt file, and the field names
 *        still come from the one declaration above. the peer of
 *        `ReviewRunArgsRecordRead` and `ReviewRunMetricsCompiledRead`, so all three
 *        run files are read through a read shape declared beside their writer
 */
export type ReviewRunMetricsRealizedRead = {
  tokens?: Partial<ReviewRunMetricsRealized['tokens']>;
  cost?: Partial<ReviewRunMetricsRealized['cost']>;
  time?: ReviewRunMetricsRealized['time'];
  supply?: Partial<ReviewRunMetricsRealized['supply']>;
  compiled?: ReviewRunMetricsRealized['compiled'];
  runaways?: Partial<ReviewRunRunawayAsk>[];
};
