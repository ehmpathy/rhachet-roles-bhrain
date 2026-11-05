import { DomainLiteral } from 'domain-objects';
import type { IsoPrice } from 'iso-price';

/**
 * .what = the per-token price of each token kind, for one model
 * .why = a cache read, a cache write and a raw input differ in price by up to 40x,
 *        so a block's cost depends on which span of the prompt it sat in
 *
 * .note = a null rate means the brain atom spec does not carry it; tokens at that
 *         rate render `unpriced`, never guessed
 */
export interface TokenRates {
  /**
   * the model id these rates price, as the transcript names it
   */
  model: string;

  input: IsoPrice | null;
  output: IsoPrice | null;
  cacheRead: IsoPrice | null;
  cacheWrite5m: IsoPrice | null;
  cacheWrite1h: IsoPrice | null;
}

export class TokenRates
  extends DomainLiteral<TokenRates>
  implements TokenRates {}
