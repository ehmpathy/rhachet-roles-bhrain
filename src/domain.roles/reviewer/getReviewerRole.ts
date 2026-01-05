import { Role } from 'rhachet';

/**
 * .what = reviewer role definition
 * .why = enables code review against declared rules via brain invocation
 */
export const ROLE_REVIEWER: Role = Role.build({
  slug: 'reviewer',
  name: 'Reviewer',
  purpose: 'review artifacts against declared rules',
  readme: { uri: __dirname + '/readme.md' },
  traits: [],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [{ uri: __dirname + '/briefs' }],
  },
});
