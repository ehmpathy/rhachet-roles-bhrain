import * as path from 'path';

import type { EducationRole } from './getOneEducationRole';

/**
 * .what = the dir a role's pedigree lives in, repo-relative: `$briefsDir/education`
 * .why = one home for the write, the read, the boot spec, and the graduate judge
 */
export const asPedigreeDir = (input: { role: EducationRole }): string =>
  path.join(input.role.briefsDir, 'education');
