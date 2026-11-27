import { asPedigreeDir } from './asPedigreeDir';
import { asPedigreeDirRendered } from './asPedigreeDirRendered';
import type { EducationRole } from './getOneEducationRole';

/**
 * .what = every dir a role's pedigree entries are read from, repo-relative, the write dir last
 * .why = a linked role's mod writes its index at the path the publisher's index holds, and
 *        rhachet lets a mod file shadow a held path. so the index is rebuilt from the shipped
 *        entries (the rendered view) and the mod's own, or the shipped rows drop from the boot
 */
export const asPedigreeDirsOfRole = (input: {
  role: EducationRole;
}): string[] => {
  const dirRendered = asPedigreeDirRendered({ role: input.role });
  const dirWrite = asPedigreeDir({ role: input.role });
  return dirRendered ? [dirRendered, dirWrite] : [dirWrite];
};
