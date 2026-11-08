import type { ClaudeHookOfRepo } from './ClaudeSettingsOfRepo';
import { TERMS_HOOK_DECLARED } from './TERMS_HOOK_DECLARED';

/**
 * .what = whether one inner hook runs the term hook, whoever wrote it
 * .why = the command fragment is the ownership marker (fulcrum F3): `disable` must leave no
 *        stop that runs the term hook, so it matches an older body or a hand copy too
 */
export const isTermsHookCommand = (input: {
  hook: ClaudeHookOfRepo;
}): boolean =>
  typeof input.hook.command === 'string' &&
  input.hook.command.includes(TERMS_HOOK_DECLARED.fragment);
