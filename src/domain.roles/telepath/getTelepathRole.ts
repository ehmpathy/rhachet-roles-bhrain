import { Role } from 'rhachet';

/**
 * .what = telepath role definition
 * .why = enables max signal, min noise transfer between actors, in both directions
 */
export const ROLE_TELEPATH: Role = Role.build({
  slug: 'telepath',
  name: 'Telepath',
  purpose: 'transfer concepts whole, at the fewest words',
  readme: { uri: __dirname + '/readme.md' },
  boot: { uri: __dirname + '/boot.yml' },
  traits: [],
  skills: {
    dirs: [],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
  hooks: {
    onBrain: {
      onBoot: [
        {
          command: './node_modules/.bin/rhachet roles boot --role telepath',
          timeout: 'PT30S',
        },
      ],
    },
  },
});
