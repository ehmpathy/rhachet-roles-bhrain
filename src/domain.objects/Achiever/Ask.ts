import { DomainLiteral } from 'domain-objects';

/**
 * .what = a recorded peer input with content hash
 * .why = enables deterministic identification and deduplication of asks
 */
export interface Ask {
  /**
   * content hash (sha256 of content)
   * deterministic: same content always yields same hash
   */
  hash: string;

  /**
   * the peer input text
   */
  content: string;

  /**
   * when the ask was received (ISO date string)
   */
  receivedAt: string;
}

export class Ask extends DomainLiteral<Ask> implements Ask {}
