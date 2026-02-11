import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * .what = invoke the init.research skill via shell entrypoint
 * .why = acceptance tests exercise the full skill invocation flow
 */
export const invokeResearchSkill = async (input: {
  cwd: string;
  args: string;
}): Promise<{
  stdout: string;
  stderr: string;
  code: number;
}> => {
  const skillPath =
    '.agent/repo=bhrain/role=librarian/skills/init.research.sh';
  const cmd = `bash "${skillPath}" ${input.args}`;

  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: { ...process.env },
    });
    return {
      stdout: result.stdout,
      stderr: result.stderr,
      code: 0,
    };
  } catch (error) {
    // exec throws on non-zero exit
    const execError = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: execError.code ?? 1,
    };
  }
};

/**
 * .what = strip ansi codes from output for snapshot comparison
 * .why = ansi codes differ across terminals, snapshots should be clean
 */
export const stripAnsi = (str: string): string => {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
};

/**
 * .what = convert output to stable snapshot-safe format
 * .why = dates and paths differ across runs, need stable output
 */
export const asSnapshotSafe = (str: string): string => {
  return (
    stripAnsi(str)
      // stable dates like v2026_02_10 to v<DATE>
      .replace(/v\d{4}_\d{2}_\d{2}/g, 'v<DATE>')
      // stable branch names to <BRANCH>
      .replace(/branch [^\s<>]+ <->/g, 'branch <BRANCH> <->')
  );
};
