import { DomainLiteral } from 'domain-objects';
import type { IsoPrice } from 'iso-price';

import type { TokenCategory } from './TokenBlock';
import type { TokenTier } from './TokenHeld';

/**
 * .what = a price, with the tokens its spec could not price beside it
 * .why = a rate the spec lacks is never guessed; the reader sees both parts
 */
export interface TokenPriceSum {
  price: IsoPrice | null;
  unpricedTokens: number;

  /**
   * the price of each kind of token; null where no rate prices that kind, so a reader
   * sees which span a cost sits in (a cache read costs a tenth of a raw input)
   */
  byKind: TokenPriceByKind;
}

/**
 * .what = a price per kind of token
 */
export interface TokenPriceByKind {
  input: IsoPrice | null;
  output: IsoPrice | null;
  cacheRead: IsoPrice | null;
  cacheWrite5m: IsoPrice | null;
  cacheWrite1h: IsoPrice | null;
}

/**
 * .what = token counts by kind; the efficiency half of the report
 */
export interface TokenSpendEfficiency {
  inputRaw: number;
  cacheRead: number;
  cacheWrite5m: number;
  cacheWrite1h: number;
  output: number;
  priced: TokenPriceSum;
  models: string[];
}

/**
 * .what = one inventory row: what the context held at the last call, per category
 */
export interface TokenSpendInventoryRow {
  category: TokenCategory;
  tokens: number;
  tiers: TokenTier[];
  labels: { label: string; tokens: number }[];

  /**
   * in a corpus, this category's share of each transcript's last-call context, at the
   * 10th, 50th, and 90th percentile across transcripts; null for one transcript
   */
  spread: { p10: number; p50: number; p90: number } | null;
}

/**
 * .what = one repaid row: what a category·label cost over every call it sat in context
 */
export interface TokenSpendRepaidRow {
  category: TokenCategory;
  label: string;
  tokens: {
    cacheRead: number;
    cacheWrite5m: number;
    cacheWrite1h: number;
    input: number;
  };
  priced: TokenPriceSum;

  /**
   * the single largest block under this row: the call it arrived at, its size, and
   * how many calls carried it. null in a corpus, where a call ordinal names no one file
   */
  peak: { arrivedAtCall: number; tokens: number; calls: number } | null;
}

/**
 * .what = a context re-base, by its cause, at the call it took effect
 */
export interface TokenSpendRebase {
  /**
   * the transcript the rebase occurred in; a call ordinal names a place only within it
   */
  transcript: string;
  call: number;
  cause: 'compaction' | 'shrink';
  from: number;
  to: number;
}

/**
 * .what = one corpus file that could not be read, and why
 * .why = a corpus skips a bad file rather than halt; the bucket says whether the file is
 *        corrupt (`malformed`) or merely empty of meter data (`unmetered`), so neither reads
 *        as the other — and neither is silently folded in as zeros
 */
export interface TokenSpendSkip {
  path: string;
  kind: 'malformed' | 'unmetered';
  reason: string;

  /**
   * the torn line, as `N of M`, where the file is malformed; null where the cause has no
   * line (a file with no metered call), so a human can open the file at the fault
   */
  line: string | null;
}

/**
 * .what = one transcript a report read, and how it was chosen
 */
export interface TokenSpendTranscript {
  path: string;
  chosenBy: string;

  /**
   * the parent session uuid, where the file is a subagent transcript passed by its own
   * path; null for a main transcript
   */
  subagentOf: string | null;
}

/**
 * .what = the full report of where a transcript's (or a corpus's) tokens went
 * .why = efficiency says how much; inventory says on what; repaid says what each part
 *        cost to keep; the proposal ranks the targets by that cost
 */
export interface TokenSpendReport {
  transcripts: TokenSpendTranscript[];
  skipped: TokenSpendSkip[];

  /**
   * caveats a reader needs to read the inventory right — e.g. the base held no
   * `boot.instructions`, so the boot share sits inside `base.unattributed`
   */
  notes: string[];
  partialLinesSkipped: number;
  calls: number;
  efficiency: TokenSpendEfficiency;
  contextPerCall: { median: number; peak: number } | null;
  inventory: TokenSpendInventoryRow[];
  repaid: TokenSpendRepaidRow[];
  rebases: TokenSpendRebase[];
  subagents: {
    path: string;
    calls: number;
    tokens: number;
    priced: TokenPriceSum;
  }[];
  tokensPerByte: number | null;
}

export class TokenSpendReport
  extends DomainLiteral<TokenSpendReport>
  implements TokenSpendReport {}
