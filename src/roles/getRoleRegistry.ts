import { RoleRegistry } from 'rhachet';

import { BHRAIN_REGISTRY_README } from './getRoleRegistry.readme';
import { ROLE_THINKER } from './thinker/getThinkerRole';

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
    roles: [ROLE_THINKER],
  });
