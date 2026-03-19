import { exec, spawn } from 'child_process';
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
    .replace(/inflight \d+\.\d+s/g, 'inflight [TIME]')
    .replace(/completed \d+\.\d+s/g, 'completed [TIME]')
    .replace(/allowed \d+\.\d+s/g, 'allowed [TIME]')
    .replace(/blocked \d+\.\d+s/g, 'blocked [TIME]');
};


/**
 * .what = invokes the route.mutate guard hook with stdin JSON
 * .why = hook receives tool call context via stdin, not args
 */
export const invokeRouteMutateGuard = async (input: {
  cwd: string;
  stdin: {
    tool_name: 'Read' | 'Write' | 'Edit' | 'Bash';
    tool_input: {
      file_path?: string;
      command?: string;
    };
  };
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=driver/skills',
    'route.mutate.sh',
  );
  const stdinJson = JSON.stringify(input.stdin);

  const cmd = `echo '${stdinJson}' | bash "${skillPath}" guard --mode hook`;

  try {
    const result = await execAsync(cmd, { cwd: input.cwd });
    return { ...result, code: 0 };
  } catch (error) {
    const execError = error as {
      stdout?: string;
      stderr?: string;
      code?: number;
    };
    return {
      stdout: execError.stdout ?? '',
      stderr: execError.stderr ?? '',
      code: execError.code ?? 1,
    };
  }
};

export const invokeRouteSkill = async (input: {
  skill:
    | 'route.bind.set'
    | 'route.bind.get'
    | 'route.bind.del'
    | 'route.bounce'
    | 'route.drive'
    | 'route.mutate'
    | 'route.review'
    | 'route.stone.get'
    | 'route.stone.set'
    | 'route.stone.del'
    | 'route.stone.judge';
  args: Record<string, string | boolean | string[] | undefined>;
  cwd: string;
  env?: Record<string, string>;
  stdin?: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  // map skill name to shell command filename
  const skillFile = `${input.skill}.sh`;
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=driver/skills',
    skillFile,
  );

  // build args array; arrays expand to repeated flags
  const argsArray = Object.entries(input.args)
    .filter(([_, v]) => v !== undefined)
    .flatMap(([k, v]) => {
      if (v === true) return [`--${k}`];
      if (Array.isArray(v)) return v.flatMap((val) => [`--${k}`, val]);
      return [`--${k}`, String(v)];
    });

  // if stdin provided, use spawn to pipe stdin
  if (input.stdin !== undefined) {
    return new Promise((done) => {
      const child = spawn('bash', [skillPath, ...argsArray], {
        cwd: input.cwd,
        env: { ...process.env, ...input.env },
        stdio: ['pipe', 'pipe', 'pipe'], // explicitly set stdin to pipe
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        done({ stdout, stderr, code: code ?? 0 });
      });

      // write stdin and close
      child.stdin.write(input.stdin);
      child.stdin.end();
    });
  }

  // no stdin, use exec (simpler)
  const argsStr = argsArray
    .map((arg) => (arg.startsWith('--') ? arg : `"${arg}"`))
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

/**
 * .what = creates the JSON stdin that Claude Code sends to PreToolUse hooks
 * .why = claude code PreToolUse hooks receive tool input as JSON on stdin
 */
export const createHookStdin = (input: {
  toolName: 'Write' | 'Edit' | 'Read' | 'Bash';
  filePath: string;
  cwd: string;
}): string => {
  return JSON.stringify({
    hook_event_name: 'PreToolUse',
    tool_name: input.toolName,
    tool_input: {
      file_path: path.join(input.cwd, input.filePath),
    },
  });
};
