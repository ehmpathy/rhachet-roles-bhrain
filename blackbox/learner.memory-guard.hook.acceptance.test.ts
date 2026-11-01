import { spawnSync } from 'child_process';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { LEARNER_MEMORY_GUARD_HOOK_COMMAND } from '../src/domain.roles/learner/getLearnerRoleHookCommand';
import { execAsync, genTempDirForRhachet } from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');
const MEMORY_PATH = '/home/agent/.claude/projects/p/memory/x.md';

/**
 * .what = run the registered hook command, as claude code does, in a tree
 * .why = `sh -c`, the payload on stdin, the project dir set; the exit code is the verdict
 */
const runHook = (input: {
  tree: string;
  command: string;
  cwd?: string;
}): { exitCode: number; stderr: string } => {
  const result = spawnSync('/bin/sh', ['-c', LEARNER_MEMORY_GUARD_HOOK_COMMAND], {
    cwd: input.tree,
    env: { ...process.env, CLAUDE_PROJECT_DIR: input.tree },
    input: JSON.stringify({
      tool_name: 'Bash',
      tool_input: { command: input.command },
      ...(input.cwd ? { cwd: input.cwd } : {}),
    }),
    encoding: 'utf-8',
    timeout: 15_000,
  });
  // a hook that names a fault exits before it reads its payload, so the write of
  // the payload may meet a closed pipe; that is the reader's choice, not a fault
  const isPayloadUnread =
    (result.error as NodeJS.ErrnoException | undefined)?.code === 'EPIPE';
  if (result.error && !isPayloadUnread) throw result.error;
  return { exitCode: result.status ?? -1, stderr: result.stderr };
};

/**
 * .what = the hook against a learner linked by rhachet itself, never by hand
 * .why = the integration clamps build the link layout by hand; this proves a real
 *        `rhachet roles link` lays the skill where the hook command looks, and that the
 *        skill finds its cli from the role package through that link
 */
describe('learner.memory-guard.hook.acceptance', () => {
  given('[case1] a repo whose learner role was linked by rhachet', () => {
    const scene = useBeforeAll(async () => {
      const tree = genTempDirForRhachet({
        slug: 'learner-memory-guard-hook',
        clone: ASSETS_DIR,
      });
      await execAsync('npx rhachet roles link --role learner', { cwd: tree });
      return { tree };
    });

    when('[t0] a write into native memory fires the hook', () => {
      then('it is blocked, exit 2, with the nudge', () => {
        const result = runHook({
          tree: scene.tree,
          command: `echo x > ${MEMORY_PATH}`,
        });
        expect(result.exitCode).toEqual(2);
        expect(result.stderr).toContain('memory would fade');
        expect(result.stderr).toContain(MEMORY_PATH);
      });
    });

    when('[t1] a call that touches no memory path fires the hook', () => {
      then('it is allowed, exit 0, silent', () => {
        const result = runHook({ tree: scene.tree, command: 'ls' });
        expect(result).toEqual({ exitCode: 0, stderr: '' });
      });
    });

    when('[t2] a read of native memory with `2>&1` fires the hook', () => {
      then('it is allowed, exit 0, silent', () => {
        const result = runHook({
          tree: scene.tree,
          command: `grep x ${MEMORY_PATH} 2>&1`,
        });
        expect(result).toEqual({ exitCode: 0, stderr: '' });
      });
    });

    when('[t3] a copy into native memory behind a loop fires the hook', () => {
      then('it is blocked, exit 2', () => {
        const result = runHook({
          tree: scene.tree,
          command: `for f in a b; do cp "$f" ${MEMORY_PATH}; done`,
        });
        expect(result.exitCode).toEqual(2);
        expect(result.stderr).toContain(MEMORY_PATH);
      });
    });

    when('[t4] a memory read redirected to a relative path, cwd sent', () => {
      then('it is allowed, exit 0, silent: the target lands in the tree', () => {
        const result = runHook({
          tree: scene.tree,
          command: `cat ${MEMORY_PATH} > out.txt`,
          cwd: scene.tree,
        });
        expect(result).toEqual({ exitCode: 0, stderr: '' });
      });
    });
  });

  given('[case2] a repo with the hook registered and no learner link', () => {
    // the incident: a hook whose skill cannot be found must never halt the call
    const scene = useBeforeAll(async () => ({
      tree: genTempDirForRhachet({
        slug: 'learner-memory-guard-hook-unlinked',
        clone: ASSETS_DIR,
      }),
    }));

    when('[t0] a call that touches no memory path fires the hook', () => {
      then('it is allowed: exit 1, one line that names the fault and fix', () => {
        const result = runHook({ tree: scene.tree, command: 'ls' });
        expect(result.exitCode).toEqual(1);
        expect(result.stderr).toContain('📜 memory.guard: could not run');
        expect(result.stderr).toContain('call allowed');
        expect(result.stderr.trim().split('\n')).toHaveLength(1);
      });
    });
  });
});
