import { DomainLiteral } from 'domain-objects';

import type { TokenCategory } from './TokenBlock';

/**
 * .what = how a held block's token count was found
 * .why = every inventory row names its tier on the same line as its number, so a
 *        reader never quotes an apportioned share as a measured fact
 *
 * - measured = read straight from `usage` (the prior call's `output_tokens`)
 * - exact = the whole remainder of a delta in which ONE category arrived
 * - apportioned = a delta split across several categories by byte share
 * - unattributed = a remainder no record explains
 */
export type TokenTier = 'measured' | 'exact' | 'apportioned' | 'unattributed';

/**
 * .what = a run of tokens that sits in the context from the call it arrived at,
 *         until a compaction or a shrink cuts it, or the transcript ends
 * .why = the inventory is the held blocks alive at the last call; `repaid` is each
 *        held block priced at every call it stayed in context
 */
export interface TokenHeld {
  category: TokenCategory;
  label: string;
  tier: TokenTier;

  /**
   * tokens this block holds in the context
   */
  tokens: number;

  /**
   * the main-thread call index (0-based) at which this block first sat in the prompt
   */
  arrivedAt: number;

  /**
   * the main-thread call index (0-based, exclusive) at which the context dropped it;
   * null when it lived to the last call
   */
  endedAt: number | null;
}

export class TokenHeld extends DomainLiteral<TokenHeld> implements TokenHeld {}
