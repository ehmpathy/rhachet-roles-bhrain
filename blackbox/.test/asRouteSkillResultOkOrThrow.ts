import { MalfunctionError } from 'helpful-errors';

/**
 * .what = returns a route skill result when it exited 0; throws, with the child's output, when not
 * .why = `invokeRouteSkill` returns a nonzero exit as a result, since many suites assert on a
 *        refusal. a helper that drives a step it EXPECTS to land — a between-rounds concede, an
 *        absorb — must not drop that result: a dropped refusal turns a failed concede into a
 *        silent no-op, and the journey then fails one step later on a false lead (a concern reads
 *        as undeclared, though the helper was asked to concede it)
 */
export const asRouteSkillResultOkOrThrow = (input: {
  step: string;
  result: { stdout: string; stderr: string; code: number };
}): { stdout: string; stderr: string; code: number } => {
  if (input.result.code === 0) return input.result;
  throw new MalfunctionError(`blackbox helper step failed: ${input.step}`, {
    code: input.result.code,
    stdout: input.result.stdout,
    stderr: input.result.stderr,
  });
};
