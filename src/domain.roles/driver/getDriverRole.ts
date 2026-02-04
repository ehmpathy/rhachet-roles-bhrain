import { Role } from 'rhachet';

/**
 * .what = driver role definition
 * .why = enables autonomous navigation of thought routes via stone milestones
 */
export const ROLE_DRIVER: Role = Role.build({
  slug: 'driver',
  name: 'Driver',
  purpose: 'navigate thought routes via stone milestones',
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
