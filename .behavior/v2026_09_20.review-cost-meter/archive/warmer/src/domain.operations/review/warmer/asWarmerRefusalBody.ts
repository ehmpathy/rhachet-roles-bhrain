import { asErrorMessage } from '../asErrorMessage';

/**
 * .what = the body of a `--warmer` refusal, with the thrown class's own label cut off
 * .why = helpful-errors writes the class into `.message` — `BadRequestError: ` for the
 *        parent, `✋ ConstraintError: ` for the subclass — so a render that adds its own
 *        `✋ ConstraintError:` header would print two class names for one error. the
 *        header names the class once; this hands it the body alone
 *
 * .note = it takes the caught value as-is and reads `message` off its shape, so a
 *         caller that classifies by constructor NAME (`isErrorOfBadRequest`) needs no
 *         `instanceof` narrow to call it
 */
export const asWarmerRefusalBody = (input: { error: unknown }): string =>
  asErrorMessage({ error: input.error }).replace(
    /^(?:BadRequestError|✋ ConstraintError): /,
    '',
  );
