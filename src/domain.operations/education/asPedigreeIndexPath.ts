import * as path from 'path';

import { asPedigreeDir } from './asPedigreeDir';
import type { EducationRole } from './getOneEducationRole';

/**
 * .what = the pedigree root brief of a role, repo-relative: `$briefsDir/education/pedigree._.md`
 * .why = one home for the name the stamp writes, the boot spec cites, and the judge reads
 */
export const asPedigreeIndexPath = (input: { role: EducationRole }): string =>
  path.join(asPedigreeDir({ role: input.role }), 'pedigree._.md');
