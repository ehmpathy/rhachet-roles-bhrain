import { Role } from 'rhachet';

/**
 * .what = learner role definition
 * .why = enables durable retention of knowledge via lesson externalization
 */
export const ROLE_LEARNER: Role = Role.build({
  slug: 'learner',
  name: 'Learner',
  purpose: 'durable retention of knowledge, externalize lessons into briefs',
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
          command: './node_modules/.bin/rhachet roles boot --role learner',
          timeout: 'PT30S',
        },
      ],
    },
  },
});
