import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

export const execAsync = promisify(exec);

/**
 * .what = invokes the review skill via its shell entrypoint
 * .why = enables blackbox acceptance tests against the skill as invoked by rhachet
 *
 * .note = invokes the shell entrypoint directly since `npx rhachet run` requires
 *         the .agent/ directory structure which doesn't exist in temp fixtures.
 *         the shell command is what rhachet ultimately invokes, so this tests
 *         the same code path.
 */
export const invokeReviewSkill = async (input: {
  rules: string;
  paths: string;
  refs?: string | string[];
  output: string;
  mode: 'push' | 'pull';
  goal: 'exhaustive' | 'representative';
  brain?: string;
  cwd: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  // invoke the skill shell entrypoint from the cwd's .agent/ directory
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=reviewer/skills/review.sh',
  );
  // build refs flags (support single string or array)
  const refsFlags = (() => {
    if (!input.refs) return '';
    const refsArray = Array.isArray(input.refs) ? input.refs : [input.refs];
    return refsArray.map((ref) => `--refs "${ref}"`).join(' ');
  })();

  const cmd = [
    `bash "${skillPath}"`,
    `--rules "${input.rules}"`,
    `--paths "${input.paths}"`,
    refsFlags,
    `--output "${input.output}"`,
    `--mode ${input.mode}`,
    `--goal ${input.goal}`,
    input.brain ? `--brain "${input.brain}"` : '',
  ]
    .filter(Boolean)
    .join(' ');

  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: { ...process.env }, // inherit env vars (api keys required)
    });
    return { ...result, code: 0 };
  } catch (error) {
    // exec throws on non-zero exit; extract stdout/stderr/code from error
    const execError = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: execError.code ?? 1,
    };
  }
};
