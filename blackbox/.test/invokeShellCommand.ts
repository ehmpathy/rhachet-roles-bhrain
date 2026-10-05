import { execAsync } from './execAsync';

/**
 * .what = runs a shell command and returns its stdout, stderr, and exit code, success or not
 * .why = a refusal suite must read the exit code of a command that is meant to fail. exec throws
 *        on a non-zero exit; only that throw carries a numeric `code`, so it alone is caught and
 *        returned. aught else is a defect in the harness, and rethrows rather than reads as exit 1
 */
export const invokeShellCommand = async (input: {
  cmd: string;
  cwd: string;
  env: NodeJS.ProcessEnv;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  try {
    const result = await execAsync(input.cmd, {
      cwd: input.cwd,
      env: input.env,
    });
    return { ...result, code: 0 };
  } catch (error) {
    // only an exec failure carries a numeric exit code; aught else is a defect, so rethrow it
    const execError = error as {
      stdout?: string;
      stderr?: string;
      code?: unknown;
    };
    if (typeof execError.code !== 'number') throw error;
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: execError.code,
    };
  }
};
