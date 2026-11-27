import type { EducationRole } from './getOneEducationRole';

/**
 * .what = the boot spec a linked role's mod starts from: `of: <repo>/<role>`, naught else
 * .why = rhachet refuses a mod dir with no boot.yml, and a mod's boot.yml must name the role it
 *        is over; one home for the seed that `pursuit init` writes and `pedigree set` falls back to
 */
export const asModBootSpecSeed = (input: { role: EducationRole }): string =>
  `of: ${input.role.repo}/${input.role.slug}\n`;
