import { DomainLiteral } from 'domain-objects';

import type { ReviewerReflectManifestOperation } from './ManifestOperation';

/**
 * .what = manifest entry for a single pure rule proposal
 * .why = captures the planned operation and paths for blend
 */
export interface ReviewerReflectManifestEntry {
  /**
   * path to the rule in pure/ directory
   */
  path: string;

  /**
   * operation to perform on this rule
   */
  operation: ReviewerReflectManifestOperation;

  /**
   * path in sync/ directory (if not OMIT)
   */
  syncPath?: string;

  /**
   * path to rule in target to merge from (if UPDATE/APPEND)
   */
  targetPath?: string;

  /**
   * justification for OMIT operations
   */
  reason?: string;
}

/**
 * .what = manifest of planned operations for reviewer reflect blend
 * .why = enables harness to execute blend plan from brain
 */
export interface ReviewerReflectManifest {
  /**
   * timestamp of when manifest was created
   */
  timestamp: string;

  /**
   * list of pure rules with their planned operations
   */
  pureRules: ReviewerReflectManifestEntry[];
}

export class ReviewerReflectManifest
  extends DomainLiteral<ReviewerReflectManifest>
  implements ReviewerReflectManifest {}
