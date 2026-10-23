import { BadRequestError } from 'helpful-errors';

/**
 * .what = whether an error is a caller-fixable constraint (exit 2), from any helpful-errors copy
 * .why = `instanceof BadRequestError` sees only THIS package's helpful-errors copy. a dependency
 *        such as rhachet throws its `ConstraintError` from its own copy, so `instanceof` misses it
 *        and the refusal escapes as a raw stack trace. every helpful-errors constraint carries
 *        `code.exit = 2`, which holds across copies
 */
export const isCallerConstraintError = (error: unknown): error is Error => {
  // this package's own constraint class
  if (error instanceof BadRequestError) return true;

  // a constraint from another helpful-errors copy
  if (!(error instanceof Error)) return false;
  const code: unknown = Reflect.get(error, 'code');
  if (typeof code !== 'object' || code === null) return false;
  return Reflect.get(code, 'exit') === 2;
};
