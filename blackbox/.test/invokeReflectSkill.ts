import { exec } from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { promisify } from 'util';

import { genTempDir } from 'test-fns';

export const execAsync = promisify(exec);

/**
 * .what = creates a temp directory ready for reflector role tests
 * .why = enables acceptance tests with git repo, node_modules, and mock claude project
 */
export const genTempDirForReflector = (input: {
  slug: string;
  clone: string;
  mockClaudeProject?: {
    mainFile: string;
    mainContent: string;
    compactionFiles?: Array<{ name: string; content: string }>;
  };
}): string => {
  const tempDir = genTempDir({
    slug: input.slug,
    clone: input.clone,
    git: true,
    symlink: [
      // symlink rhachet-roles-bhrain package for the reflector role
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
      // symlink .pnpm for pnpm-generated wrapper scripts
      { at: 'node_modules/.pnpm', to: 'node_modules/.pnpm' },
    ],
  });

  // set up mock claude project if requested
  if (input.mockClaudeProject) {
    // claude code stores projects at ~/.claude/projects/<slug>
    // slug = cwd path with /→-, _→-, .→- (must match computeProjectSlug)
    // important: use realpath because process.cwd() returns resolved path, not symlink
    const realTempDir = fs.realpathSync(tempDir);
    const projectSlug = realTempDir
      .replace(/\//g, '-')
      .replace(/_/g, '-')
      .replace(/\./g, '-');
    const projectDir = path.join(os.homedir(), '.claude/projects', projectSlug);

    // create project directory
    fs.mkdirSync(projectDir, { recursive: true });

    // write main transcript file
    fs.writeFileSync(
      path.join(projectDir, input.mockClaudeProject.mainFile),
      input.mockClaudeProject.mainContent,
    );

    // write compaction files if any
    if (input.mockClaudeProject.compactionFiles) {
      const uuid = input.mockClaudeProject.mainFile.replace('.jsonl', '');
      const subagentsDir = path.join(projectDir, uuid, 'subagents');
      fs.mkdirSync(subagentsDir, { recursive: true });

      for (const file of input.mockClaudeProject.compactionFiles) {
        fs.writeFileSync(path.join(subagentsDir, file.name), file.content);
      }
    }
  }

  return tempDir;
};

/**
 * .what = sanitizes dynamic values in cli output for stable snapshots
 * .why = timestamps, paths, and sizes are machine-dependent
 */
export const sanitizeReflectOutputForSnapshot = (output: string): string => {
  return output
    // sanitize temp directory paths (e.g., /tmp/test-fns/.../[timestamp].[slug].[hash])
    .replace(/\/tmp\/[^\s]+/g, '[TEMP_PATH]')
    // sanitize temp directory ISO timestamp prefix (e.g., 2026-03-17T19-06-58.037Z)
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.\d{3}Z/g, '[ISO_TEMP]')
    // sanitize temp directory hash suffix (e.g., .eb7d5802)
    // lookahead matches: whitespace, end, period, or slash (for paths like gitrepo=...eb7d5802/)
    .replace(/\.[a-f0-9]{8}(?=\s|$|\.|\/)/g, '.[HASH]')
    // sanitize timestamps in savepoint list
    .replace(/\d{4}-\d{2}-\d{2}\.\d{6}/g, '[TIMESTAMP]')
    // sanitize .rhachet storage paths: preserve structure, replace dynamic parts
    // gitrepo/worktree values are temp dir basenames like "2026-03-17T19-06-58.037Z.reflect-journey.eb7d5802"
    // the slug (e.g., "reflect-journey") is constant; only timestamp and hash are dynamic
    // branch is constant ("main" for fresh git init) - no sanitization needed
    .replace(/date=\d{4}-\d{2}-\d{2}/g, 'date=[DATE]')
    // replace $HOME prefix with ~
    .replace(new RegExp(process.env.HOME ?? '/home/user', 'g'), '~')
    // sanitize byte sizes (e.g., "0 bytes", "12kb", "1.5MB")
    .replace(/\d+(\.\d+)?\s*bytes/gi, '[SIZE]ytes')
    .replace(/\d+(\.\d+)?[kmgKMG][bB]/g, '[SIZE]')
    // sanitize hash values (e.g., hash = a1b2c3d)
    .replace(/hash=[a-f0-9]{7}/g, 'hash=[HASH]')
    .replace(/hash = [a-f0-9]{7}/g, 'hash = [HASH]')
    // sanitize episode and message counts (variable across sessions)
    .replace(/episodes = \d+/g, 'episodes = [N]')
    .replace(/messages = \d+/g, 'messages = [N]')
    // sanitize stack traces and absolute paths in errors
    .replace(/\/[^\s]+\.(js|ts):\d+:\d+/g, '[FILE]')
    .replace(/\/[^\s]+\.(js|ts):\d+/g, '[FILE]')
    .replace(/at [^\n]+\n/g, 'at [STACK]\n')
    .replace(/Node\.js v[\d.]+/g, 'Node.js v[VERSION]');
};

/**
 * .what = invokes a reflect skill via its shell entrypoint
 * .why = enables blackbox acceptance tests against the skill
 */
export const invokeReflectSkill = async (input: {
  skill:
    | 'reflect.snapshot.capture'
    | 'reflect.snapshot.get'
    | 'reflect.snapshot.annotate'
    | 'reflect.snapshot.backup'
    | 'reflect.savepoint.set'
    | 'reflect.savepoint.get';
  args: Record<string, string | boolean | string[] | undefined>;
  cwd: string;
  env?: Record<string, string>;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  // map skill name to shell command filename
  const skillFile = `${input.skill}.sh`;
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=reflector/skills',
    skillFile,
  );

  // build args string; arrays expand to repeated flags
  // special key '_' represents positional arguments (passed after --)
  const positionalArgs = input.args._ ? `-- "${input.args._}"` : '';
  const flagArgs = Object.entries(input.args)
    .filter(([k, v]) => k !== '_' && v !== undefined)
    .flatMap(([k, v]) => {
      if (v === true) return [`--${k}`];
      if (Array.isArray(v)) return v.map((val) => `--${k} "${val}"`);
      return [`--${k} "${v}"`];
    })
    .join(' ');

  const argsStr = [flagArgs, positionalArgs].filter(Boolean).join(' ');
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
