import { DomainLiteral } from 'domain-objects';

/**
 * .what = citation linking rule to origin feedback
 * .why = enables provenance track for each rule
 */
export interface ReviewerReflectRuleCitation {
  /**
   * exact quote from feedback
   */
  quote: string;

  /**
   * github url to feedback file
   */
  url: string;
}

/**
 * .what = proposed rule extracted from feedback
 * .why = represents a generalized insight before blend
 */
export interface ReviewerReflectRuleProposal {
  /**
   * file path in pure/ directory
   */
  path: string;

  /**
   * directive: forbid, avoid, prefer, require
   */
  directive: 'forbid' | 'avoid' | 'prefer' | 'require';

  /**
   * topic in kebab-case
   */
  topic: string;

  /**
   * full markdown content of the rule
   */
  content: string;

  /**
   * citations to origin feedback
   */
  citations: ReviewerReflectRuleCitation[];
}

export class ReviewerReflectRuleProposal
  extends DomainLiteral<ReviewerReflectRuleProposal>
  implements ReviewerReflectRuleProposal {}
