import { Role } from 'rhachet';

/**
 * .what = researcher role definition
 * .why = enables discovery of what the repo does not yet hold, so the librarian has
 *        knowledge to curate. the seam: a librarian curates, a researcher acquires
 */
export const ROLE_RESEARCHER: Role = Role.build({
  slug: 'researcher',
  name: 'Researcher',
  purpose: 'discover what is not yet held',
  readme: { uri: __dirname + '/readme.md' },
  boot: { uri: __dirname + '/boot.yml' },
  traits: [],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
  hooks: {
    onBrain: {
      onBoot: [
        {
          command: './node_modules/.bin/rhachet roles boot --role researcher',
          timeout: 'PT30S',
        },
      ],
    },
  },
});
