import { RoleRegistry } from 'rhachet';

import { ROLE_BRAIN } from '@src/domain.roles/brain/getBrainRole';
import { ROLE_REVIEWER } from '@src/domain.roles/reviewer/getReviewerRole';
import { ROLE_THINKER } from '@src/domain.roles/thinker/getThinkerRole';

/**
 * .what = returns the core registry of predefined roles and skills
 * .why =
 *   - enables CLI or thread logic to load available roles
 *   - avoids dynamic loading or global mutation
 */
export const getRoleRegistry = (): RoleRegistry =>
  new RoleRegistry({
    slug: 'bhrain',
    readme: { uri: __dirname + '/readme.md' },
    roles: [ROLE_THINKER, ROLE_REVIEWER, ROLE_BRAIN],
  });
