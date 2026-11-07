import { spawnSync } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { ROLE_LEARNER } from '../src/domain.roles/learner/getLearnerRole';
import { execAsync, genTempDirForRhachet } from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-driver');
const MEMORY_PATH = '/home/agent/.claude/projects/p/memory/x.md';

/**
 * .what = the hook command the learner role registers, read off the role itself
 * .why = the suite fires the exact bytes `rhachet init --hooks` renders
 */
const HOOK_COMMAND = ROLE_LEARNER.hooks?.onBrain?.onTool?.[0]?.command;
if (!HOOK_COMMAND)
  throw new Error('learner role registers no onTool hook; the suite has no subject');

/**
 * .what = run the registered hook command, as claude code does, in a tree
 * .why = `sh -c`, the payload on stdin, the project dir set; the exit code is the verdict
 */
const runHookRaw = (input: {
  tree: string;
  stdin: string;
}): { exitCode: number; stderr: string } => {
  const result = spawnSync('/bin/sh', ['-c', HOOK_COMMAND], {
    cwd: input.tree,
    env: { ...process.env, CLAUDE_PROJECT_DIR: input.tree },
    input: input.stdin,
    encoding: 'utf-8',
    timeout: 15_000,
  });
  if (result.error) throw result.error;
  return { exitCode: result.status ?? -1, stderr: result.stderr };
};

/**
 * .what = run the registered hook command against one tool payload
 * .why = the common path: a tool call serialized to json on stdin
 */
const runHook = (input: {
  tree: string;
  toolName: string;
  toolInput: Record<string, string>;
  cwd?: string;
}): { exitCode: number; stderr: string } =>
  runHookRaw({
    tree: input.tree,
    stdin: JSON.stringify({
      tool_name: input.toolName,
      tool_input: input.toolInput,
      ...(input.cwd ? { cwd: input.cwd } : {}),
    }),
  });

/**
 * .what = a Bash payload, run in a tree
 * .why = most cases vary only the command string
 */
const runBash = (input: {
  tree: string;
  command: string;
  cwd?: string;
}): { exitCode: number; stderr: string } =>
  runHook({
    tree: input.tree,
    toolName: 'Bash',
    toolInput: { command: input.command },
    ...(input.cwd ? { cwd: input.cwd } : {}),
  });

/**
 * .what = the hook result, with only its volatile bytes masked
 * .why = the result rides in a snapshot a reviewer reads; the temp tree differs per
 *        run, and a line number differs per skill edit, so each is masked. the home dir
 *        is not: the guard never prints it, and a mask would rewrite the fixture path
 *        on a host whose home is `/home/agent`
 */
const asHookSnap = async (input: {
  result: { exitCode: number; stderr: string };
  tree: string;
}): Promise<{ exitCode: number; stderr: string }> => {
  const treeReal = await fs.realpath(input.tree);
  const stderr = input.result.stderr
    .split(treeReal)
    .join('<tree>')
    .split(input.tree)
    .join('<tree>')
    .replace(/at line \d+\)/g, 'at line <n>)')
    .replace(/(\n\s+at [^\n]*)+/g, '\n    at <frames>');
  return { exitCode: input.result.exitCode, stderr };
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
      then('it is blocked, exit 2, with the nudge', async () => {
        const result = runBash({
          tree: scene.tree,
          command: `echo x > ${MEMORY_PATH}`,
        });
        expect(result.exitCode).toEqual(2);
        expect(result.stderr).toContain('memory would fade');
        expect(result.stderr).toContain(MEMORY_PATH);
        expect(
          await asHookSnap({ result, tree: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t0b] a write into native memory behind a `>` look-alike fires the hook', () => {
      then('it is blocked, exit 2, for `2>&1` and a quoted `=>`', async () => {
        const results = {
          fdDup: runBash({
            tree: scene.tree,
            command: `echo x > ${MEMORY_PATH} 2>&1`,
          }),
          arrow: runBash({
            tree: scene.tree,
            command: `echo '=>' > ${MEMORY_PATH}`,
          }),
        };
        expect(results.fdDup.exitCode).toEqual(2);
        expect(results.arrow.exitCode).toEqual(2);
        expect({
          fdDup: await asHookSnap({ result: results.fdDup, tree: scene.tree }),
          arrow: await asHookSnap({ result: results.arrow, tree: scene.tree }),
        }).toMatchSnapshot();
      });
    });

    when('[t1] a call that touches no memory path fires the hook', () => {
      then('it is allowed, exit 0, silent', async () => {
        const result = runBash({ tree: scene.tree, command: 'ls' });
        expect(result).toEqual({ exitCode: 0, stderr: '' });
        expect(
          await asHookSnap({ result, tree: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t1b] a Write and an Edit outside native memory fire the hook', () => {
      then('each is allowed, exit 0, silent', async () => {
        const results = {
          write: runHook({
            tree: scene.tree,
            toolName: 'Write',
            toolInput: { file_path: 'src/a.ts', content: 'x' },
          }),
          edit: runHook({
            tree: scene.tree,
            toolName: 'Edit',
            toolInput: { file_path: 'src/a.ts', old_string: 'x', new_string: 'y' },
          }),
        };
        expect(results.write).toEqual({ exitCode: 0, stderr: '' });
        expect(results.edit).toEqual({ exitCode: 0, stderr: '' });
        expect(results).toMatchSnapshot();
      });
    });

    when('[t2] a read of native memory with `2>&1` fires the hook', () => {
      then('it is allowed, exit 0, silent', async () => {
        const result = runBash({
          tree: scene.tree,
          command: `grep x ${MEMORY_PATH} 2>&1`,
        });
        expect(result).toEqual({ exitCode: 0, stderr: '' });
        expect(
          await asHookSnap({ result, tree: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t2b] a read of native memory with a quoted arrow fires the hook', () => {
      then('it is allowed, exit 0, silent, for `=>` and `->`', async () => {
        const results = {
          fat: runBash({
            tree: scene.tree,
            command: `grep '=>' ${MEMORY_PATH}`,
          }),
          thin: runBash({
            tree: scene.tree,
            command: `grep -- '->' ${MEMORY_PATH}`,
          }),
        };
        expect(results.fat).toEqual({ exitCode: 0, stderr: '' });
        expect(results.thin).toEqual({ exitCode: 0, stderr: '' });
        expect(results).toMatchSnapshot();
      });
    });

    when('[t3] a copy into native memory behind a loop fires the hook', () => {
      then('it is blocked, exit 2', async () => {
        const result = runBash({
          tree: scene.tree,
          command: `for f in a b; do cp "$f" ${MEMORY_PATH}; done`,
        });
        expect(result.exitCode).toEqual(2);
        expect(result.stderr).toContain(MEMORY_PATH);
        expect(
          await asHookSnap({ result, tree: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t4] a memory read redirected to a relative path, cwd sent', () => {
      then(
        'it is allowed, exit 0, silent: the target lands in the tree',
        async () => {
          const result = runBash({
            tree: scene.tree,
            command: `cat ${MEMORY_PATH} > out.txt`,
            cwd: scene.tree,
          });
          expect(result).toEqual({ exitCode: 0, stderr: '' });
          expect(
            await asHookSnap({ result, tree: scene.tree }),
          ).toMatchSnapshot();
        },
      );
    });

    when('[t4b] a memory read redirected to a relative path, no cwd sent', () => {
      then(
        'it is blocked, exit 2, with the unplaced nudge: the target may land in memory',
        async () => {
          const result = runBash({
            tree: scene.tree,
            command: `cat ${MEMORY_PATH} > out.txt`,
          });
          expect(result.exitCode).toEqual(2);
          expect(result.stderr).toContain(
            'an unplaced write beside claude native memory',
          );
          expect(
            await asHookSnap({ result, tree: scene.tree }),
          ).toMatchSnapshot();
        },
      );
    });

    when('[t4c] a relative write, with the memory dir sent as the cwd', () => {
      then(
        'it is blocked, exit 2: the target lands in memory',
        async () => {
          const result = runBash({
            tree: scene.tree,
            command: 'echo x > a.md',
            cwd: path.dirname(MEMORY_PATH),
          });
          expect(result.exitCode).toEqual(2);
          expect(result.stderr).toContain('a.md');
          expect(
            await asHookSnap({ result, tree: scene.tree }),
          ).toMatchSnapshot();
        },
      );
    });

    when('[t5] a Write tool call into native memory fires the hook', () => {
      then('it is blocked, exit 2, with the nudge', async () => {
        const result = runHook({
          tree: scene.tree,
          toolName: 'Write',
          toolInput: { file_path: MEMORY_PATH, content: 'x' },
        });
        expect(result.exitCode).toEqual(2);
        expect(result.stderr).toContain('memory would fade');
        expect(result.stderr).toContain(MEMORY_PATH);
        expect(
          await asHookSnap({ result, tree: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t6] an Edit tool call into native memory fires the hook', () => {
      then('it is blocked, exit 2, with the nudge', async () => {
        const result = runHook({
          tree: scene.tree,
          toolName: 'Edit',
          toolInput: {
            file_path: MEMORY_PATH,
            old_string: 'x',
            new_string: 'y',
          },
        });
        expect(result.exitCode).toEqual(2);
        expect(result.stderr).toContain('memory would fade');
        expect(result.stderr).toContain(MEMORY_PATH);
        expect(
          await asHookSnap({ result, tree: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t7] a copy out of native memory fires the hook', () => {
      then('it is blocked, exit 2, with the copy nudge', async () => {
        const result = runBash({
          tree: scene.tree,
          command: `cp ${MEMORY_PATH} /tmp/x.md`,
        });
        expect(result.exitCode).toEqual(2);
        expect(result.stderr).toContain(
          'a copy beside claude native memory',
        );
        expect(
          await asHookSnap({ result, tree: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t8] a redirect through a var beside the memory dir fires the hook', () => {
      then('it is blocked, exit 2, with the unplaced nudge', async () => {
        const result = runBash({
          tree: scene.tree,
          command: `D=${path.dirname(MEMORY_PATH)}; echo x > $D/a.md`,
        });
        expect(result.exitCode).toEqual(2);
        expect(result.stderr).toContain(
          'an unplaced write beside claude native memory',
        );
        expect(
          await asHookSnap({ result, tree: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t9] a malformed json payload fires the hook', () => {
      then('it is allowed, exit 0, silent: never 2', async () => {
        const result = runHookRaw({ tree: scene.tree, stdin: '{ not json' });
        expect(result).toEqual({ exitCode: 0, stderr: '' });
        expect(
          await asHookSnap({ result, tree: scene.tree }),
        ).toMatchSnapshot();
      });
    });

    when('[t9b] a memory note piped to tee fires the hook', () => {
      then(
        'into a durable brief with cwd sent: allowed; into memory after a cd: blocked',
        async () => {
          const results = {
            intoBrief: runBash({
              tree: scene.tree,
              command: `cat ${MEMORY_PATH} | tee .agent/repo=.this/role=any/briefs/b.md`,
              cwd: scene.tree,
            }),
            intoMemory: runBash({
              tree: scene.tree,
              command: `cd ${path.dirname(MEMORY_PATH)} && echo x | tee a.md`,
              cwd: scene.tree,
            }),
          };
          expect(results.intoBrief).toEqual({ exitCode: 0, stderr: '' });
          expect(results.intoMemory.exitCode).toEqual(2);
          expect({
            intoBrief: await asHookSnap({
              result: results.intoBrief,
              tree: scene.tree,
            }),
            intoMemory: await asHookSnap({
              result: results.intoMemory,
              tree: scene.tree,
            }),
          }).toMatchSnapshot();
        },
      );
    });

    when('[t10] an empty payload fires the hook', () => {
      then('it is allowed, exit 0, silent', async () => {
        const result = runHookRaw({ tree: scene.tree, stdin: '' });
        expect(result).toEqual({ exitCode: 0, stderr: '' });
        expect(
          await asHookSnap({ result, tree: scene.tree }),
        ).toMatchSnapshot();
      });
    });
  });
});
