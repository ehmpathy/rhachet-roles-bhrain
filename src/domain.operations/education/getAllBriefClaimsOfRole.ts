import { existsSync, readdirSync, readFileSync } from 'fs';
import * as path from 'path';

import { compareStrings } from '@src/utils/compareStrings';

import { asBootClaim } from './asBootClaim';
import { asBootSpecNames } from './asBootSpecNames';
import type { EducationRole } from './getOneEducationRole';

/**
 * .what = the boot claim of each brief a role holds, keyed by its path relative to the spec's dir
 * .why = a boot spec a course writes can move a brief the role held from `say` to `ref`, or out
 *        of the boot, and a role with no spec boots every brief at `say`; a read of each claim,
 *        before the course and after, is how the proof sees a move no course yield names
 * .note = the pedigree subtree (`briefs/education/`) is left out, since each graduation adds to it
 * .note = null for a linked role: a mod adds to its package's boot and cannot narrow it
 */
export const getAllBriefClaimsOfRole = (input: {
  repoRoot: string;
  role: EducationRole;
}): Record<string, 'say' | 'ref' | null> | null => {
  if (input.role.kind === 'linked') return null;
  const roleDir = path.dirname(input.role.bootPath);
  const briefsAbs = path.join(input.repoRoot, input.role.briefsDir);
  if (!existsSync(briefsAbs)) return {};

  // the spec as it stands; absent, it reads as a role spec with no section, which says all
  const bootAbs = path.join(input.repoRoot, input.role.bootPath);
  const names = asBootSpecNames({
    spec: existsSync(bootAbs) ? readFileSync(bootAbs, 'utf-8') : '',
    at: input.role.bootPath,
  });

  // each brief file, outside the pedigree subtree, with its claim
  const paths = readdirSync(briefsAbs, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) =>
      path.join(path.relative(input.repoRoot, entry.parentPath), entry.name),
    )
    .filter(
      (p) =>
        path.relative(input.role.briefsDir, p).split(path.sep)[0] !==
        'education',
    )
    .map((p) => path.relative(roleDir, p))
    .sort(compareStrings);
  return Object.fromEntries(
    paths.map((p) => [
      p,
      asBootClaim({
        curation: names.briefs,
        mode: names.mode,
        isRoleSpec: true,
        path: p,
      }),
    ]),
  );
};
