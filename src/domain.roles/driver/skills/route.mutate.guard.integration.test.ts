import { exec } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * .what = creates a git branch in the temp dir
 * .why = the guard hook looks up the bound route by current branch name
 */
const createGitBranch = async (input: {
  cwd: string;
  branch: string;
}): Promise<void> => {
  await execAsync(`git checkout -b ${input.branch}`, { cwd: input.cwd });
};

/**
 * .what = invokes the route.mutate.guard.sh hook via stdin
 * .why = enables test of the shell-only guard logic in isolation
 */
const invokeGuardHook = async (input: {
  cwd: string;
  stdin: {
    tool_name: 'Read' | 'Write' | 'Edit' | 'Bash';
    tool_input: {
      file_path?: string;
      command?: string;
    };
  };
}): Promise<{ stdout: string; stderr: string; code: number }> => {
  const scriptPath = path.join(__dirname, 'route.mutate.guard.sh');
  const stdinJson = JSON.stringify(input.stdin);

  const cmd = `echo '${stdinJson}' | bash "${scriptPath}" --mode hook`;

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

describe('route.mutate.guard', () => {
  given('[case1] bound route with no privilege flag (branch matches)', () => {
    const scene = useBeforeAll(async () => {
      // create temp dir with route structure
      const tempDir = genTempDir({ slug: 'mutate-guard-case1', git: true });

      // create branch that matches bind flag
      const branch = 'test-branch';
      await createGitBranch({ cwd: tempDir, branch });

      // create route with bind flag for this branch
      const routeDir = path.join(tempDir, '.behavior', 'example');
      const routeMeta = path.join(routeDir, '.route');
      await fs.mkdir(routeMeta, { recursive: true });

      // create bind flag that matches branch name
      await fs.writeFile(
        path.join(routeMeta, `.bind.${branch}.flag`),
        `bound_by: ${branch}\n`,
      );

      // create protected files
      await fs.writeFile(
        path.join(routeDir, '1.vision.stone'),
        '# stone file\n',
      );
      await fs.writeFile(
        path.join(routeDir, '2.criteria.guard'),
        '# guard file\n',
      );
      await fs.writeFile(
        path.join(routeMeta, 'passage.jsonl'),
        '{"stone":"0.wish","status":"passed"}\n',
      );

      // create unprotected artifact
      await fs.writeFile(path.join(routeDir, '1.vision.md'), '# artifact\n');

      return { tempDir, routeDir, routeMeta, branch };
    });

    when('[t0] Read tool targets *.stone file', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/1.vision.stone',
            },
          },
        }),
      );

      then('exits with code 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });

      then('stderr contains block message', () => {
        expect(result.stderr).toContain('blocked');
      });
    });

    when('[t1] Read tool targets *.guard file', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/2.criteria.guard',
            },
          },
        }),
      );

      then('exits with code 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });
    });

    when('[t2] Read tool targets .route/** file', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/.route/passage.jsonl',
            },
          },
        }),
      );

      then('exits with code 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });
    });

    when('[t3] Read tool targets artifact (not protected)', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/1.vision.md',
            },
          },
        }),
      );

      then('exits with code 0 (allowed)', () => {
        expect(result.code).toEqual(0);
      });
    });

    when('[t4] Write tool targets .route/** file', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Write',
            tool_input: {
              file_path: '.behavior/example/.route/passage.jsonl',
            },
          },
        }),
      );

      then('exits with code 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });
    });
  });

  given('[case2] bound route with privilege flag', () => {
    const scene = useBeforeAll(async () => {
      // create temp dir with route structure
      const tempDir = genTempDir({ slug: 'mutate-guard-case2', git: true });

      // create branch that matches bind flag
      const branch = 'test-branch';
      await createGitBranch({ cwd: tempDir, branch });

      // create route with bind flag
      const routeDir = path.join(tempDir, '.behavior', 'example');
      const routeMeta = path.join(routeDir, '.route');
      await fs.mkdir(routeMeta, { recursive: true });

      // create bind flag that matches branch
      await fs.writeFile(
        path.join(routeMeta, `.bind.${branch}.flag`),
        `bound_by: ${branch}\n`,
      );

      // create privilege flag
      await fs.writeFile(
        path.join(routeMeta, '.privilege.mutate.flag'),
        'granted_by: test\n',
      );

      // create protected files
      await fs.writeFile(
        path.join(routeDir, '1.vision.stone'),
        '# stone file\n',
      );

      return { tempDir, routeDir, routeMeta };
    });

    when('[t0] Read tool targets *.stone file', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/1.vision.stone',
            },
          },
        }),
      );

      then('exits with code 0 (allowed due to privilege)', () => {
        expect(result.code).toEqual(0);
      });
    });
  });

  given('[case3] bash command detection', () => {
    const scene = useBeforeAll(async () => {
      // create temp dir with route structure
      const tempDir = genTempDir({ slug: 'mutate-guard-case3', git: true });

      // create branch that matches bind flag
      const branch = 'test-branch';
      await createGitBranch({ cwd: tempDir, branch });

      // create route with bind flag
      const routeDir = path.join(tempDir, '.behavior', 'example');
      const routeMeta = path.join(routeDir, '.route');
      await fs.mkdir(routeMeta, { recursive: true });

      // create bind flag that matches branch
      await fs.writeFile(
        path.join(routeMeta, `.bind.${branch}.flag`),
        `bound_by: ${branch}\n`,
      );

      // create protected files
      await fs.writeFile(
        path.join(routeDir, '1.vision.stone'),
        '# stone file\n',
      );

      return { tempDir, routeDir, routeMeta };
    });

    when('[t0] Bash tool runs `cat` on *.stone', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Bash',
            tool_input: {
              command: 'cat .behavior/example/1.vision.stone',
            },
          },
        }),
      );

      then('exits with code 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });
    });

    when('[t1] Bash tool runs `head` on *.guard', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Bash',
            tool_input: {
              command: 'head .behavior/example/2.criteria.guard',
            },
          },
        }),
      );

      then('exits with code 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });
    });

    when('[t2] Bash tool runs `tail` on .route/**', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Bash',
            tool_input: {
              command: 'tail .behavior/example/.route/passage.jsonl',
            },
          },
        }),
      );

      then('exits with code 2 (blocked)', () => {
        expect(result.code).toEqual(2);
      });
    });

    when('[t3] Bash tool runs safe command', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Bash',
            tool_input: {
              command: 'ls -la',
            },
          },
        }),
      );

      then('exits with code 0 (allowed)', () => {
        expect(result.code).toEqual(0);
      });
    });
  });

  given('[case4] no bound route', () => {
    const scene = useBeforeAll(async () => {
      // create temp dir WITHOUT any bound route
      const tempDir = genTempDir({ slug: 'mutate-guard-case4', git: true });

      // create route dir but NO bind flag
      const routeDir = path.join(tempDir, '.behavior', 'example');
      await fs.mkdir(routeDir, { recursive: true });

      // create a stone file (but route not bound)
      await fs.writeFile(
        path.join(routeDir, '1.vision.stone'),
        '# stone file\n',
      );

      return { tempDir, routeDir };
    });

    when('[t0] Read tool targets *.stone file', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/1.vision.stone',
            },
          },
        }),
      );

      then('exits with code 0 (no route bound = no protection)', () => {
        expect(result.code).toEqual(0);
      });
    });
  });

  given('[case5] audit log entry', () => {
    const scene = useBeforeAll(async () => {
      // create temp dir with route structure
      const tempDir = genTempDir({ slug: 'mutate-guard-case5', git: true });

      // create branch that matches bind flag
      const branch = 'test-branch';
      await createGitBranch({ cwd: tempDir, branch });

      // create route with bind flag
      const routeDir = path.join(tempDir, '.behavior', 'example');
      const routeMeta = path.join(routeDir, '.route');
      await fs.mkdir(routeMeta, { recursive: true });

      // create bind flag that matches branch
      await fs.writeFile(
        path.join(routeMeta, `.bind.${branch}.flag`),
        `bound_by: ${branch}\n`,
      );

      // create protected file
      await fs.writeFile(
        path.join(routeDir, '1.vision.stone'),
        '# stone file\n',
      );

      return { tempDir, routeDir, routeMeta };
    });

    when('[t0] blocked access attempt', () => {
      const result = useThen('hook is invoked', async () => {
        const hookResult = await invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/1.vision.stone',
            },
          },
        });

        // read the events log
        const eventsPath = path.join(
          scene.routeMeta,
          '.guardrail.events.jsonl',
        );
        let events = '';
        try {
          events = await fs.readFile(eventsPath, 'utf-8');
        } catch {
          events = '';
        }

        return { hookResult, events };
      });

      then('event is logged to .guardrail.events.jsonl', () => {
        expect(result.events).toContain('"verdict":"blocked"');
        expect(result.events).toContain('"reason":"*.stone"');
      });

      then('event has no timestamp', () => {
        // events should not contain time-related fields
        expect(result.events).not.toContain('"at":');
        expect(result.events).not.toContain('"timestamp":');
      });
    });
  });

  given('[case6] branch does NOT match bind flag (negative)', () => {
    const scene = useBeforeAll(async () => {
      // create temp dir with route structure
      const tempDir = genTempDir({ slug: 'mutate-guard-case6', git: true });

      // create branch that does NOT match bind flag
      const currentBranch = 'current-branch';
      const boundBranch = 'other-branch';
      await createGitBranch({ cwd: tempDir, branch: currentBranch });

      // create route with bind flag for a DIFFERENT branch
      const routeDir = path.join(tempDir, '.behavior', 'example');
      const routeMeta = path.join(routeDir, '.route');
      await fs.mkdir(routeMeta, { recursive: true });

      // create bind flag for OTHER branch (not current)
      await fs.writeFile(
        path.join(routeMeta, `.bind.${boundBranch}.flag`),
        `bound_by: ${boundBranch}\n`,
      );

      // create protected files
      await fs.writeFile(
        path.join(routeDir, '1.vision.stone'),
        '# stone file\n',
      );

      return { tempDir, routeDir, routeMeta, currentBranch, boundBranch };
    });

    when('[t0] Read tool targets *.stone file', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/example/1.vision.stone',
            },
          },
        }),
      );

      then('exits with code 0 (no protection - branch mismatch)', () => {
        expect(result.code).toEqual(0);
      });
    });

    when('[t1] Write tool targets .route/** file', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Write',
            tool_input: {
              file_path: '.behavior/example/.route/passage.jsonl',
            },
          },
        }),
      );

      then('exits with code 0 (no protection - branch mismatch)', () => {
        expect(result.code).toEqual(0);
      });
    });
  });

  given('[case7] multiple routes bound to different branches', () => {
    const scene = useBeforeAll(async () => {
      // create temp dir with route structure
      const tempDir = genTempDir({ slug: 'mutate-guard-case7', git: true });

      // create branch
      const currentBranch = 'current-branch';
      await createGitBranch({ cwd: tempDir, branch: currentBranch });

      // create TWO routes: one bound to current, one bound to other
      const route1Dir = path.join(tempDir, '.behavior', 'route1');
      const route1Meta = path.join(route1Dir, '.route');
      await fs.mkdir(route1Meta, { recursive: true });

      const route2Dir = path.join(tempDir, '.behavior', 'route2');
      const route2Meta = path.join(route2Dir, '.route');
      await fs.mkdir(route2Meta, { recursive: true });

      // route1 bound to current branch
      await fs.writeFile(
        path.join(route1Meta, `.bind.${currentBranch}.flag`),
        `bound_by: ${currentBranch}\n`,
      );

      // route2 bound to different branch
      await fs.writeFile(
        path.join(route2Meta, '.bind.other-branch.flag'),
        'bound_by: other-branch\n',
      );

      // create protected files in both routes
      await fs.writeFile(
        path.join(route1Dir, '1.vision.stone'),
        '# route1 stone\n',
      );
      await fs.writeFile(
        path.join(route2Dir, '1.vision.stone'),
        '# route2 stone\n',
      );

      return { tempDir, route1Dir, route1Meta, route2Dir, route2Meta };
    });

    when(
      '[t0] Read tool targets stone in route bound to current branch',
      () => {
        const result = useThen('hook is invoked', async () =>
          invokeGuardHook({
            cwd: scene.tempDir,
            stdin: {
              tool_name: 'Read',
              tool_input: {
                file_path: '.behavior/route1/1.vision.stone',
              },
            },
          }),
        );

        then('exits with code 2 (blocked - current branch route)', () => {
          expect(result.code).toEqual(2);
        });
      },
    );

    when('[t1] Read tool targets stone in route bound to other branch', () => {
      const result = useThen('hook is invoked', async () =>
        invokeGuardHook({
          cwd: scene.tempDir,
          stdin: {
            tool_name: 'Read',
            tool_input: {
              file_path: '.behavior/route2/1.vision.stone',
            },
          },
        }),
      );

      then('exits with code 0 (allowed - different branch route)', () => {
        expect(result.code).toEqual(0);
      });
    });
  });
});
