import { DomainLiteral } from 'domain-objects';

import type { TokenBlock } from './TokenBlock';

/**
 * .what = the provider-metered token counts of one call
 * .why = every measured figure in the report traces to these fields of `message.usage`
 *
 * .note = the cache write splits by ttl; `ttl5m` and `ttl1h` are null when the transcript
 *         predates the split, and then the whole write is read as a 5-minute write
 */
export interface TranscriptCallSpend {
  inputRaw: number;
  cacheRead: number;
  cacheWrite: { total: number; ttl5m: number | null; ttl1h: number | null };
  output: number;
}

/**
 * .what = one metered call to the model, deduped by `requestId`
 * .why = the provider meters a request, not a record; one call may span several
 *        assistant records, and a naive sum double-counts them
 */
export interface TranscriptCall {
  /**
   * the ordinal of this call in its file, 1-based, across every metered call
   */
  ordinal: number;

  /**
   * the provider's request id
   */
  requestId: string;

  /**
   * the model id the call names, e.g. `claude-opus-5-5`
   */
  model: string;

  /**
   * true when the call is on the session's own thread — not a sidechain, and the
   * session's own model. only these calls form the context delta sequence
   */
  isMainThread: boolean;

  /**
   * the metered counts, read from the wire's `message.usage`
   */
  spend: TranscriptCallSpend;

  /**
   * the blocks that arrived in the context since the prior main-thread call
   */
  arrivals: TokenBlock[];

  /**
   * true when a compaction boundary sits between the prior main-thread call and this one
   */
  isAfterCompaction: boolean;
}

export class TranscriptCall
  extends DomainLiteral<TranscriptCall>
  implements TranscriptCall {}
