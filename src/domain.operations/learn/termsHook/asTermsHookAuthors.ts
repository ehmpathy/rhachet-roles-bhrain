import type { ClaudeHookOfRepo } from './ClaudeSettingsOfRepo';

/**
 * .what = the author of each term hook entry, in order, `(no author)` where none is set
 * .why = a write that removes an entry names whose it was; a hand copy may carry no author,
 *        and an empty string would read as a fault rather than as the plain fact
 */
export const asTermsHookAuthors = (input: {
  hooks: ClaudeHookOfRepo[];
}): string[] => input.hooks.map((hook) => hook.author ?? '(no author)');
