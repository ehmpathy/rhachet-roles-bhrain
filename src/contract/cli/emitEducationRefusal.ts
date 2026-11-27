import type { BadRequestError } from 'helpful-errors';

import { asEducationRefusalLines } from '@src/contract/cli/asEducationRefusalLines';

/**
 * .what = emit an education refusal to stderr: the qualified header, each fact, then the fix
 * .why = a caller must fix it, so it is a ConstraintError, exit 2, with its fix named
 *        (rule.require.qualified-error-headers, rule.require.errors-name-the-fix)
 */
export const emitEducationRefusal = (input: {
  error: BadRequestError;
}): void => {
  for (const line of asEducationRefusalLines({ error: input.error }))
    console.error(line);
};
