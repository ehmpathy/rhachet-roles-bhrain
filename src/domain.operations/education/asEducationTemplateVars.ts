import * as path from 'path';

import { asPedigreeEntryName } from './asPedigreeEntryName';
import { asPursuitRouteParts } from './asPursuitRouteParts';
import type { EducationRole } from './getOneEducationRole';

/**
 * .what = the steps that make a role's next boot read a write, per role kind
 * .why = an own role ships via the build, a linked role via a mod render, a native role is
 *        read live; the stones name the one step owed, never all three
 */
const STEPS_OF_KIND: Record<
  EducationRole['kind'],
  { entool: string; assess: string; graduate: string }
> = {
  own: {
    entool:
      "the role is this repo's own: its briefs land in `src/` and ship with the next build.",
    assess:
      'rebuild first, so the boot reads the new briefs:\n\n```sh\nnpm run build\n```',
    graduate:
      "the role is this repo's own: the pedigree ships with the next build.",
  },
  linked: {
    entool:
      'the role is linked from a package: these writes are a mod over it, at `.agent/repo=.mods/`. its boot spec opens with `of: <repo>/<role>`, which `education.pursuit init` wrote; keep that line, and add the `always:` block below it.',
    assess:
      'render the mod first, so the boot reads it:\n\n```sh\nrhx init --hooks\n```',
    graduate:
      'render the mod, so the next boot reads the pedigree:\n\n```sh\nrhx init --hooks\n```',
  },
  native: {
    entool:
      'the role is native to this repo: the next boot reads these writes as is.',
    assess:
      'the role is native: the next boot reads the new briefs as is, no render owed.',
    graduate: 'the role is native: the next boot reads the pedigree as is.',
  },
};

/**
 * .what = the entool note on the boot spec, for a role with no spec of its own
 * .why = a role with no spec boots every brief at `say`; the stone's own examples write a `say`
 *        key, which would move every other brief of the role to `ref` or out of the boot
 */
const asEntoolBootNote = (input: {
  role: EducationRole;
  bootSpecFound: boolean;
}): string =>
  input.bootSpecFound || input.role.kind === 'linked'
    ? ''
    : `${input.role.slug} has no boot spec (\`${input.role.bootPath}\` is absent), so its next boot says every brief it holds, the new ones too. write no spec: mark each brief row \`boot = say\`. a spec with a \`say\` key would move every other brief of ${input.role.slug} to \`ref\`, or out of the boot, and exit refuses that.`;

/**
 * .what = the template vars every education route shares, for one role and one pursuit
 * .why = pursuit and course stones both name the role, where it lands, and the pursuit route
 */
export const asEducationTemplateVars = (input: {
  role: EducationRole;
  pursuitRoute: string;
  bootSpecFound: boolean;
}): Record<string, string> => {
  const steps = STEPS_OF_KIND[input.role.kind];
  const parts = asPursuitRouteParts({ route: input.pursuitRoute });
  return {
    ROLE: input.role.slug,
    ROLE_REPO: input.role.repo,
    ROLE_KIND: input.role.kind,
    BRIEFS_DIR: input.role.briefsDir,
    SKILLS_DIR: input.role.skillsDir,
    BOOT_PATH: input.role.bootPath,
    PURSUIT_ROUTE: input.pursuitRoute,
    PEDIGREE_ENTRY: parts
      ? path.join(
          input.role.briefsDir,
          'education',
          asPedigreeEntryName({ date: parts.date, slug: parts.slug }),
        )
      : '',
    ENTOOL_RENDER_NOTE: steps.entool,
    ENTOOL_BOOT_NOTE: asEntoolBootNote({
      role: input.role,
      bootSpecFound: input.bootSpecFound,
    }),
    ASSESS_BOOT_STEP: steps.assess,
    GRADUATE_RENDER_STEP: steps.graduate,
  };
};
