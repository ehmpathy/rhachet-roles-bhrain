import { existsSync, readFileSync } from 'fs';
import * as path from 'path';

import { asBootClaim } from './asBootClaim';
import { asBootSpecNames } from './asBootSpecNames';
import { asPedigreeDir } from './asPedigreeDir';
import { asPedigreeEntryName } from './asPedigreeEntryName';
import { asPedigreeIndexPath } from './asPedigreeIndexPath';
import type { EducationRole } from './getOneEducationRole';

/**
 * .what = whether the boot spec says the index and boots the entry
 * .why = a role boots only what its boot spec boots, by rhachet's rules for the spec's mode
 *        (`asBootClaim`); an own or native role with no boot spec boots its briefs by default,
 *        so it holds; a linked role's mod must have one
 */
const isBootNamesPedigree = (input: {
  repoRoot: string;
  role: EducationRole;
  indexPath: string;
  entryPath: string;
}): boolean => {
  const bootAbs = path.join(input.repoRoot, input.role.bootPath);
  if (!existsSync(bootAbs)) return input.role.kind !== 'linked';
  const names = asBootSpecNames({
    spec: readFileSync(bootAbs, 'utf-8'),
    at: input.role.bootPath,
  });
  const roleDir = path.dirname(input.role.bootPath);
  const claimOf = (p: string) =>
    asBootClaim({
      curation: names.briefs,
      mode: names.mode,
      isRoleSpec: input.role.kind !== 'linked',
      path: path.relative(roleDir, p),
    });
  return (
    claimOf(input.indexPath) === 'say' && claimOf(input.entryPath) !== null
  );
};

/**
 * .what = the three facts that make one pursuit's pedigree stamped: the entry written, the
 *         index that lists it, and the boot spec that names both
 * .why = one read for every reader that asks "did this pursuit graduate?": the graduate judge,
 *        the retake check of `pursuit init`, and the stamp itself; an entry alone is a half
 *        stamp the role never boots
 * .note = refuses (ConstraintError) a boot spec that does not parse
 */
export const getOnePedigreeStamp = (input: {
  repoRoot: string;
  role: EducationRole;
  date: string;
  slug: string;
}): {
  entry: boolean;
  index: boolean;
  boot: boolean;
  entryPath: string;
  indexPath: string;
} => {
  const entryName = asPedigreeEntryName({ date: input.date, slug: input.slug });
  const entryPath = path.join(asPedigreeDir({ role: input.role }), entryName);
  const indexPath = asPedigreeIndexPath({ role: input.role });
  const indexAbs = path.join(input.repoRoot, indexPath);
  return {
    entry: existsSync(path.join(input.repoRoot, entryPath)),
    index:
      existsSync(indexAbs) &&
      readFileSync(indexAbs, 'utf-8').includes(`\`${entryName}\``),
    boot: isBootNamesPedigree({
      repoRoot: input.repoRoot,
      role: input.role,
      indexPath,
      entryPath,
    }),
    entryPath,
    indexPath,
  };
};
