import { getAllErrorClassNames } from '@src/utils/getAllErrorClassNames';

/**
 * .what = true when a caught value is a `BadRequestError`, or a subclass of one, from any
 *         copy of `helpful-errors`
 * .why = a caller fault must keep its class so the cli exits 2 on it. the brain call
 *        crosses a dependency (`rhachet`) that loads its own copy of `helpful-errors`, so a
 *        `BadRequestError` it raises need not be the class this repo imports, and
 *        `instanceof` would read a caller fault as a malfunction
 *
 * .note = it reads the class by constructor NAME (`getAllErrorClassNames`), so a
 *         `ConstraintError` that extends `BadRequestError` still counts
 */
export const isErrorOfBadRequest = (input: { error: unknown }): boolean =>
  getAllErrorClassNames({ error: input.error }).includes('BadRequestError');
