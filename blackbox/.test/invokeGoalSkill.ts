import { spawn } from 'child_process';
import * as path from 'path';

import { genTempDir } from 'test-fns';

import { execAsync } from './invokeRouteSkill';

/**
 * .what = creates a temp directory ready for achiever goal skills
 * .why = enables acceptance tests with git repo and node_modules symlink
 */
export const genTempDirForGoals = (input: {
  slug: string;
  clone?: string;
}): string => {
  return genTempDir({
    slug: input.slug,
    clone: input.clone,
    git: true,
    symlink: [
      // symlink root package.json for rhachet to discover role packages
      { at: 'package.json', to: 'package.json' },
      // symlink entire rhachet-roles-bhrain package via node_modules self-link
      // (pnpm creates link:. which makes node_modules/rhachet-roles-bhrain -> repo root)
      {
        at: 'node_modules/rhachet-roles-bhrain',
        to: 'node_modules/rhachet-roles-bhrain',
      },
      // symlink .bin for npx to find rhx/rhachet commands
      { at: 'node_modules/.bin', to: 'node_modules/.bin' },
      // symlink rhachet so rhx entrypoint can find ../rhachet/bin/rhx
      { at: 'node_modules/rhachet', to: 'node_modules/rhachet' },
      // symlink .pnpm for pnpm-generated wrapper scripts that use relative paths
      { at: 'node_modules/.pnpm', to: 'node_modules/.pnpm' },
      // symlink dependencies required by dist/ modules
      { at: 'node_modules/domain-objects', to: 'node_modules/domain-objects' },
      { at: 'node_modules/js-yaml', to: 'node_modules/js-yaml' },
    ],
  });
};

/**
 * .what = sanitizes variable content in cli output for stable snapshots
 * .why = hashes, timestamps, paths are machine-dependent and cause flaky snapshots
 */
export const sanitizeGoalOutputForSnapshot = (output: string): string => {
  return output
    .replace(/\[[a-f0-9]{7}\]/g, '[HASH]') // hash abbreviations
    .replace(/[a-f0-9]{64}/g, '[SHA256]') // full sha256 hashes
    .replace(/\d{7}\./g, '[OFFSET].') // goal offset prefixes
    .replace(/\/tmp\/[^\s]+/g, '[TMPDIR]') // temp directory paths
    .replace(/\.goals\/[^\s\/]+\//g, '.goals/[BRANCH]/') // branch names in paths
    .replace(/\d{4}-\d{2}-\d{2}/g, '[DATE]'); // ISO dates
};

/**
 * .what = invokes a goal skill via direct node invocation
 * .why = enables blackbox acceptance tests that bypass ESM symlink issues
 *
 * note: we invoke the CLI module directly instead of via shell entrypoint
 * because ESM module resolution fails with symlinked packages in temp dirs
 */
export const invokeGoalSkill = async (input: {
  skill: 'goal.memory.set' | 'goal.memory.get' | 'goal.infer.triage';
  args: Record<string, string | boolean | undefined>;
  cwd: string;
  stdin?: string;
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  // map skill name to cli function
  const skillToFunction: Record<string, string> = {
    'goal.memory.set': 'goalMemorySet',
    'goal.memory.get': 'goalMemoryGet',
    'goal.infer.triage': 'goalInferTriage',
  };
  const fnName = skillToFunction[input.skill];

  // build args array
  const argsArray = Object.entries(input.args)
    .filter(([_, v]) => v !== undefined)
    .flatMap(([k, v]) => {
      if (v === true) return [`--${k}`];
      return [`--${k}`, String(v)];
    });

  // get repo root - use full path to the CLI module
  const repoRoot = process.cwd();
  const cliModulePath = path.join(repoRoot, 'dist/contract/cli/goal.js');

  // build node command that uses full path to CLI module
  // this avoids ESM resolution issues with symlinks
  // .catch() ensures rejected promises exit with non-zero code
  const nodeCode = `import('file://${cliModulePath}').then(m => m.${fnName}()).catch(e => { console.error('CATCH:', e); process.exit(1); })`;

  // use spawn to handle stdin and capture output
  return new Promise((done) => {
    const child = spawn('node', ['-e', nodeCode, '--', ...argsArray], {
      cwd: input.cwd,
      env: {
        ...process.env,
        NODE_PATH: `${repoRoot}/node_modules`,
      },
      stdio: ['pipe', 'pipe', 'pipe'],
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

    // write stdin if provided
    if (input.stdin !== undefined) {
      child.stdin.write(input.stdin);
    }
    child.stdin.end();
  });
};

/**
 * .what = creates goal YAML for stdin
 * .why = goal.memory.set requires YAML via stdin for new goals
 */
export const createGoalYaml = (goal: {
  slug: string;
  why: { ask: string; purpose: string; benefit: string };
  what: { outcome: string };
  how: { task: string; gate: string };
  status: { choice: string; reason: string };
  source: string;
}): string => {
  return `slug: ${goal.slug}
why:
  ask: ${goal.why.ask}
  purpose: ${goal.why.purpose}
  benefit: ${goal.why.benefit}
what:
  outcome: ${goal.what.outcome}
how:
  task: ${goal.how.task}
  gate: ${goal.how.gate}
status:
  choice: ${goal.status.choice}
  reason: ${goal.status.reason}
source: ${goal.source}
`;
};

/**
 * .what = creates partial goal YAML for stdin
 * .why = enables quick capture test with incomplete schema
 */
export const createPartialGoalYaml = (goal: {
  slug: string;
  why?: { ask?: string; purpose?: string; benefit?: string };
  what?: { outcome?: string };
  how?: { task?: string; gate?: string };
  status?: { choice?: string; reason?: string };
  source?: string;
}): string => {
  let yaml = `slug: ${goal.slug}\n`;

  if (goal.why) {
    yaml += 'why:\n';
    if (goal.why.ask) yaml += `  ask: ${goal.why.ask}\n`;
    if (goal.why.purpose) yaml += `  purpose: ${goal.why.purpose}\n`;
    if (goal.why.benefit) yaml += `  benefit: ${goal.why.benefit}\n`;
  }

  if (goal.what) {
    yaml += 'what:\n';
    if (goal.what.outcome) yaml += `  outcome: ${goal.what.outcome}\n`;
  }

  if (goal.how) {
    yaml += 'how:\n';
    if (goal.how.task) yaml += `  task: ${goal.how.task}\n`;
    if (goal.how.gate) yaml += `  gate: ${goal.how.gate}\n`;
  }

  if (goal.status) {
    yaml += 'status:\n';
    if (goal.status.choice) yaml += `  choice: ${goal.status.choice}\n`;
    if (goal.status.reason) yaml += `  reason: ${goal.status.reason}\n`;
  }

  if (goal.source) yaml += `source: ${goal.source}\n`;

  return yaml;
};

export { execAsync };
