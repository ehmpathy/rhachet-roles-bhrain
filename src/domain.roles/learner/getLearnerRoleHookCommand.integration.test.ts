import { spawnSync } from 'child_process';
import * as fs from 'fs/promises';
import { ConstraintError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import { LEARNER_MEMORY_GUARD_HOOK_COMMAND } from './getLearnerRoleHookCommand';

/**
 * .what = the clamps for "memory.guard never halts a call it cannot judge"
 * .why = runs the EXACT command the learner registers as a PreToolUse hook, the way
 *        claude code runs it (`sh -c`, payload on stdin, in some cwd), inside temp trees
 *        that each stage one guard health. the contract: only a true write into native
 *        memory exits 2 (block); every other exit lets the call through
 */

// the timed-out cases wait out the guard's own deadline
jest.setTimeout(30_000);

// anchored on this file, so a runner launched from another cwd still finds the skill
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const LEARNER_SKILLS_SRC = path.join(
  REPO_ROOT,
  'src/domain.roles/learner/skills',
);
const LINK_DIR = '.agent/repo=bhrain/role=learner';
const MEMORY_PATH = '/home/agent/.claude/projects/p/memory/x.md';
const NOT_LINKED_LINE =
  '📜 memory.guard: could not run (skill not linked under .); call allowed. fix: ./node_modules/.bin/rhachet roles link --repo bhrain --role learner';

/**
 * .what = run the registered hook command against one tool payload
 * .why = mirrors the harness: sh -c, stdin json, a cwd, and CLAUDE_PROJECT_DIR only
 *        when the case sets it. a raw string payload is sent as is (empty, malformed)
 * .note = spawnSync blocks the event loop, so jest's own timeout cannot preempt it;
 *         the spawn carries its own, and a kill throws rather than hangs the suite
 */
const runHook = (
  input: {
    cwd: string;
    payload: { tool_name: string; tool_input: Record<string, string> } | string;
    projectDir: string | null;
  },
  options?: { envPath: string },
): { exitCode: number; stderr: string } => {
  const { CLAUDE_PROJECT_DIR: _envProjectDirInherited, ...envBase } =
    process.env;
  const env = {
    ...envBase,
    ...(input.projectDir ? { CLAUDE_PROJECT_DIR: input.projectDir } : {}),
    ...(options ? { PATH: options.envPath } : {}),
  };
  const result = spawnSync(
    '/bin/sh',
    ['-c', LEARNER_MEMORY_GUARD_HOOK_COMMAND],
    {
      cwd: input.cwd,
      env,
      input:
        typeof input.payload === 'string'
          ? input.payload
          : JSON.stringify(input.payload),
      encoding: 'utf-8',
      timeout: 15_000,
    },
  );
  // a hook may exit before it reads its payload (an unlinked rhx does); the harness
  // tolerates that, so an EPIPE on the write is no fault. all else throws
  const isPayloadUnread =
    !!result.error && 'code' in result.error && result.error.code === 'EPIPE';
  if (result.error && !isPayloadUnread) throw result.error;
  return { exitCode: result.status ?? -1, stderr: result.stderr };
};

/**
 * .what = the one fault line the guard prints when it cannot run
 * .why = every fault case asserts the exact line a human reads
 */
const asFaultLine = (input: { cause: string; fix: string }): string =>
  `📜 memory.guard: could not run (${input.cause}); call allowed. fix: ${input.fix}\n`;
const FIX_REINSTALL = 'reinstall rhachet-roles-bhrain';
const FIX_REPORT =
  'report it at https://github.com/ehmpathy/rhachet-roles-bhrain/issues, with the stack below';

/**
 * .what = the stderr a human reads, with only its volatile bytes masked
 * .why = every fault line rides in a snapshot a reviewer reads; the temp tree, a line
 *        number, and a stack's frames differ per host and per node, so they are masked
 */
const asStderrSnap = async (input: {
  stderr: string;
  tree: string;
}): Promise<string> => {
  const treeReal = await fs.realpath(input.tree);
  return input.stderr
    .split(treeReal)
    .join('<tree>')
    .split(input.tree)
    .join('<tree>')
    .replace(/at line \d+\)/g, 'at line <n>)')
    .replace(/(\n\s+at [^\n]*)+/g, '\n    at <frames>');
};

/**
 * .what = a Bash payload
 * .why = most clamps vary only the command string
 */
const asBash = (input: {
  command: string;
}): { tool_name: string; tool_input: Record<string, string> } => ({
  tool_name: 'Bash',
  tool_input: { command: input.command },
});

/**
 * .what = link the learner skills dir into a temp tree, as `rhachet roles link` does
 * .why = the hook looks for the skill at `.agent/repo=bhrain/role=learner/skills`
 */
const linkLearnerSkills = async (input: {
  tree: string;
  skillsDir: string;
}): Promise<void> => {
  await fs.mkdir(path.join(input.tree, LINK_DIR), { recursive: true });
  await fs.symlink(input.skillsDir, path.join(input.tree, LINK_DIR, 'skills'));
};

/**
 * .what = a bin dir that holds the named host tools, plus stub tools with a given body
 * .why = stages a host whose PATH lacks a tool (node) or holds a tool that faults
 *        (a dirname that exits 2), while the rest of what the hook calls stays reachable
 */
const genBinDir = async (input: {
  tree: string;
  slug: string;
  tools: string[];
  stubs: Record<string, string>;
}): Promise<{ binDir: string }> => {
  const binDir = path.join(input.tree, `bin.${input.slug}`);
  await fs.mkdir(binDir, { recursive: true });
  for (const tool of input.tools) {
    const probe = spawnSync('/bin/sh', ['-c', `command -v ${tool}`], {
      encoding: 'utf-8',
    });
    if (probe.error) throw probe.error;
    const located = probe.stdout.trim();
    // fail fast on a host that lacks the tool; a missed link would fake the case
    if (!located)
      throw new ConstraintError('test host lacks a tool this case links', {
        tool,
        case: input.slug,
        hint: `install ${tool} on the test host`,
      });
    await fs.symlink(located, path.join(binDir, tool));
  }
  for (const [tool, body] of Object.entries(input.stubs)) {
    await fs.writeFile(path.join(binDir, tool), `#!/bin/sh\n${body}\n`, {
      mode: 0o755,
    });
  }
  return { binDir };
};

/**
 * .what = a fake installed package whose cli module is the given source, or absent
 * .why = stages a broken install: a cli that throws at load, one that never settles,
 *        or none at all. the skill locates its cli from its own package path
 */
const genFakePackage = async (input: {
  tree: string;
  cliSource: string | null;
}): Promise<{ skillsDir: string }> => {
  const pkg = path.join(input.tree, 'node_modules/rhachet-roles-bhrain');
  const skillsDir = path.join(pkg, 'dist/domain.roles/learner/skills');
  await fs.mkdir(skillsDir, { recursive: true });
  await fs.copyFile(
    path.join(LEARNER_SKILLS_SRC, 'memory.guard.sh'),
    path.join(skillsDir, 'memory.guard.sh'),
  );
  if (input.cliSource) {
    await fs.mkdir(path.join(pkg, 'dist/contract/cli'), { recursive: true });
    await fs.writeFile(
      path.join(pkg, 'dist/contract/cli/memory.js'),
      input.cliSource,
    );
  }
  return { skillsDir };
};

describe('learner memory guard hook command (integration)', () => {
  // the linked skill runs this repo's built cli; a stale or absent build would fake
  // every allowed case, so fail fast with the fix rather than read a lie
  beforeAll(async () => {
    const cliBuilt = path.join(REPO_ROOT, 'dist/contract/cli/memory.js');
    // only an absent file means "not built"; any other stat fault rethrows as itself
    const found = await fs.stat(cliBuilt).then(
      () => true,
      (error: NodeJS.ErrnoException) => {
        if (error.code === 'ENOENT') return false;
        throw error;
      },
    );
    if (!found)
      throw new ConstraintError('these clamps run the built cli; none found', {
        cliBuilt,
        hint: 'npm run build',
      });
  });
  given(
    '[caseA] a tree with the learner linked and no node_modules/.bin/rhx',
    () => {
      const scene = useBeforeAll(async () => {
        const tree = genTempDir({ slug: 'memory-guard-hook-caseA' });
        await linkLearnerSkills({ tree, skillsDir: LEARNER_SKILLS_SRC });
        return { tree };
      });

      when('[t0] calls that touch no memory path fire the hook', () => {
        then('a Bash `ls` is allowed, exit 0, silent', () => {
          const result = runHook({
            cwd: scene.tree,
            payload: asBash({ command: 'ls' }),
            projectDir: null,
          });
          expect(result).toEqual({ exitCode: 0, stderr: '' });
        });

        then('a Bash write elsewhere is allowed, exit 0, silent', () => {
          for (const command of ['echo x > out.txt', 'cp a.md b.md']) {
            const result = runHook({
              cwd: scene.tree,
              payload: asBash({ command }),
              projectDir: null,
            });
            expect(result).toEqual({ exitCode: 0, stderr: '' });
          }
        });

        then('a Write and an Edit of src/a.ts are allowed, exit 0', () => {
          for (const tool_name of ['Write', 'Edit']) {
            const result = runHook({
              cwd: scene.tree,
              payload: { tool_name, tool_input: { file_path: 'src/a.ts' } },
              projectDir: null,
            });
            expect(result).toEqual({ exitCode: 0, stderr: '' });
          }
        });
      });

      when('[t1] [caseB] a write into native memory fires the hook', () => {
        const routes = [
          `echo x > ${MEMORY_PATH}`,
          `echo x >> ${MEMORY_PATH}`,
          `echo x >| ${MEMORY_PATH}`,
          `cp note.md ${MEMORY_PATH}`,
          `mv note.md ${MEMORY_PATH}`,
          `echo x | tee ${MEMORY_PATH}`,
          `echo x | rhx teesafe ${MEMORY_PATH}`,
          `echo x > ${MEMORY_PATH} 2>&1`,
          `echo '=>' > ${MEMORY_PATH}`,
          `echo x >& ${MEMORY_PATH}`,
          `/bin/cp note.md ${MEMORY_PATH}`,
          `\\cp note.md ${MEMORY_PATH}`,
        ];
        for (const command of routes) {
          then(`\`${command}\` is blocked, exit 2, with the nudge`, () => {
            const result = runHook({
              cwd: scene.tree,
              payload: asBash({ command }),
              projectDir: null,
            });
            expect(result.exitCode).toEqual(2);
            expect(result.stderr).toContain('memory would fade');
            expect(result.stderr).toContain(MEMORY_PATH);
          });
        }

        then('the nudge a human reads at the halt renders whole', () => {
          const result = runHook({
            cwd: scene.tree,
            payload: asBash({ command: `echo x > ${MEMORY_PATH}` }),
            projectDir: null,
          });
          expect(result.exitCode).toEqual(2);
          expect(result.stderr).toMatchSnapshot();
        });

        then(
          'a copy OUT of memory blocks, and its nudge names the copy and `cat`',
          () => {
            const result = runHook({
              cwd: scene.tree,
              payload: asBash({ command: `cp ${MEMORY_PATH} /tmp/x.md` }),
              projectDir: null,
            });
            expect(result.exitCode).toEqual(2);
            expect(result.stderr).toContain(
              '✋ blocked: a copy beside claude native memory',
            );
            expect(result.stderr).toContain('read it with cat');
            expect(result.stderr).toMatchSnapshot();
          },
        );

        // each verb's nudge renders whole: a write into memory names a write, with
        // no read hint; tee and teesafe write every operand, and an mv whose last
        // operand is memory writes it
        for (const command of [
          `echo x | tee ${MEMORY_PATH}`,
          `echo x | rhx teesafe ${MEMORY_PATH}`,
          `mv note.md ${MEMORY_PATH}`,
        ]) {
          then(`the nudge for \`${command}\` renders whole`, () => {
            const result = runHook({
              cwd: scene.tree,
              payload: asBash({ command }),
              projectDir: null,
            });
            expect(result.exitCode).toEqual(2);
            expect(result.stderr).toContain(
              '✋ blocked: write to claude native memory',
            );
            expect(result.stderr).not.toContain('only a read?');
            expect(result.stderr).toMatchSnapshot();
          });
        }

        // a write to a place the guard cannot know, beside memory, names that
        then('the nudge for a redirect through a var renders whole', () => {
          const result = runHook({
            cwd: scene.tree,
            payload: asBash({
              command:
                'D=/home/agent/.claude/projects/p/memory; echo x > $D/a.md',
            }),
            projectDir: null,
          });
          expect(result.exitCode).toEqual(2);
          expect(result.stderr).toContain(
            '✋ blocked: a write the guard cannot place, beside claude native memory',
          );
          expect(result.stderr).toContain('$var');
          expect(result.stderr).toMatchSnapshot();
        });

        then('a Write and an Edit into memory are blocked, exit 2', () => {
          for (const tool_name of ['Write', 'Edit']) {
            const result = runHook({
              cwd: scene.tree,
              payload: { tool_name, tool_input: { file_path: MEMORY_PATH } },
              projectDir: null,
            });
            expect(result.exitCode).toEqual(2);
            expect(result.stderr).toContain('memory would fade');
            expect(result.stderr).toMatchSnapshot();
          }
        });
      });

      when(
        '[t2] [caseC] [caseE] a read of a memory path fires the hook',
        () => {
          const reads = [
            `cat ${MEMORY_PATH}`,
            `grep x ${MEMORY_PATH} 2>&1`,
            `cat ${MEMORY_PATH} >&2`,
            `grep '=>' ${MEMORY_PATH}`,
            `grep -- '->' ${MEMORY_PATH}`,
            `cat ${MEMORY_PATH} > /tmp/out.txt`,
            `cat ${MEMORY_PATH} | grep x > /tmp/out.md`,
            `grep -c tee ${MEMORY_PATH}`,
            `ls && cat ${MEMORY_PATH}`,
            'npm test 2>&1',
          ];
          for (const command of reads) {
            then(`\`${command}\` is allowed, exit 0, silent`, () => {
              const result = runHook({
                cwd: scene.tree,
                payload: asBash({ command }),
                projectDir: null,
              });
              expect(result).toEqual({ exitCode: 0, stderr: '' });
            });
          }
        },
      );

      when('[t3] an empty payload fires the hook', () => {
        then('stdin `` is allowed, exit 0, silent', () => {
          const result = runHook({
            cwd: scene.tree,
            payload: '',
            projectDir: null,
          });
          expect(result).toEqual({ exitCode: 0, stderr: '' });
        });
      });

      when('[t4] a payload the guard cannot judge fires the hook', () => {
        const cases = [
          { payload: 'not json', cause: 'tool payload is not json' },
          { payload: '{"tool_name":', cause: 'tool payload is not json' },
          { payload: '{}', cause: 'tool payload has no tool_name' },
          {
            payload: '{"toolName":"Bash","tool_input":{"command":"ls"}}',
            cause: 'tool payload has no tool_name',
          },
        ];
        for (const thisCase of cases) {
          then(
            `stdin \`${thisCase.payload}\` proceeds: exit 1, one line that names the blind spot`,
            () => {
              const result = runHook({
                cwd: scene.tree,
                payload: thisCase.payload,
                projectDir: null,
              });
              expect(result).toEqual({
                exitCode: 1,
                stderr: asFaultLine({
                  cause: thisCase.cause,
                  fix: 'none needed for this call; if it recurs, report it at https://github.com/ehmpathy/rhachet-roles-bhrain/issues',
                }),
              });
              expect(result.stderr).toMatchSnapshot();
            },
          );
        }
      });
    },
  );

  given(
    '[caseA2] a tree with the hook but no learner link, where rhx is installed',
    () => {
      const scene = useBeforeAll(async () => {
        // node_modules links this repo's install, so a `rhx memory.guard` hook would
        // find rhx, fail its skill lookup, and exit 2 — the crews' exact stall
        const tree = genTempDir({ slug: 'memory-guard-hook-caseA2' });
        await fs.symlink(
          path.join(REPO_ROOT, 'node_modules'),
          path.join(tree, 'node_modules'),
        );
        return { tree };
      });

      when('[t0] a Bash, a Write, and an Edit fire the hook', () => {
        const payloads = [
          asBash({ command: 'ls' }),
          { tool_name: 'Write', tool_input: { file_path: 'src/a.ts' } },
          { tool_name: 'Edit', tool_input: { file_path: 'src/a.ts' } },
        ];
        for (const payload of payloads) {
          then(`${payload.tool_name} proceeds: exit 1, never 2`, () => {
            const result = runHook({
              cwd: scene.tree,
              payload,
              projectDir: null,
            });
            expect(result.exitCode).toEqual(1);
          });

          then(
            `${payload.tool_name} leaves one line that names the fix`,
            () => {
              const result = runHook({
                cwd: scene.tree,
                payload,
                projectDir: null,
              });
              expect(result.stderr).toEqual(`${NOT_LINKED_LINE}\n`);
              expect(result.stderr).toMatchSnapshot();
            },
          );
        }
      });

      when('[t1] a write into native memory fires the hook', () => {
        then(
          'it proceeds too: an unlinked guard has no authority to halt',
          () => {
            const result = runHook({
              cwd: scene.tree,
              payload: asBash({ command: `echo x > ${MEMORY_PATH}` }),
              projectDir: null,
            });
            expect(result.exitCode).toEqual(1);
          },
        );
      });
    },
  );

  given(
    '[caseA3] a learner link whose package is gone (the link dangles)',
    () => {
      const scene = useBeforeAll(async () => {
        // a removed or unbuilt package leaves the role link in place, pointed at naught
        const tree = genTempDir({ slug: 'memory-guard-hook-caseA3' });
        await linkLearnerSkills({
          tree,
          skillsDir: path.join(tree, 'node_modules/rhachet-roles-bhrain/gone'),
        });
        return { tree };
      });

      when('[t0] a Bash `ls` fires the hook', () => {
        then(
          'it proceeds: exit 1, one line that names the dangle and the reinstall',
          async () => {
            const result = runHook({
              cwd: scene.tree,
              payload: asBash({ command: 'ls' }),
              projectDir: scene.tree,
            });
            expect(result.exitCode).toEqual(1);
            expect(result.stderr).toEqual(
              asFaultLine({
                cause: `skill link dangles at ${scene.tree}/${LINK_DIR}/skills/memory.guard.sh`,
                fix: 'reinstall rhachet-roles-bhrain, then ./node_modules/.bin/rhachet roles link --repo bhrain --role learner',
              }),
            );
            expect(
              await asStderrSnap({ stderr: result.stderr, tree: scene.tree }),
            ).toMatchSnapshot();
          },
        );
      });

      when('[t1] the project dir points at a tree with no link', () => {
        then('the line names the dir it looked in', async () => {
          const elsewhere = genTempDir({ slug: 'memory-guard-hook-caseA3-x' });
          const result = runHook({
            cwd: scene.tree,
            payload: asBash({ command: 'ls' }),
            projectDir: elsewhere,
          });
          expect(result).toEqual({
            exitCode: 1,
            stderr: asFaultLine({
              cause: `skill not linked under ${elsewhere}`,
              fix: './node_modules/.bin/rhachet roles link --repo bhrain --role learner',
            }),
          });
        });
      });

      when(
        '[t2] the dangle sits on an ancestor dir, not the skills dir',
        () => {
          then('it still names the dangle and the reinstall', async () => {
            // the repo dir itself is the link, pointed at naught
            const tree = genTempDir({ slug: 'memory-guard-hook-caseA3-up' });
            await fs.mkdir(path.join(tree, '.agent'), { recursive: true });
            await fs.symlink(
              path.join(tree, 'node_modules/rhachet-roles-bhrain/gone'),
              path.join(tree, '.agent/repo=bhrain'),
            );
            const result = runHook({
              cwd: tree,
              payload: asBash({ command: 'ls' }),
              projectDir: tree,
            });
            expect(result).toEqual({
              exitCode: 1,
              stderr: asFaultLine({
                cause: `skill link dangles at ${tree}/${LINK_DIR}/skills/memory.guard.sh`,
                fix: 'reinstall rhachet-roles-bhrain, then ./node_modules/.bin/rhachet roles link --repo bhrain --role learner',
              }),
            });
          });
        },
      );
    },
  );

  given('[caseD] a linked learner whose cli throws as it loads', () => {
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'memory-guard-hook-caseD' });
      const { skillsDir } = await genFakePackage({
        tree,
        cliSource: "throw new Error('dependency at the wrong version');\n",
      });
      await linkLearnerSkills({ tree, skillsDir });
      return { tree };
    });

    when('[t0] a Bash `ls` fires the hook', () => {
      then(
        'it proceeds: exit 1, the line names a shipped load defect, the stack follows',
        async () => {
          const result = runHook({
            cwd: scene.tree,
            payload: asBash({ command: 'ls' }),
            projectDir: null,
          });
          expect(result.exitCode).toEqual(1);

          // a reinstall reloads the same throw, so the fix asks for a report
          const [lineFirst, ...linesStack] = result.stderr.split('\n');
          expect(`${lineFirst}\n`).toEqual(
            asFaultLine({
              cause: 'load defect, Error: dependency at the wrong version',
              fix: FIX_REPORT,
            }),
          );
          expect(linesStack.join('\n')).toContain(
            'Error: dependency at the wrong version',
          );
          expect(linesStack.join('\n')).toMatch(/\n\s+at /);
          expect(
            await asStderrSnap({ stderr: result.stderr, tree: scene.tree }),
          ).toMatchSnapshot();
        },
      );
    });

    when('[t1] a write into native memory fires the hook', () => {
      then('it proceeds too; never exit 2', () => {
        const result = runHook({
          cwd: scene.tree,
          payload: asBash({ command: `echo x > ${MEMORY_PATH}` }),
          projectDir: null,
        });
        expect(result.exitCode).toEqual(1);
      });
    });
  });

  given('[caseD-absent] a linked learner whose cli module is absent', () => {
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'memory-guard-hook-caseD-absent' });
      const { skillsDir } = await genFakePackage({ tree, cliSource: null });
      await linkLearnerSkills({ tree, skillsDir });
      return { tree };
    });

    when('[t0] a Bash `ls` fires the hook', () => {
      then(
        'it proceeds: exit 1, with one line that names the absent cli',
        async () => {
          // the guard names its physical path; the temp tree may sit behind a link
          const treeReal = await fs.realpath(scene.tree);
          const result = runHook({
            cwd: scene.tree,
            payload: asBash({ command: 'ls' }),
            projectDir: null,
          });
          expect(result.exitCode).toEqual(1);
          expect(result.stderr).toEqual(
            asFaultLine({
              cause: `cli absent at ${treeReal}/node_modules/rhachet-roles-bhrain/dist/contract/cli/memory.js`,
              fix: FIX_REINSTALL,
            }),
          );
          expect(
            await asStderrSnap({ stderr: result.stderr, tree: scene.tree }),
          ).toMatchSnapshot();
        },
      );
    });
  });

  given(
    '[caseD-modabsent] a linked learner whose cli requires an absent module',
    () => {
      const scene = useBeforeAll(async () => {
        const tree = genTempDir({ slug: 'memory-guard-hook-caseD-modabsent' });
        const { skillsDir } = await genFakePackage({
          tree,
          cliSource: "require('./absent-module');\n",
        });
        await linkLearnerSkills({ tree, skillsDir });
        return { tree };
      });

      when('[t0] a Bash `ls` fires the hook', () => {
        then(
          'it proceeds: exit 1, one line that names the absent module and the reinstall',
          async () => {
            const result = runHook({
              cwd: scene.tree,
              payload: asBash({ command: 'ls' }),
              projectDir: null,
            });
            expect(result.exitCode).toEqual(1);

            // an install fault: a reinstall cures it, so no stack rides along
            expect(result.stderr.split('\n').filter(Boolean)).toHaveLength(1);
            expect(result.stderr).toContain(
              "load failed, Error: Cannot find module './absent-module'",
            );
            expect(result.stderr).toContain(`fix: ${FIX_REINSTALL}`);
            expect(
              await asStderrSnap({ stderr: result.stderr, tree: scene.tree }),
            ).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[caseD-throw] a linked learner whose guard throws as it runs', () => {
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'memory-guard-hook-caseD-throw' });
      const { skillsDir } = await genFakePackage({
        tree,
        cliSource:
          "exports.memoryGuard = async () => { throw new TypeError('guard defect'); };\n",
      });
      await linkLearnerSkills({ tree, skillsDir });
      return { tree };
    });

    when('[t0] a Bash `ls` fires the hook', () => {
      then(
        'it proceeds: exit 1, with a line that names the defect and asks for a report',
        async () => {
          const result = runHook({
            cwd: scene.tree,
            payload: asBash({ command: 'ls' }),
            projectDir: null,
          });
          expect(result.exitCode).toEqual(1);

          // the fault line leads, since claude code shows the first stderr line
          const [lineFirst, ...linesStack] = result.stderr.split('\n');
          expect(`${lineFirst}\n`).toEqual(
            asFaultLine({
              cause: 'guard defect, TypeError: guard defect',
              fix: 'report it at https://github.com/ehmpathy/rhachet-roles-bhrain/issues, with the stack below',
            }),
          );

          // the full stack follows, so a report carries what a debug needs
          expect(linesStack[0]).toEqual('TypeError: guard defect');
          expect(linesStack[1]).toMatch(/^\s+at .*memory\.js/);
          expect(
            await asStderrSnap({ stderr: result.stderr, tree: scene.tree }),
          ).toMatchSnapshot();
        },
      );
    });
  });

  given(
    '[caseD-exit] a linked learner whose guard exits an unknown code',
    () => {
      const scene = useBeforeAll(async () => {
        const tree = genTempDir({ slug: 'memory-guard-hook-caseD-exit' });
        const { skillsDir } = await genFakePackage({
          tree,
          cliSource: 'exports.memoryGuard = () => process.exit(7);\n',
        });
        await linkLearnerSkills({ tree, skillsDir });
        return { tree };
      });

      when('[t0] a Bash `ls` fires the hook', () => {
        then('it proceeds: exit 1, with one line that names the code', () => {
          const result = runHook({
            cwd: scene.tree,
            payload: asBash({ command: 'ls' }),
            projectDir: null,
          });
          expect(result.exitCode).toEqual(1);
          expect(result.stderr).toEqual(
            asFaultLine({ cause: 'guard exited 7', fix: FIX_REINSTALL }),
          );
          expect(result.stderr).toMatchSnapshot();
        });
      });
    },
  );

  given('[caseD-exit2] a linked learner whose guard exits a stray 2', () => {
    // node's 2 is no verdict: only the private block code maps to the hook's 2
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'memory-guard-hook-caseD-exit2' });
      const { skillsDir } = await genFakePackage({
        tree,
        cliSource: 'exports.memoryGuard = () => process.exit(2);\n',
      });
      await linkLearnerSkills({ tree, skillsDir });
      return { tree };
    });

    when('[t0] a Bash `ls` fires the hook', () => {
      then(
        'it proceeds: exit 1, never 2, with one line that names the code',
        () => {
          const result = runHook({
            cwd: scene.tree,
            payload: asBash({ command: 'ls' }),
            projectDir: null,
          });
          expect(result).toEqual({
            exitCode: 1,
            stderr: asFaultLine({
              cause: 'guard exited 2',
              fix: FIX_REINSTALL,
            }),
          });
        },
      );
    });
  });

  given(
    '[caseD-file] a linked learner whose skill file cannot run as written',
    () => {
      // the exit map lives inside the skill file, so a file that cannot run as
      // written never reaches it: a syntax fault exits 2 (block), an empty or cut
      // file exits 0 with no word. the hook command seals the codes it accepts
      const scene = useBeforeAll(async () => {
        const skillSource = await fs.readFile(
          path.join(LEARNER_SKILLS_SRC, 'memory.guard.sh'),
          'utf-8',
        );
        const variants = {
          syntax: skillSource.replace(
            'set -euo pipefail',
            'set -euo pipefail\nfi',
          ),
          empty: '',
          cut: skillSource.slice(0, skillSource.indexOf('case "$STATUS" in')),
        };
        const trees = await Promise.all(
          Object.entries(variants).map(async ([slug, source]) => {
            const tree = genTempDir({
              slug: `memory-guard-hook-caseD-file-${slug}`,
            });
            // a cli that blocks every call, so the cut file truly reaches a block
            const { skillsDir } = await genFakePackage({
              tree,
              cliSource:
                "exports.memoryGuard = async () => ({ fault: null, nudge: 'blocked' });\n",
            });
            await fs.writeFile(path.join(skillsDir, 'memory.guard.sh'), source);
            await linkLearnerSkills({ tree, skillsDir });
            return { slug, tree };
          }),
        );
        return Object.fromEntries(trees.map(({ slug, tree }) => [slug, tree]));
      });

      const runOnTree = (input: { tree: string }) =>
        runHook({
          cwd: input.tree,
          payload: asBash({ command: `echo x > ${MEMORY_PATH}` }),
          projectDir: null,
        });

      when('[t0] a memory write fires the hook over each broken file', () => {
        then(
          'each proceeds: exit 1, never 2 and never a silent 0, with the fault line first',
          async () => {
            const outcomes = await Promise.all(
              ['syntax', 'empty', 'cut'].map(async (slug) => {
                const tree = scene[slug] ?? '';
                const result = runOnTree({ tree });
                return {
                  slug,
                  exitCode: result.exitCode,
                  stderr: await asStderrSnap({ stderr: result.stderr, tree }),
                };
              }),
            );
            outcomes.forEach((outcome) => {
              expect(outcome.exitCode).toEqual(1);
              expect(outcome.stderr.split('\n')[0]).toMatch(
                /^📜 memory\.guard: could not run \(skill ended with exit \d+, short of a sealed code, at \.\/\.agent\/repo=bhrain\/role=learner\/skills\/memory\.guard\.sh\); call allowed\. fix: reinstall rhachet-roles-bhrain$/,
              );
            });
            expect(outcomes).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[caseH] a linked learner, fed a payload past the env cap', () => {
    // linux caps one env string near 128KB; a payload held in the env would fail
    // every exec after it, so the guard must hand it to node on stdin
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'memory-guard-hook-caseH' });
      await linkLearnerSkills({ tree, skillsDir: LEARNER_SKILLS_SRC });
      return { tree };
    });

    when('[t0] a 160KB memory write fires the hook', () => {
      then('it is judged and blocked: exit 2, the nudge', () => {
        const result = runHook({
          cwd: scene.tree,
          payload: asBash({
            command: `echo ${'x'.repeat(160_000)} > ${MEMORY_PATH}`,
          }),
          projectDir: null,
        });
        expect(result.exitCode).toEqual(2);
        expect(result.stderr).not.toContain('could not run');
      });
    });

    when('[t1] a 160KB read fires the hook', () => {
      then('it is judged and allowed: exit 0, silent', () => {
        const result = runHook({
          cwd: scene.tree,
          payload: asBash({ command: `echo ${'x'.repeat(160_000)}` }),
          projectDir: null,
        });
        expect(result).toEqual({ exitCode: 0, stderr: '' });
      });
    });
  });

  given('[caseD-timeout] a linked learner whose guard never settles', () => {
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'memory-guard-hook-caseD-timeout' });
      const { skillsDir } = await genFakePackage({
        tree,
        cliSource:
          'exports.memoryGuard = () => new Promise(() => setInterval(() => {}, 1000));\n',
      });
      await linkLearnerSkills({ tree, skillsDir });
      const { binDir } = await genBinDir({
        tree,
        slug: 'without-timeout',
        tools: ['bash', 'cat', 'readlink', 'dirname', 'node'],
        stubs: {},
      });
      return { tree, binDir };
    });
    const TIMED_OUT_LINE = asFaultLine({
      cause: "timed out under the hook's 5s budget",
      fix: 'none needed for this call; if it recurs, the host is overloaded',
    });

    when('[t0] a Bash `ls` fires the hook on the host as is', () => {
      then(
        'it ends itself: exit 1, with one line that names the deadline',
        () => {
          const result = runHook({
            cwd: scene.tree,
            payload: asBash({ command: 'ls' }),
            projectDir: null,
          });
          expect(result).toEqual({ exitCode: 1, stderr: TIMED_OUT_LINE });
          expect(result.stderr).toMatchSnapshot();
        },
      );
    });

    when(
      '[t1] a Bash `ls` fires the hook on a host that lacks `timeout`',
      () => {
        then('the guard still ends itself: exit 1, the same line', () => {
          const result = runHook(
            {
              cwd: scene.tree,
              payload: asBash({ command: 'ls' }),
              projectDir: null,
            },
            { envPath: scene.binDir },
          );
          expect(result).toEqual({ exitCode: 1, stderr: TIMED_OUT_LINE });
          expect(result.stderr).toMatchSnapshot();
        });
      },
    );
  });

  given(
    '[caseD-no-node] a linked learner on a host whose PATH lacks node',
    () => {
      const scene = useBeforeAll(async () => {
        const tree = genTempDir({ slug: 'memory-guard-hook-caseD-no-node' });
        await linkLearnerSkills({ tree, skillsDir: LEARNER_SKILLS_SRC });
        const { binDir } = await genBinDir({
          tree,
          slug: 'without-node',
          tools: ['bash', 'cat', 'readlink', 'dirname'],
          stubs: {},
        });
        return { tree, binDir };
      });

      when('[t0] a Bash `ls` fires the hook', () => {
        then('it proceeds: exit 1, with one line that names node', () => {
          const result = runHook(
            {
              cwd: scene.tree,
              payload: asBash({ command: 'ls' }),
              projectDir: null,
            },
            { envPath: scene.binDir },
          );
          expect(result.exitCode).toEqual(1);
          expect(result.stderr).toEqual(
            asFaultLine({
              cause: 'node not found on the PATH',
              fix: 'install node, or put it on the PATH claude code gives its hooks',
            }),
          );
          expect(result.stderr).toMatchSnapshot();
        });
      });
    },
  );

  given(
    '[caseD-step] a linked learner whose own setup step exits 2 before node runs',
    () => {
      const scene = useBeforeAll(async () => {
        // `set -e` exits with the failed step's own status, so a setup step that
        // exits 2 would read as block. the guard must map it to 1 like any fault
        const tree = genTempDir({ slug: 'memory-guard-hook-caseD-step' });
        await linkLearnerSkills({ tree, skillsDir: LEARNER_SKILLS_SRC });
        const { binDir } = await genBinDir({
          tree,
          slug: 'dirname-exits-2',
          tools: ['bash', 'cat', 'readlink', 'node'],
          stubs: { dirname: 'exit 2' },
        });
        return { tree, binDir };
      });

      when('[t0] a memory write fires the hook', () => {
        then(
          'it proceeds: exit 1, never 2, with a line that names the fault',
          async () => {
            const result = runHook(
              {
                cwd: scene.tree,
                payload: asBash({ command: `echo x > ${MEMORY_PATH}` }),
                projectDir: null,
              },
              { envPath: scene.binDir },
            );
            expect(result.exitCode).toEqual(1);
            expect(
              result.stderr.replace(/at line \d+\)/, 'at line <n>)'),
            ).toEqual(
              asFaultLine({
                cause: 'setup step exited 2 at line <n>',
                fix: FIX_REINSTALL,
              }),
            );
            expect(
              await asStderrSnap({ stderr: result.stderr, tree: scene.tree }),
            ).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[caseD-stdin] a linked learner on a host whose stdin read faults',
    () => {
      const scene = useBeforeAll(async () => {
        // a payload the guard never read is a call it cannot judge: name it, never
        // grade the empty string it would otherwise see as an allowed read
        const tree = genTempDir({ slug: 'memory-guard-hook-caseD-stdin' });
        await linkLearnerSkills({ tree, skillsDir: LEARNER_SKILLS_SRC });
        const { binDir } = await genBinDir({
          tree,
          slug: 'cat-exits-1',
          tools: ['bash', 'readlink', 'dirname', 'node'],
          stubs: { cat: 'exit 1' },
        });
        return { tree, binDir };
      });

      when('[t0] a memory write fires the hook', () => {
        then(
          'it proceeds: exit 1, with a line that names the stdin read',
          () => {
            const result = runHook(
              {
                cwd: scene.tree,
                payload: asBash({ command: `echo x > ${MEMORY_PATH}` }),
                projectDir: null,
              },
              { envPath: scene.binDir },
            );
            expect(result).toEqual({
              exitCode: 1,
              stderr: asFaultLine({
                cause: 'tool payload unreadable on stdin',
                fix: 'none needed for this call; if it recurs, report it at https://github.com/ehmpathy/rhachet-roles-bhrain/issues',
              }),
            });
            expect(result.stderr).toMatchSnapshot();
          },
        );
      });
    },
  );

  given(
    '[caseG] a learner skill linked as a file, on a host whose readlink lacks -f',
    () => {
      const scene = useBeforeAll(async () => {
        // bsd readlink rejects -f; the guard must still find its own package
        const tree = genTempDir({ slug: 'memory-guard-hook-caseG' });
        await fs.mkdir(path.join(tree, LINK_DIR, 'skills'), {
          recursive: true,
        });
        await fs.symlink(
          path.join(LEARNER_SKILLS_SRC, 'memory.guard.sh'),
          path.join(tree, LINK_DIR, 'skills', 'memory.guard.sh'),
        );
        const probe = spawnSync('/bin/sh', ['-c', 'command -v readlink'], {
          encoding: 'utf-8',
        });
        if (probe.error) throw probe.error;
        const readlinkHost = probe.stdout.trim();
        if (!readlinkHost)
          throw new ConstraintError('test host lacks a tool this case wraps', {
            tool: 'readlink',
            case: 'caseG',
            hint: 'install readlink on the test host',
          });
        const { binDir } = await genBinDir({
          tree,
          slug: 'readlink-without-f',
          tools: ['bash', 'cat', 'dirname', 'node'],
          stubs: {
            readlink: `[ "$1" = "-f" ] && { echo "readlink: illegal option -- f" >&2; exit 1; }\nexec ${readlinkHost} "$@"`,
          },
        });
        return { tree, binDir };
      });

      when('[t0] a memory write fires the hook', () => {
        then('it is blocked, exit 2, with the nudge', () => {
          const result = runHook(
            {
              cwd: scene.tree,
              payload: asBash({ command: `echo x > ${MEMORY_PATH}` }),
              projectDir: null,
            },
            { envPath: scene.binDir },
          );
          expect(result.exitCode).toEqual(2);
          expect(result.stderr).toContain('memory would fade');
          expect(result.stderr).toMatchSnapshot();
        });
      });

      when('[t1] a Bash `ls` fires the hook', () => {
        then('it is allowed, exit 0, silent', () => {
          const result = runHook(
            {
              cwd: scene.tree,
              payload: asBash({ command: 'ls' }),
              projectDir: null,
            },
            { envPath: scene.binDir },
          );
          expect(result).toEqual({ exitCode: 0, stderr: '' });
        });
      });
    },
  );

  given('[caseF] a linked learner, with the cwd drifted into a subdir', () => {
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'memory-guard-hook-caseF' });
      await linkLearnerSkills({ tree, skillsDir: LEARNER_SKILLS_SRC });
      const subdir = path.join(tree, 'src/domain.operations');
      await fs.mkdir(subdir, { recursive: true });
      return { tree, subdir };
    });

    when('[t0] a memory write fires the hook from the subdir', () => {
      then('the project dir anchor still finds the guard: exit 2', () => {
        const result = runHook({
          cwd: scene.subdir,
          payload: asBash({ command: `echo x > ${MEMORY_PATH}` }),
          projectDir: scene.tree,
        });
        expect(result.exitCode).toEqual(2);
        expect(result.stderr).toContain('memory would fade');
      });

      then('a Bash `ls` from the subdir is allowed, silent', () => {
        const result = runHook({
          cwd: scene.subdir,
          payload: asBash({ command: 'ls' }),
          projectDir: scene.tree,
        });
        expect(result).toEqual({ exitCode: 0, stderr: '' });
      });
    });
  });
});
