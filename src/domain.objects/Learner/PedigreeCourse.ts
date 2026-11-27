import { DomainLiteral } from 'domain-objects';

/**
 * .what = one course, as a pedigree entry cites it
 * .why = the counts a reader scans: the outcome it moved, the greats it read, the claims it
 *        tested, and the briefs and skills it left in the role
 */
export interface PedigreeCourse {
  ordinal: number;
  slug: string;
  buildsOn: string[];
  baseline: string;
  after: string;
  transfer: string;
  greats: string[];
  claimsHeld: number;
  claimsRefuted: number;
  claimsUntested: number;
  briefs: number;
  skills: number;
}

export class PedigreeCourse
  extends DomainLiteral<PedigreeCourse>
  implements PedigreeCourse {}
