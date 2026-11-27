import { existsSync, readFileSync } from 'fs';
import * as path from 'path';

import { asBootSpecNames, type BootSpecMode } from './asBootSpecNames';
import type { EducationRole } from './getOneEducationRole';

/**
 * .what = the mode a linked role's mod must be written in; null for an own or native role
 * .why = rhachet refuses a mod whose mode differs from its role's, and a role with no boot.yml
 *        says all, which is simple mode. so the mod takes the published role's mode, read from
 *        the role's link dir (`.agent/repo=$repo/role=$slug/boot.yml`)
 * .note = an own or native role's spec IS the role's, so its own mode rules and none is owed
 */
export const getOneBootSpecModeOfRole = (input: {
  repoRoot: string;
  role: EducationRole;
}): BootSpecMode | null => {
  if (input.role.kind !== 'linked') return null;
  const at = path.join(
    '.agent',
    `repo=${input.role.repo}`,
    `role=${input.role.slug}`,
    'boot.yml',
  );
  const abs = path.join(input.repoRoot, at);
  if (!existsSync(abs)) return 'simple';
  return (
    asBootSpecNames({ spec: readFileSync(abs, 'utf-8'), at }).mode ?? 'simple'
  );
};
