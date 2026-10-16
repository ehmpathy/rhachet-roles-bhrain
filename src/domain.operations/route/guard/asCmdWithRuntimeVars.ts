import { UnexpectedCodePathError } from 'helpful-errors';

import { PATTERN_OF_RUNTIME_VARS } from './PATTERN_OF_RUNTIME_VARS';
import {
  isRuntimeGuardVarName,
  type RuntimeGuardVarName,
} from './RUNTIME_GUARD_VAR_NAMES';

/**
 * .what = a guard command with every runtime var replaced by its value
 * .why = the judge run and the review run each substitute the same var grammar.
 *        the NAME list was shared and the MECHANISM was not, so a change to escape,
 *        anchor, or order semantics had two homes. one transformer holds it now, and
 *        each consumer supplies only its own name→value map
 *
 * .note = one pass, with a replacer FUNCTION. so a value is inserted byte for byte —
 *         a `$&` or `$1` inside a path is never read as a replacement pattern — and
 *         an inserted value is never re-scanned for a var name
 */
export const asCmdWithRuntimeVars = (input: {
  cmd: string;
  valueByName: Record<RuntimeGuardVarName, string>;
}): string =>
  input.cmd.replace(new RegExp(PATTERN_OF_RUNTIME_VARS.source, 'g'), (name) => {
    // every match is a declared name while the pattern is built from the one list;
    // a widened pattern that matched aught else halts here, never inserts "undefined"
    if (!isRuntimeGuardVarName(name))
      throw new UnexpectedCodePathError(
        'runtime var pattern matched a token that is not a declared var name',
        { name },
      );
    return input.valueByName[name];
  });
