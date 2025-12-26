import { RoleRegistry } from 'rhachet';

import { ROLE_BRAIN } from '@src/roles/brain/getBrainRole';
import { BHRAIN_REGISTRY_README } from '@src/roles/getRoleRegistry.readme';
import { ROLE_REVIEWER } from '@src/roles/reviewer/getReviewerRole';
import { ROLE_THINKER } from '@src/roles/thinker/getThinkerRole';

/**
 * .what = returns the core registry of predefined roles and skills
 * .why =
 *   - enables CLI or thread logic to load available roles
 *   - avoids dynamic loading or global mutation
 */
export const getRoleRegistry = (): RoleRegistry =>
  new RoleRegistry({
    slug: 'bhrain',
    readme: BHRAIN_REGISTRY_README,
    roles: [ROLE_THINKER, ROLE_REVIEWER, ROLE_BRAIN],
  });
