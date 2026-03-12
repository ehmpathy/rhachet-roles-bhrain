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
      {
        at: 'node_modules/rhachet-roles-bhrain/rhachet.repo.yml',
        to: 'rhachet.repo.yml',
      },
      // symlink .bin for npx to find rhx/rhachet commands
      { at: 'node_modules/.bin', to: 'node_modules/.bin' },
      // symlink rhachet so rhx entrypoint can find ../rhachet/bin/rhx
      { at: 'node_modules/rhachet', to: 'node_modules/rhachet' },
      // symlink .pnpm for pnpm-generated wrapper scripts that use relative paths
      // .why = rhx wrapper does $basedir/../.pnpm/... which needs .pnpm to exist
      { at: 'node_modules/.pnpm', to: 'node_modules/.pnpm' },
    ],
  });
};

/**
 * .what = invokes a route skill via its shell entrypoint
 * .why = enables blackbox acceptance tests against the skill as invoked by rhachet
 */
/**
 * .what = sanitizes time values in cli output for stable snapshots
 * .why = time values are machine-dependent and cause flaky snapshots
 */
export const sanitizeTimeForSnapshot = (output: string): string => {
  return output
    .replace(/finished \d+\.\d+s/g, 'finished [TIME]')
    .replace(/done \d+\.\d+s/g, 'done [TIME]')
    .replace(/passed \d+\.\d+s/g, 'passed [TIME]')
    .replace(/failed \d+\.\d+s/g, 'failed [TIME]')
    .replace(/inflight \d+\.\d+s/g, 'inflight [TIME]');
};


export const invokeRouteSkill = async (input: {
  skill:
    | 'route.bind.set'
    | 'route.bind.get'
    | 'route.bind.del'
    | 'route.bounce'
    | 'route.drive'
    | 'route.review'
    | 'route.stone.get'
    | 'route.stone.set'
    | 'route.stone.del'
    | 'route.stone.judge';
  args: Record<string, string | boolean | string[] | undefined>;
  cwd: string;
  env?: Record<string, string>;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  // map skill name to shell command filename
  const skillFile = `${input.skill}.sh`;
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=driver/skills',
    skillFile,
  );

  // build args string; arrays expand to repeated flags
  const argsStr = Object.entries(input.args)
    .filter(([_, v]) => v !== undefined)
    .flatMap(([k, v]) => {
      if (v === true) return [`--${k}`];
      if (Array.isArray(v)) return v.map((val) => `--${k} "${val}"`);
      return [`--${k} "${v}"`];
    })
    .join(' ');

  const cmd = `bash "${skillPath}" ${argsStr}`;

  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: { ...process.env, ...input.env },
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
