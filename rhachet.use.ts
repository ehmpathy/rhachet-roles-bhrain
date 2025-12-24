import type { InvokeHooks, RoleRegistry } from 'rhachet';

import { getRoleRegistry as getRoleRegistryBhuild, getInvokeHooks as getInvokeHooksBhuild } from 'rhachet-roles-bhuild';
import { getRoleRegistry as getRoleRegistryEhmpathy, getInvokeHooks as getInvokeHooksEhmpathy } from 'rhachet-roles-ehmpathy';
import { getRoleRegistry as getRoleRegistryBhrain, getInvokeHooks as getInvokeHooksBhrain } from './dist/index.js';

export const getRoleRegistries = (): RoleRegistry[] => [getRoleRegistryBhuild(), getRoleRegistryEhmpathy(), getRoleRegistryBhrain()];
export const getInvokeHooks = (): InvokeHooks[] => [getInvokeHooksBhuild(), getInvokeHooksEhmpathy(), getInvokeHooksBhrain()];
