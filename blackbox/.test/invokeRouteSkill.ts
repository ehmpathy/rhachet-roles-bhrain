import { exec } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

import { genTempDir } from 'test-fns';

export const execAsync = promisify(exec);

/**
 * .what = creates a temp directory ready for rhachet roles link
 * .why = enables acceptance tests with git repo and node_modules symlink
 */
export const genTempDirForRhachet = (input: {
  slug: string;
  clone: string;
}): string => {
  return genTempDir({
    slug: input.slug,
    clone: input.clone,
    git: true,
    symlink: [
      // symlink rhachet-roles-bhrain package for the driver role
      {
        at: 'node_modules/rhachet-roles-bhrain/package.json',
        to: 'package.json',
      },
      { at: 'node_modules/rhachet-roles-bhrain/dist', to: 'dist' },
      // symlink .bin for npx to find rhx/rhachet commands
      { at: 'node_modules/.bin', to: 'node_modules/.bin' },
    ],
  });
};

/**
 * .what = invokes a route skill via its shell entrypoint
 * .why = enables blackbox acceptance tests against the skill as invoked by rhachet
 */
export const invokeRouteSkill = async (input: {
  skill: 'route.stone.get' | 'route.stone.set' | 'route.stone.del' | 'route.stone.judge';
  args: Record<string, string | boolean | undefined>;
  cwd: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  // map skill name to shell command filename
  const skillFile = `${input.skill}.sh`;
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=driver/skills',
    skillFile,
  );

  // build args string
  const argsStr = Object.entries(input.args)
    .filter(([_, v]) => v !== undefined)
    .map(([k, v]) => {
      if (v === true) return `--${k}`;
      return `--${k} "${v}"`;
    })
    .join(' ');

  const cmd = `bash "${skillPath}" ${argsStr}`;

  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: { ...process.env },
    });
    return { ...result, code: 0 };
  } catch (error) {
    const execError = error as { stdout?: string; stderr?: string; code?: number };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: execError.code ?? 1,
    };
  }
};
