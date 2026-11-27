import type { BootSpecCuration, BootSpecMode } from './asBootSpecNames';

/**
 * .what = how a boot spec boots one path: `say`, `ref`, or null when it boots it not at all
 * .why = rhachet's rules differ by mode and by whose spec it is, and each reader must apply
 *        the same ones:
 *        - a path a `say` or `ref` list names is booted there, in every mode
 *        - a role's simple spec with no `say` says all, less what `ref` names
 *        - a role's simple spec with a `say` list refs each path the list leaves out
 *        - a subject spec, and every mod, claims only the paths it names
 * .note = literal paths only; a glob in the spec is not expanded, so a path it alone covers
 *         reads as unclaimed and is named explicitly by the splice
 */
export const asBootClaim = (input: {
  curation: BootSpecCuration;
  mode: BootSpecMode | null;
  isRoleSpec: boolean;
  path: string;
}): 'say' | 'ref' | null => {
  const { curation, path } = input;
  if (curation.say?.includes(path)) return 'say';
  if (curation.ref.includes(path)) return 'ref';

  // only a role's simple spec (or a role spec with no section, which rhachet reads as simple)
  //   claims a path it does not name
  const isSimpleRole = input.isRoleSpec && input.mode !== 'subject';
  if (!isSimpleRole) return null;
  return curation.say === null ? 'say' : 'ref';
};
