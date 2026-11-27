import * as path from 'path';

import type { EducationRole } from './getOneEducationRole';

/**
 * .what = where a linked role's pedigree shows in its own rendered dir, repo-relative; null for
 *         an own or native role, whose writes land in place
 * .why = rhachet rebuilds a linked role's own dir from its published form plus its mod
 *        (`setRoleModdedView`). that dir holds the entries the publisher shipped, so a read and
 *        a re-stamp of the index take them in; and a stamp shows there only after a clean render
 */
export const asPedigreeDirRendered = (input: {
  role: EducationRole;
}): string | null =>
  input.role.kind === 'linked'
    ? path.join(
        '.agent',
        `repo=${input.role.repo}`,
        `role=${input.role.slug}`,
        'briefs',
        'education',
      )
    : null;
