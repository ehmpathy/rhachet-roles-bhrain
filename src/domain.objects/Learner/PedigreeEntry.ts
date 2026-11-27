import { DomainLiteral } from 'domain-objects';

import { PedigreeCourse } from './PedigreeCourse';

/**
 * .what = one graduated pursuit of one role: the courses it took, in order
 * .why = the record a role boots, and a director audits via `education.pedigree get`
 */
export interface PedigreeEntry {
  role: string;
  /** the pursuit dir date, `YYYY_MM_DD` */
  date: string;
  slug: string;
  route: string;
  courses: PedigreeCourse[];
}

export class PedigreeEntry
  extends DomainLiteral<PedigreeEntry>
  implements PedigreeEntry
{
  public static nested = { courses: PedigreeCourse };
}
