import { RUNTIME_GUARD_VAR_NAMES } from './RUNTIME_GUARD_VAR_NAMES';

/**
 * .what = the one pattern that matches any runtime var name, longest name first
 * .why = an alternation tries its branches in order, so a longer name placed first
 *        wins over a shorter name it contains (`$routeId` over `$route`). the order
 *        is computed, never assumed of the const
 *
 * .note = shared by the substitution (`asCmdWithRuntimeVars`) and the presence check
 *         (`isCmdOfRuntimeVar`), so the two never disagree on what a var token is
 *
 * 🔴 .note = it carries no `g` flag, deliberately. a global regex holds `lastIndex` state,
 *     so a shared one read via `.test` or `.exec` answers differently on a second call.
 *     each consumer builds its own global copy from `.source` at the call site
 */
export const PATTERN_OF_RUNTIME_VARS = new RegExp(
  [...RUNTIME_GUARD_VAR_NAMES]
    .sort((a, b) => b.length - a.length)
    .map((name) => `\\${name}`)
    .join('|'),
);
