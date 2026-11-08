import { isDeepStrictEqual } from 'util';

import type {
  ClaudeHookOfRepo,
  ClaudeSettingsOfRepo,
} from './ClaudeSettingsOfRepo';
import { isTermsHookCommand } from './isTermsHookCommand';
import { TERMS_HOOK_DECLARED } from './TERMS_HOOK_DECLARED';

/**
 * .what = whether the term hook is off, on as declared, or on with drift to repair
 */
export type TermsHookStatus = 'off' | 'current' | 'drifted';

/**
 * .what = whether one inner hook is exactly the entry `enable` writes
 * .why = `enable` is a no-op only when the one entry found is the declared one, whole: a
 *        field the writer adds counts here too, and a foreign extra key counts as drift
 */
const isTermsHookDeclared = (input: { hook: ClaudeHookOfRepo }): boolean =>
  isDeepStrictEqual(input.hook, TERMS_HOOK_DECLARED.hook);

/**
 * .what = the term hook's state in a parsed settings object
 * .why = one read every verb shares: `get` reports it, `enable` and `disable` decide from it
 *        whether to write
 *
 * .note = `status` is `off` when no entry runs the term hook, `current` when exactly one does
 *         and it is the declared one, and `drifted` otherwise: a second copy, an older body,
 *         or a foreign author, which `enable` rewrites and `get` names
 * .note = `drifted` lists the entries `enable` must replace or remove: every one found, less
 *         the one declared copy it keeps if one is there, and `drift` is their count. so two
 *         byte-identical declared copies are a drift of one, never of two
 */
export const getOneTermsHookState = (input: {
  settings: ClaudeSettingsOfRepo | null;
}): {
  status: TermsHookStatus;
  drift: number;
  found: ClaudeHookOfRepo[];
  drifted: ClaudeHookOfRepo[];
} => {
  const found = Object.values(input.settings?.hooks ?? {})
    .flat()
    .flatMap((block) => block.hooks ?? [])
    .filter((hook) => isTermsHookCommand({ hook }));
  const indexDeclared = found.findIndex((hook) =>
    isTermsHookDeclared({ hook }),
  );
  const drifted = found.filter((_, index) => index !== indexDeclared);
  const drift = drifted.length;
  const status: TermsHookStatus =
    found.length === 0 ? 'off' : drift === 0 ? 'current' : 'drifted';
  return { status, drift, found, drifted };
};
