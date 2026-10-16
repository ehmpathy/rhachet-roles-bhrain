import { PATTERN_OF_RUNTIME_VARS } from './PATTERN_OF_RUNTIME_VARS';
import type { RuntimeGuardVarName } from './RUNTIME_GUARD_VAR_NAMES';

/**
 * .what = whether a guard command names one runtime var
 * .why = "does the command use `$targets`?" must be answered by the same token
 *        match the substitution uses. a raw `includes` was a second rule for one
 *        question, free to drift from the pattern that does the substitution
 */
export const isCmdOfRuntimeVar = (input: {
  cmd: string;
  name: RuntimeGuardVarName;
}): boolean =>
  (input.cmd.match(new RegExp(PATTERN_OF_RUNTIME_VARS.source, 'g')) ?? []).some(
    (token) => token === input.name,
  );
