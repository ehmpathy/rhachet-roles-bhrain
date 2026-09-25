import { spawn } from 'child_process';
import * as path from 'path';

import { genTempDir } from 'test-fns';

export { execAsync } from './execAsync';
import { execAsync } from './execAsync';

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
      // symlink brain packages for brain discovery
      // .why = discoverBrainPackages reads the fixture's package.json, then imports each brain
      //        package BY NAME resolved from the fixture root. node's lookup walks the fixture's
      //        own node_modules and its parents under /tmp — it never reaches the repo's — so an
      //        absent symlink makes every brain unloadable and any review the fixture drives
      //        malfunctions. mirrors invokeReviewSkill's symlink set.
      {
        at: 'node_modules/rhachet-brains-fireworksai',
        to: 'node_modules/rhachet-brains-fireworksai',
      },
      {
        at: 'node_modules/rhachet-brains-anthropic',
        to: 'node_modules/rhachet-brains-anthropic',
      },
      {
        at: 'node_modules/rhachet-brains-openai',
        to: 'node_modules/rhachet-brains-openai',
      },
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
    // strip ANSI color/style escape codes (e.g. \x1b[0m\x1b[31m)
    // .why = raw escape sequences are visual blemishes in snapshots — noise that
    //        degrades readability (rule.forbid.snapshot-visual-blemishes). the
    //        route judge writes colored stderr; the snapshot must capture the
    //        legible text, not the terminal control bytes
    // biome-ignore lint/suspicious/noControlCharactersInRegex: the ESC control byte is the intended target
    .replace(/\x1b\[[0-9;]*m/g, '')
    // collapse volatile temp-dir prefix; keep the stable suffix
    // e.g. /tmp/test-fns/<repodir>/.temp/<iso>.<slug>.<hash>/.reviews/... -> [TEMP]/.reviews/...
    // .why = repodir carries the worktree name and .temp carries a timestamp+hash,
    //        both machine-specific; only the suffix after them is stable
    .replace(/\/tmp\/test-fns\/[^/]+\/\.temp\/[^/]+\//g, '[TEMP]/')
    .replace(/finished \d+\.\d+s/g, 'finished [TIME]')
    .replace(/done \d+\.\d+s/g, 'done [TIME]')
    .replace(/passed \d+\.\d+s/g, 'passed [TIME]')
    .replace(/failed \d+\.\d+s/g, 'failed [TIME]')
    .replace(/inflight \d+\.\d+s/g, 'inflight [TIME]')
    .replace(/completed \d+\.\d+s/g, 'completed [TIME]')
    .replace(/allowed \d+\.\d+s/g, 'allowed [TIME]')
    .replace(/blocked \d+\.\d+s/g, 'blocked [TIME]')
    .replace(/malfunctioned \d+\.\d+s/g, 'malfunctioned [TIME]')
    // judge malfunction noun duration — the live judge tree renders a crashed
    // judge as `💥 … malfunction <dur>s`; a sub-second mock-judge duration must be
    // masked like every other status word (rule.forbid.snapshot-visual-blemishes)
    .replace(/malfunction \d+\.\d+s/g, 'malfunction [TIME]')
    .replace(/approved \d+\.\d+s/g, 'approved [TIME]')
    .replace(/rejected \d+\.\d+s/g, 'rejected [TIME]')
    .replace(/exhausted \d+\.\d+s/g, 'exhausted [TIME]')
    // constraint verdict duration — the absent verb that flaked driver.route.overrule
    // case14 (constraint 0.0s vs 0.1s); a sub-second mock-reviewer duration must be masked
    // like every other verdict verb (rule.forbid.snapshot-visual-blemishes)
    .replace(/constraint \d+\.\d+s/g, 'constraint [TIME]')
    // mask the volatile log-dir segment produced by genLogDirName():
    //   <iso>.pid<pid>.<uuid>  (timestamp + process pid + uuid-fns)
    // .why = the three components all change per invocation; only the stable
    //        suffix after the segment is oracle-worthy
    // e.g. .log/bhrain/review/2026-09-15T02-16-44-056Z.pid2845521.1d01c21c-.../
    //   -> .log/bhrain/review/<logdir>/
    .replace(
      /\.log\/bhrain\/review\/[^/]+\//g,
      '.log/bhrain/review/<logdir>/',
    )
    // mask an absolute iso stamp rendered into output a human reads
    // .why = the stale-articulation verdict prints two of them — `written` and
    //        `asked at` — and both are wall-clock, so a snapshot that captured
    //        them would go red on its next run rather than on a real change.
    //        every duration verb above is masked for this reason; an absolute
    //        stamp is the same hazard at a different grain
    .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z/g, '[STAMP]');
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

/**
 * .what = the ONE child-env builder every blackbox suite spawns a subprocess through
 *
 * 🔴 .why it is exported rather than inlined = its `undefined` semantics are LOAD-BEARING
 *    and easy to re-implement subtly differently. a value of `undefined` DELETES the key
 *    from the child env, rather than sets it to the string `"undefined"` — the hermetic
 *    unset a suite needs to prove a DEFAULT against a leaked operator override. the
 *    `-default` concurrency suite depends on it to show the default path rather than a
 *    stray `RHACHET_LEVEL_CONCURRENCY`.
 *
 *    ⚠️ it was hand-rolled in THREE files at once (this one, plus the two env-refusal
 *      suites), all added by one diff — raised as blocker.1 by
 *      `ergo-acceptance-journey-coverage` at i019. a later change to the unset sentinel
 *      would land in one copy and not the others, and the refusal suites would then
 *      assert against an env spliced differently from the harness the rest of the corpus
 *      reads through: *"a clamp goes green for the wrong reason"* (rule.forbid.failhide).
 *
 * ⇒ one rule, one site. every consumer takes this.
 */
export const asChildEnv = (input: {
  overrides?: Record<string, string | undefined>;
}): NodeJS.ProcessEnv => {
  const childEnv: Record<string, string | undefined> = {
    ...process.env,
    ...input.overrides,
  };

  // a key whose override is `undefined` is DELETED, never stringified
  for (const [key, value] of Object.entries(input.overrides ?? {}))
    if (value === undefined) delete childEnv[key];

  return childEnv as NodeJS.ProcessEnv;
};

export const invokeRouteSkill = async (input: {
  skill:
    | 'route.bind.set'
    | 'route.bind.get'
    | 'route.bind.del'
    | 'route.bounce'
    | 'route.drive'
    | 'route.guard.budget'
    | 'route.guard.upgrade'
    | 'route.mutate'
    | 'route.review'
    | 'route.stone.add'
    | 'route.stone.get'
    | 'route.stone.set'
    | 'route.stone.del'
    | 'route.stone.judge';
  args: Record<string, string | boolean | string[] | undefined>;
  cwd: string;
  // .why = a value of `undefined` DELETES the key from the child env, rather than
  //        sets it to the string "undefined". this is the hermetic unset a suite
  //        needs to prove a DEFAULT against a leaked operator override — e.g.
  //        `env: { RHACHET_LEVEL_CONCURRENCY: undefined }` guarantees the child
  //        sees no override, so the default path is the one under test
  //        (rule.forbid.failhide — a clamp must not go green for the wrong reason).
  env?: Record<string, string | undefined>;
  stdin?: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  // map skill name to shell command filename
  const skillFile = `${input.skill}.sh`;
  const skillPath = path.join(
    input.cwd,
    '.agent/repo=bhrain/role=driver/skills',
    skillFile,
  );

  // build the child env through the ONE canonical builder (see `asChildEnv`)
  const childEnv = asChildEnv({ overrides: input.env });

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
        env: childEnv,
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
  // .note = single quotes prevent bash variable expansion (e.g., $behavior)
  const argsStr = argsArray
    .map((arg) => (arg.startsWith('--') ? arg : `'${arg}'`))
    .join(' ');
  const cmd = `bash "${skillPath}" ${argsStr}`;

  try {
    const result = await execAsync(cmd, {
      cwd: input.cwd,
      env: childEnv,
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
