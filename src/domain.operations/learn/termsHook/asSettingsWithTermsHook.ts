import { asSettingsWithoutTermsHook } from './asSettingsWithoutTermsHook';
import type { ClaudeSettingsOfRepo } from './ClaudeSettingsOfRepo';
import { TERMS_HOOK_DECLARED } from './TERMS_HOOK_DECLARED';

/**
 * .what = a settings object that holds exactly one term hook entry, the declared one
 * .why = `enable` converges: an older body, a second copy, or a hand copy under another
 *        author is replaced, so after any run the file holds one entry rhachet will not prune
 *
 * .note = the entry rides in its own `{ matcher, hooks }` block at the end of the Stop list,
 *         so the other Stop hooks keep their order
 */
export const asSettingsWithTermsHook = (input: {
  settings: ClaudeSettingsOfRepo | null;
}): ClaudeSettingsOfRepo => {
  // start from a slate with no term hook
  const settingsClean = asSettingsWithoutTermsHook({
    settings: input.settings,
  });

  // append the declared entry to the Stop event
  const hooks = settingsClean.hooks ?? {};
  const blocksStop = hooks[TERMS_HOOK_DECLARED.event] ?? [];
  return {
    ...settingsClean,
    hooks: {
      ...hooks,
      [TERMS_HOOK_DECLARED.event]: [
        ...blocksStop,
        {
          matcher: TERMS_HOOK_DECLARED.matcher,
          hooks: [{ ...TERMS_HOOK_DECLARED.hook }],
        },
      ],
    },
  };
};
