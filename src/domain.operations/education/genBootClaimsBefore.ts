import { existsSync, writeFileSync } from 'fs';

import { asBootClaimsBeforePath } from './asBootClaimsBeforePath';
import { getAllBriefClaimsOfRole } from './getAllBriefClaimsOfRole';
import type { EducationRole } from './getOneEducationRole';

/**
 * .what = findsert the boot claim of each brief the role holds, into the course route
 * .why = the proof compares each claim at exit to this record, so a boot spec the course writes
 *        cannot move a brief the role held out of `say` with no course yield to name it
 * .note = findsert: a re-entry of the course keeps the record of its first init
 * .note = a linked role writes no record, since a mod cannot narrow its package's boot
 */
export const genBootClaimsBefore = (input: {
  repoRoot: string;
  role: EducationRole;
  route: string;
}): { at: string | null } => {
  const at = asBootClaimsBeforePath({
    repoRoot: input.repoRoot,
    route: input.route,
  });
  if (existsSync(at)) return { at };
  const claims = getAllBriefClaimsOfRole({
    repoRoot: input.repoRoot,
    role: input.role,
  });
  if (claims === null) return { at: null };
  writeFileSync(at, `${JSON.stringify(claims, null, 2)}\n`);
  return { at };
};
