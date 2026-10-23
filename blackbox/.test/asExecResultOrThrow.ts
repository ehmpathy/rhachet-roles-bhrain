import { asSkillLaunchFailureOrNull } from './asSkillLaunchFailureOrNull';

/**
 * .what = casts an exec rejection into the { stdout, stderr, code } a skill harness returns, or
 *         rethrows any fault that is not a nonzero exit
 * .why  = exec rejects a nonzero exit with an error that carries stdout, stderr, and a numeric
 *         exit code. every other rejection — a spawn ENOENT (whose code is the string 'ENOENT'),
 *         a signal kill (code null), a TypeError inside the harness — is a fault of the fixture,
 *         never a skill result. to fold those into `code: 1` would report a subprocess result that
 *         never happened (rule.forbid.failhide), so they rethrow, loud
 */
export const asExecResultOrThrow = (input: {
  error: unknown;
}): { stdout: string; stderr: string; code: number } => {
  // rethrow any rejection that is not a nonzero exit
  const { error } = input;
  if (!error || typeof error !== 'object') throw error;
  const code: unknown = Reflect.get(error, 'code');
  if (typeof code !== 'number') throw error;

  // a nonzero exit: carry its streams and its code
  const stdoutRaw: unknown = Reflect.get(error, 'stdout');
  const stderrRaw: unknown = Reflect.get(error, 'stderr');
  const stdout = typeof stdoutRaw === 'string' ? stdoutRaw : '';
  const stderr = typeof stderrRaw === 'string' ? stderrRaw : '';

  // a skill that never launched is a harness fault, never a result
  const launchFailure = asSkillLaunchFailureOrNull({ code, stderr });
  if (launchFailure) throw launchFailure;

  return { stdout, stderr, code };
};
