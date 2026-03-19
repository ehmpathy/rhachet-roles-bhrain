import { Role } from 'rhachet';

/**
 * .what = reflector role definition
 * .why = enables experience capture and reflection preparation
 */
export const ROLE_REFLECTOR: Role = Role.build({
  slug: 'reflector',
  name: 'Reflector',
  purpose: 'preserve experiences, reflect to extract lessons',
  readme: { uri: __dirname + '/readme.md' },
  traits: [],
  skills: {
    dirs: [{ uri: __dirname + '/skills' }],
    refs: [],
  },
  briefs: {
    dirs: [],
  },
});
