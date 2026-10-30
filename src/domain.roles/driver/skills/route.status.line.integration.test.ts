import { execSync, spawnSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  useThen,
  when,
} from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import { delRouteBind } from '@src/domain.operations/route/bind/delRouteBind';
import { isRouteBindMultiBindFault } from '@src/domain.operations/route/bind/isRouteBindMultiBindFault';
import { setRouteBind } from '@src/domain.operations/route/bind/setRouteBind';
import { setPassageReport } from '@src/domain.operations/route/passage/setPassageReport';
import { NAMES_OF_RENDER_LEDGERS } from '@src/domain.operations/route/statusLine/cache/NAMES_OF_RENDER_LEDGERS';
import { asRouteStatusLinePointerPath } from '@src/domain.operations/route/statusLine/file/asRouteStatusLinePointerPath';
import { MARK_OF_MULTI_BIND } from '@src/domain.operations/route/statusLine/file/MARK_OF_MULTI_BIND';
import { NAME_OF_ROUTE_STATUS_LINE_FILE } from '@src/domain.operations/route/statusLine/file/NAME_OF_ROUTE_STATUS_LINE_FILE';
import { stepRouteDrive } from '@src/domain.operations/route/stepRouteDrive';
import { stepRouteStatusLine } from '@src/domain.operations/route/stepRouteStatusLine';
import { sanitizeBranchName } from '@src/utils/git/sanitizeBranchName';

/**
 * .what = integration tests for the bash status line reader
 * .why = the clamp the wish asks for: a repaint spawns no node process. the reader runs
 *        here with PATH emptied, so any child process (node, git, jq, sed) cannot be found;
 *        a line printed under that PATH spawned none. the node entry it replaces fails there
 *
 * .note = the writers run for real (setRouteBind, setPassageReport) inside a chdir to the
 *         temp repo, and the reader runs as the harness runs it: bash, cwd at the repo root
 */

const READER_PATH = path.join(__dirname, 'route.status.line.sh');
const BASH_PATH = execSync('command -v bash').toString().trim();

/**
 * .what = the statusLine command the reader replaces, as pr #700 shipped it
 * .why = the clamp must be red on the old line: under an empty PATH it cannot find node
 */
const COMMAND_OF_NODE_ENTRY = `node -e "import('rhachet-roles-bhrain/cli/route.status.line').then(m => m.routeStatusLine())"`;

/**
 * .what = the most a reader run may take before the test fails
 * .why = a wedged child (a stalled fs, a hung bash start) must fail loud, never hang the suite
 */
const TIMEOUT_OF_READER_MS = 10_000;

/**
 * .what = runs the reader in a dir with PATH emptied, as the clamp demands
 */
const runReader = (input: {
  tempDir: string;
  args?: string[];
}): { stdout: string; stderr: string; status: number | null } => {
  const result = spawnSync(BASH_PATH, [READER_PATH, ...(input.args ?? [])], {
    cwd: input.tempDir,
    env: { PATH: '' },
    encoding: 'utf-8',
    timeout: TIMEOUT_OF_READER_MS,
  });

  // fail loud on a spawn that did not complete (a timeout, an absent bash)
  if (result.error) throw result.error;
  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
  };
};

/**
 * .what = the reader's whole outcome, as a snapshot holds it
 * .why = the reader promises exit 0 and a quiet stderr on every path; a snap of stdout
 *        alone would let a stray stderr row or a non-zero exit pass
 */
const asReaderSnap = (input: {
  stdout: string;
  stderr: string;
  status: number | null;
}): { status: number | null; stdout: string; stderr: string } => ({
  status: input.status,
  stdout: input.stdout,
  stderr: input.stderr,
});

/**
 * .what = runs a step inside a chdir to the temp repo
 * .why = the writers read paths relative to process.cwd(), as the cli does
 */
const withinTempRepo = async <T>(
  input: { tempDir: string },
  logic: () => Promise<T>,
): Promise<T> => {
  const cwdOriginal = process.cwd();
  process.chdir(input.tempDir);
  try {
    return await logic();
  } finally {
    process.chdir(cwdOriginal);
  }
};

/**
 * .what = a temp git repo on a feature branch with a two-stone route, bound via the real bind
 */
const genBoundRouteRepo = async (input: {
  slug: string;
}): Promise<{
  tempDir: string;
  stateDir: string;
  branch: string;
  route: string;
}> => {
  const tempDir = genTempDir({ slug: input.slug, git: true });
  const branch = 'feat/status-line';
  execSync(`git checkout -q -b ${branch}`, { cwd: tempDir });
  const route = 'my-route';
  const routeDir = path.join(tempDir, route);
  fs.mkdirSync(routeDir, { recursive: true });
  fs.writeFileSync(path.join(routeDir, '1.vision.stone'), '# stone: vision');
  fs.writeFileSync(path.join(routeDir, '2.plan.stone'), '# stone: plan');
  await withinTempRepo({ tempDir }, () => setRouteBind({ route }));
  return { tempDir, stateDir: path.join(routeDir, '.route'), branch, route };
};

/**
 * .what = the drive's context, with a reminder daemon spawn that starts no process
 * .why = the heal under test is the drive's status refresh; a real daemon would outlive the
 *        test and hold its temp dir
 */
const CONTEXT_OF_DRIVE = {
  spawnDaemon: async (): Promise<{ pid: number }> => ({ pid: 0 }),
};

/**
 * .what = sets a file's mtime back by the given seconds, so a later real write reads newer
 */
const setMtimeBack = (input: { filePath: string; seconds: number }): void => {
  const back = new Date(Date.now() - input.seconds * 1000);
  fs.utimesSync(input.filePath, back, back);
};

/**
 * .what = sets a file's mtime one minute ahead, so `-nt` sees it newer at any fs resolution
 */
const setMtimeAhead = (input: { filePath: string }): void => {
  const ahead = new Date(Date.now() + 60_000);
  fs.utimesSync(input.filePath, ahead, ahead);
};

describe('route.status.line.sh', () => {
  given(
    '[case1] a branch bound to a route, after the bind wrote the file',
    () => {
      const scene = useBeforeAll(async () =>
        genBoundRouteRepo({ slug: 'status-line-reader-fresh' }),
      );

      when('[t0] the reader runs with PATH emptied', () => {
        const result = useThen('it runs', async () => runReader(scene));
        const rendered = useThen('the node render runs', async () =>
          withinTempRepo(scene, () =>
            stepRouteStatusLine({ route: scene.route }),
          ),
        );

        then('it prints the line, so it spawned no child process', () => {
          expect(result.status).toEqual(0);
          expect(result.stderr).toEqual('');
          expect(result.stdout).toEqual('🗿 1.vision, yield 🌾\n');
        });

        then('the line is byte-equal to the node render', () => {
          expect(result.stdout).toEqual(`${rendered.line}\n`);
          expect(asReaderSnap(result)).toMatchSnapshot();
        });
      });

      when('[t1] the node entry runs with PATH emptied', () => {
        const result = useThen('it runs', async () =>
          spawnSync(BASH_PATH, ['-c', COMMAND_OF_NODE_ENTRY], {
            cwd: scene.tempDir,
            env: { PATH: '' },
            encoding: 'utf-8',
          }),
        );

        then('it fails: the old line needs a node process per repaint', () => {
          expect(result.status).not.toEqual(0);
          expect(result.stdout).toEqual('');
          expect(result.stderr).toContain('node');
        });

        then('its exit, stdout, and masked stderr match the snapshot', () => {
          // bash words a not-found differently by build, so the words around `node` are masked
          // and the line itself stays under the snapshot
          expect({
            status: result.status,
            stdout: result.stdout,
            stderr: result.stderr
              .split('\n')
              .map((line) =>
                /\bnode\b/.test(line) ? '<bash>: node: <not found>' : line,
              )
              .join('\n'),
          }).toMatchSnapshot();
        });
      });

      when(
        '[t3] the reader source is read for a spawn the empty PATH misses',
        () => {
          // an empty PATH stops every lookup; it does not stop an absolute path (`/usr/bin/x`),
          // a `command -p` (which searches a default PATH), or a subshell fork. so each is
          // forbidden in the reader's code lines, and the clamp covers what PATH cannot
          const linesOfCode = useThen('the code lines are read', async () => ({
            lines: fs
              .readFileSync(READER_PATH, 'utf-8')
              .split('\n')
              .filter((line) => !line.trim().startsWith('#')),
          }));

          then('no code line names an executable by absolute path', () => {
            expect(
              linesOfCode.lines.filter((line) =>
                /\/(usr\/)?(local\/)?s?bin\//.test(line),
              ),
            ).toEqual([]);
          });

          then('no code line runs `command -p` or forks a subshell', () => {
            expect(
              linesOfCode.lines.filter((line) =>
                /command\s+-p|\$\(|`/.test(line),
              ),
            ).toEqual([]);
          });
        },
      );

      when('[t2] a passage moves the route, via the real writer', () => {
        const result = useThen('it runs', async () => {
          await withinTempRepo(scene, () =>
            setPassageReport({
              report: new PassageReport({
                stone: '1.vision',
                status: 'passed',
              }),
              route: scene.route,
            }),
          );
          return runReader(scene);
        });

        then('it prints the next stone, fresh', () => {
          expect(result.stdout).toEqual('🗿 2.plan, yield 🌾\n');
          expect(asReaderSnap(result)).toMatchSnapshot();
        });
      });
    },
  );

  given('[case2] a render input newer than the status file', () => {
    const scene = useBeforeAll(async () =>
      genBoundRouteRepo({ slug: 'status-line-reader-stale' }),
    );

    when('[t0] the reader runs', () => {
      const result = useThen('it runs', async () => {
        const passagePath = path.join(scene.stateDir, 'passage.jsonl');
        fs.appendFileSync(
          passagePath,
          `${JSON.stringify({ stone: '1.vision', status: 'passed' })}\n`,
        );
        setMtimeAhead({ filePath: passagePath });
        return runReader(scene);
      });

      then('it prints the line it holds, marked stale, with the fix', () => {
        expect(result.stdout).toEqual(
          '🗿 1.vision, yield 🌾 · stale, rhx route.drive\n',
        );
        expect(asReaderSnap(result)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case2b] a fresh line, then a yield, a real passage, and a drive',
    () => {
      const scene = useBeforeAll(async () => {
        const repo = await genBoundRouteRepo({
          slug: 'status-line-reader-stale-then-drive',
        });

        // age every input past the file, and the file past now, so a real write reads newer
        for (const name of fs.readdirSync(repo.stateDir))
          setMtimeBack({
            filePath: path.join(repo.stateDir, name),
            seconds: name === NAME_OF_ROUTE_STATUS_LINE_FILE ? 60 : 120,
          });
        return repo;
      });

      when('[t0] the driver writes a yield into the route dir', () => {
        const result = useThen('it runs', async () => {
          fs.writeFileSync(
            path.join(scene.tempDir, scene.route, '1.vision.yield.md'),
            '# yield',
          );
          return runReader(scene);
        });

        then('the line stays fresh: a yield is no render input (F6)', () => {
          expect(result.stdout).toEqual('🗿 1.vision, yield 🌾\n');
        });
      });

      when(
        '[t1] a passage lands with no status write (a crash between)',
        () => {
          const result = useThen('it runs', async () => {
            fs.appendFileSync(
              path.join(scene.stateDir, 'passage.jsonl'),
              `${JSON.stringify({ stone: '1.vision', status: 'passed' })}\n`,
            );
            return runReader(scene);
          });

          then('the line reads stale, with the fix', () => {
            expect(result.stdout).toEqual(
              '🗿 1.vision, yield 🌾 · stale, rhx route.drive\n',
            );
          });
        },
      );

      when('[t2] route.drive runs, via the real drive', () => {
        const result = useThen('it runs', async () => {
          await withinTempRepo(scene, () =>
            stepRouteDrive({}, CONTEXT_OF_DRIVE),
          );
          return runReader(scene);
        });

        then(
          'the stale mark is gone and the line shows the moved route',
          () => {
            expect(result.stdout).toEqual('🗿 2.plan, yield 🌾\n');
            expect(asReaderSnap(result)).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[case3] a promise newer than the status file', () => {
    const scene = useBeforeAll(async () =>
      genBoundRouteRepo({ slug: 'status-line-reader-stale-promise' }),
    );

    when('[t0] the reader runs', () => {
      const result = useThen('it runs', async () => {
        const promisePath = path.join(
          scene.stateDir,
          '1.vision.guard.promise.all-done.md',
        );
        fs.writeFileSync(promisePath, '# promise');
        setMtimeAhead({ filePath: promisePath });
        return runReader(scene);
      });

      then('it reads stale, exits 0, with no stderr', () => {
        expect(result.stdout).toEqual(
          '🗿 1.vision, yield 🌾 · stale, rhx route.drive\n',
        );
        expect(result.status).toEqual(0);
        expect(result.stderr).toEqual('');
      });
    });
  });

  /**
   * .what = each render input the reader's stale test reads, beside passage (case2) and
   *         promise (case3): every one of them, made newer than the file, marks the line stale
   */
  const STALE_INPUT_CASES: {
    slug: string;
    name: (input: { branch: string }) => string;
  }[] = [
    {
      slug: 'meter-ledger',
      name: () => 'reviewPeerMeters.jsonl',
    },
    {
      slug: 'bind-flag',
      name: ({ branch }) => `.bind.${sanitizeBranchName({ branch })}.flag`,
    },
  ];
  STALE_INPUT_CASES.map((stale) =>
    given(`[case3b] a ${stale.slug} newer than the status file`, () => {
      const scene = useBeforeAll(async () =>
        genBoundRouteRepo({ slug: `status-line-reader-stale-${stale.slug}` }),
      );

      when('[t0] the reader runs', () => {
        const result = useThen('it runs', async () => {
          const inputPath = path.join(
            scene.stateDir,
            stale.name({ branch: scene.branch }),
          );
          if (!fs.existsSync(inputPath)) fs.writeFileSync(inputPath, '');
          setMtimeAhead({ filePath: inputPath });
          return runReader(scene);
        });

        then('it reads stale, exits 0, with no stderr', () => {
          expect(result.stdout).toEqual(
            '🗿 1.vision, yield 🌾 · stale, rhx route.drive\n',
          );
          expect(result.status).toEqual(0);
          expect(result.stderr).toEqual('');
        });
      });
    }),
  );

  given(
    '[case3c] the ledgers the render reads, against the reader source',
    () => {
      when('[t0] the reader source is read', () => {
        const reader = useThen('it reads', async () => ({
          source: fs.readFileSync(READER_PATH, 'utf-8'),
        }));

        then(
          'the stale test names each render ledger, by its exact name',
          () => {
            for (const name of NAMES_OF_RENDER_LEDGERS)
              expect(reader.source).toContain(`"$state_dir/${name}"`);
          },
        );
      });
    },
  );

  given('[case4] a bound branch whose status file is absent', () => {
    const scene = useBeforeAll(async () => {
      const repo = await genBoundRouteRepo({
        slug: 'status-line-reader-absent',
      });
      fs.rmSync(path.join(repo.stateDir, NAME_OF_ROUTE_STATUS_LINE_FILE));
      return repo;
    });

    when('[t0] the reader runs', () => {
      const result = useThen('it runs', async () => runReader(scene));

      then('it reads unknown, never a silent blank, and names the fix', () => {
        expect(result.stdout).toEqual('🗿 status unknown, rhx route.drive\n');
        expect(asReaderSnap(result)).toMatchSnapshot();
      });
    });

    when('[t1] route.drive heals it, via the real drive', () => {
      const result = useThen('it runs', async () => {
        await withinTempRepo(scene, () => stepRouteDrive({}, CONTEXT_OF_DRIVE));
        return runReader(scene);
      });

      then('it prints the line again', () => {
        expect(result.stdout).toEqual('🗿 1.vision, yield 🌾\n');
      });
    });
  });

  given(
    '[case4b] a branch bound before the pointer existed (upgrade, fresh worktree)',
    () => {
      const scene = useBeforeAll(async () => {
        // a route in the conventional home, bound for real, then its pointer removed
        const tempDir = genTempDir({
          slug: 'status-line-reader-no-pointer',
          git: true,
        });
        const branch = 'feat/status-line';
        execSync(`git checkout -q -b ${branch}`, { cwd: tempDir });
        const route = '.behavior/v2026_10_26.feat';
        fs.mkdirSync(path.join(tempDir, route), { recursive: true });
        fs.writeFileSync(
          path.join(tempDir, route, '1.vision.stone'),
          '# stone: vision',
        );
        await withinTempRepo({ tempDir }, () => setRouteBind({ route }));
        fs.rmSync(asRouteStatusLinePointerPath({ cwd: tempDir, branch }));
        return { tempDir, route };
      });

      when('[t0] the reader runs', () => {
        const result = useThen('it runs', async () => runReader(scene));

        then(
          'it reads unknown, never a silent blank, and names the fix',
          () => {
            expect(result.status).toEqual(0);
            expect(result.stdout).toEqual(
              '🗿 status unknown, rhx route.drive\n',
            );
            expect(asReaderSnap(result)).toMatchSnapshot();
          },
        );
      });

      when('[t1] route.drive heals it, via the real drive', () => {
        const result = useThen('it runs', async () => {
          await withinTempRepo(scene, () =>
            stepRouteDrive({}, CONTEXT_OF_DRIVE),
          );
          return runReader(scene);
        });

        then('it prints the line again', () => {
          expect(result.stdout).toEqual('🗿 1.vision, yield 🌾\n');
        });
      });
    },
  );

  given('[case4c] a seat whose cwd drifted into a subdir of the repo', () => {
    const scene = useBeforeAll(async () => {
      const repo = await genBoundRouteRepo({
        slug: 'status-line-reader-cwd-drift',
      });
      const subDir = path.join(repo.tempDir, 'src', 'deep');
      fs.mkdirSync(subDir, { recursive: true });
      return { ...repo, subDir };
    });

    when('[t0] the reader runs from the subdir', () => {
      const result = useThen('it runs', async () =>
        runReader({ tempDir: scene.subDir }),
      );

      then('it walks up to the repo root and prints the line', () => {
        expect(result.status).toEqual(0);
        expect(result.stderr).toEqual('');
        expect(result.stdout).toEqual('🗿 1.vision, yield 🌾\n');
      });
    });
  });

  given('[case4d] a route bound from a subdir of the repo', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'status-line-reader-bind-subdir',
        git: true,
      });
      execSync('git checkout -q -b feat/status-line', { cwd: tempDir });
      fs.mkdirSync(path.join(tempDir, 'my-route'), { recursive: true });
      fs.writeFileSync(
        path.join(tempDir, 'my-route', '1.vision.stone'),
        '# stone: vision',
      );
      const subDir = path.join(tempDir, 'src');
      fs.mkdirSync(subDir, { recursive: true });
      await withinTempRepo({ tempDir: subDir }, () =>
        setRouteBind({ route: '../my-route' }),
      );
      return { tempDir };
    });

    when('[t0] the reader runs from the repo root', () => {
      const result = useThen('it runs', async () => runReader(scene));

      then('the bind named the pointer at the root, so the line shows', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toEqual('🗿 1.vision, yield 🌾\n');
      });
    });
  });

  given('[case4e] a multi-bind found by a bind run from a subdir', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({
        slug: 'status-line-reader-multi-bind-subdir',
        git: true,
      });
      const branch = 'feat/status-line';
      execSync(`git checkout -q -b ${branch}`, { cwd: tempDir });

      // two routes under src/, each holds this branch's flag, by hand
      const subDir = path.join(tempDir, 'src');
      for (const name of ['route-a', 'route-b']) {
        fs.mkdirSync(path.join(subDir, name, '.route'), { recursive: true });
        fs.writeFileSync(path.join(subDir, name, '1.vision.stone'), '# vision');
        fs.writeFileSync(
          path.join(
            subDir,
            name,
            '.route',
            `.bind.${sanitizeBranchName({ branch })}.flag`,
          ),
          `branch: ${branch}\n`,
        );
      }

      // the bind from src/ finds both flags and faults
      const error = await withinTempRepo({ tempDir: subDir }, () =>
        getError(setRouteBind({ route: 'route-a' })),
      );
      return { tempDir, error };
    });

    when('[t0] the reader runs from the repo root', () => {
      const result = useThen('it runs', async () => runReader(scene));

      then('the bind refused on the multi-bind fault', () => {
        expect(isRouteBindMultiBindFault({ error: scene.error })).toEqual(true);
      });

      then('the mark landed at the root, so the multi-bind line shows', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toEqual(
          '🗿 two routes bound to this branch, rhx route.bind.get\n',
        );
      });
    });
  });

  given('[case5] a bound branch whose status file does not parse', () => {
    const scene = useBeforeAll(async () => {
      const repo = await genBoundRouteRepo({
        slug: 'status-line-reader-unreadable',
      });
      fs.writeFileSync(
        path.join(repo.stateDir, NAME_OF_ROUTE_STATUS_LINE_FILE),
        '{"route":"my-route","li',
      );
      return repo;
    });

    when('[t0] the reader runs', () => {
      const result = useThen('it runs', async () => runReader(scene));

      then('it reads unknown', () => {
        expect(result.stdout).toEqual('🗿 status unknown, rhx route.drive\n');
        expect({
          status: result.status,
          stdout: result.stdout,
          stderr: result.stderr,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case6] a branch pointer marked as a multi-bind', () => {
    const scene = useBeforeAll(async () => {
      const repo = await genBoundRouteRepo({
        slug: 'status-line-reader-multi-bind',
      });
      fs.writeFileSync(
        asRouteStatusLinePointerPath({
          cwd: repo.tempDir,
          branch: repo.branch,
        }),
        `${MARK_OF_MULTI_BIND}\n`,
      );
      return repo;
    });

    when('[t0] the reader runs', () => {
      const result = useThen('it runs', async () => runReader(scene));

      then('it prints the fault line, with the fix', () => {
        expect(result.stdout).toEqual(
          '🗿 two routes bound to this branch, rhx route.bind.get\n',
        );
        expect(asReaderSnap(result)).toMatchSnapshot();
      });
    });
  });

  given('[case7] a pointer whose route lost its bind flag by hand', () => {
    const scene = useBeforeAll(async () => {
      const repo = await genBoundRouteRepo({
        slug: 'status-line-reader-flag-gone',
      });
      fs.rmSync(
        path.join(
          repo.stateDir,
          `.bind.${sanitizeBranchName({ branch: repo.branch })}.flag`,
        ),
      );
      return repo;
    });

    when('[t0] the reader runs', () => {
      const result = useThen('it runs', async () => runReader(scene));

      then('it prints the blank line, as unbound', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toEqual('');
      });
    });
  });

  given('[case8] an unbound repo', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: genTempDir({ slug: 'status-line-reader-unbound', git: true }),
    }));

    when('[t0] the reader runs', () => {
      const result = useThen('it runs', async () => runReader(scene));

      then('it prints the blank line', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toEqual('');
        expect(result.stderr).toEqual('');
        expect({
          status: result.status,
          stdout: result.stdout,
          stderr: result.stderr,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case8b] the --help flag', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: genTempDir({ slug: 'status-line-reader-help', git: true }),
    }));

    when('[t0] the reader runs with --help', () => {
      const result = useThen('it runs', async () =>
        runReader({ tempDir: scene.tempDir, args: ['--help'] }),
      );

      then('it prints usage, output states, and an example, exit 0', () => {
        expect(result.status).toEqual(0);
        expect(result.stderr).toEqual('');
        expect(result.stdout).toContain('usage:');
        expect(result.stdout).toContain('🗿 status unknown, rhx route.drive');
        expect(result.stdout).toContain('examples:');
        expect(result.stdout).toMatchSnapshot('route.status.line --help');
      });
    });

    when(
      '[t1] the reader runs with --help behind the args rhx puts first',
      () => {
        // `rhx route.status.line --help` hands the skill its own --repo/--role/--skill ahead
        // of the human's args; the help must still answer, never a repaint
        const result = useThen('it runs', async () =>
          runReader({
            tempDir: scene.tempDir,
            args: [
              '--repo',
              'bhrain',
              '--role',
              'driver',
              '--skill',
              'route.status.line',
              '--help',
            ],
          }),
        );
        const resultBare = useThen('it runs bare', async () =>
          runReader({ tempDir: scene.tempDir, args: ['--help'] }),
        );

        then('it prints the same help as a bare --help, exit 0', () => {
          expect(result.status).toEqual(0);
          expect(result.stderr).toEqual('');
          expect(result.stdout).toContain('usage:');
          expect(result.stdout).toEqual(resultBare.stdout);
        });
      },
    );
  });

  given('[case9] a dir with no .git', () => {
    const scene = useBeforeAll(async () => ({
      tempDir: genTempDir({ slug: 'status-line-reader-no-git' }),
    }));

    when('[t0] the reader runs', () => {
      const result = useThen('it runs', async () => runReader(scene));

      then('it prints the blank line', () => {
        expect(result.status).toEqual(0);
        expect(result.stdout).toEqual('');
      });
    });
  });

  given('[case10] a worktree, whose .git is a gitdir pointer file', () => {
    const scene = useBeforeAll(async () => {
      const repo = await genBoundRouteRepo({
        slug: 'status-line-reader-worktree',
      });
      fs.renameSync(
        path.join(repo.tempDir, '.git'),
        path.join(repo.tempDir, '.gitstore'),
      );
      fs.writeFileSync(path.join(repo.tempDir, '.git'), 'gitdir: .gitstore\n');
      return repo;
    });

    when('[t0] the reader runs', () => {
      const result = useThen('it runs', async () => runReader(scene));

      then('it follows the pointer to HEAD and prints the line', () => {
        expect(result.stdout).toEqual('🗿 1.vision, yield 🌾\n');
      });
    });
  });

  given('[case11] a detached HEAD', () => {
    const scene = useBeforeAll(async () => {
      const repo = await genBoundRouteRepo({
        slug: 'status-line-reader-detached',
      });
      execSync('git checkout -q --detach', { cwd: repo.tempDir });
      return repo;
    });

    when('[t0] the reader runs', () => {
      const result = useThen('it runs', async () => runReader(scene));

      then('it prints the blank line, as unbound', () => {
        expect(result.stdout).toEqual('');
      });
    });
  });

  given('[case12] a line that holds a quote and a backslash', () => {
    const scene = useBeforeAll(async () => {
      const repo = await genBoundRouteRepo({
        slug: 'status-line-reader-escapes',
      });
      fs.writeFileSync(
        path.join(repo.stateDir, NAME_OF_ROUTE_STATUS_LINE_FILE),
        `${JSON.stringify({ route: repo.route, stone: 'a', phase: null, line: '🗿 a "q" \\b \\\\c' })}\n`,
      );
      return repo;
    });

    when('[t0] the reader runs', () => {
      const result = useThen('it runs', async () => runReader(scene));

      then('it unescapes the json back to the line', () => {
        expect(result.stdout).toEqual('🗿 a "q" \\b \\\\c\n');
        expect(asReaderSnap(result)).toMatchSnapshot();
      });
    });
  });

  given(
    '[case16] a second route bound by hand, then a drive, then an unbind',
    () => {
      const scene = useBeforeAll(async () => {
        const repo = await genBoundRouteRepo({
          slug: 'status-line-reader-drive-multi-bind',
        });

        // a second route holds this branch's flag too: a bind by hand, no writer ran
        const routeOther = path.join(repo.tempDir, 'my-route-other');
        fs.mkdirSync(path.join(routeOther, '.route'), { recursive: true });
        fs.writeFileSync(path.join(routeOther, '1.vision.stone'), '# vision');
        fs.writeFileSync(
          path.join(
            routeOther,
            '.route',
            `.bind.${sanitizeBranchName({ branch: repo.branch })}.flag`,
          ),
          `branch: ${repo.branch}\n`,
        );
        return repo;
      });

      when(
        '[t0] a route.drive runs the bind lookup, via the real drive',
        () => {
          const result = useThen('it runs', async () => {
            const error = await withinTempRepo(scene, () =>
              getError(stepRouteDrive({})),
            );
            return { error, reader: runReader(scene) };
          });

          then('the drive refuses: two routes bound to this branch', () => {
            expect(isRouteBindMultiBindFault({ error: result.error })).toEqual(
              true,
            );
          });

          then('the reader prints the multi-bind line, with its fix', () => {
            expect(result.reader.status).toEqual(0);
            expect(result.reader.stderr).toEqual('');
            expect(result.reader.stdout).toEqual(
              '🗿 two routes bound to this branch, rhx route.bind.get\n',
            );
            expect(asReaderSnap(result.reader)).toMatchSnapshot();
          });
        },
      );

      when('[t1] the branch is unbound, via the real unbind', () => {
        const result = useThen('it runs', async () => {
          await withinTempRepo(scene, () => delRouteBind());
          return runReader(scene);
        });

        then('the reader prints the blank line at once, as unbound', () => {
          expect(result.status).toEqual(0);
          expect(result.stderr).toEqual('');
          expect(result.stdout).toEqual('');
          expect({
            status: result.status,
            stdout: result.stdout,
            stderr: result.stderr,
          }).toMatchSnapshot();
        });
      });
    },
  );

  given('[case14] a guardless route that halts, then completes', () => {
    // every halt is a passage, so each reaches the line through the real writer
    const scene = useBeforeAll(async () =>
      genBoundRouteRepo({ slug: 'status-line-reader-halts' }),
    );

    /**
     * .what = sets a passage via the real writer, then runs the reader and the node render
     */
    const setPassageThenRead = async (input: {
      reports: PassageReport[];
    }): Promise<{
      stdout: string;
      stderr: string;
      status: number | null;
      rendered: string;
    }> => {
      await withinTempRepo(scene, async () => {
        for (const report of input.reports)
          await setPassageReport({ report, route: scene.route });
      });
      const rendered = await withinTempRepo(scene, () =>
        stepRouteStatusLine({ route: scene.route }),
      );
      return { ...runReader(scene), rendered: rendered.line };
    };

    when('[t0] the guard halts for human approval', () => {
      const result = useThen('it reads', async () =>
        setPassageThenRead({
          reports: [
            new PassageReport({
              stone: '1.vision',
              status: 'blocked',
              blocker: 'approval',
            }),
          ],
        }),
      );

      then('the line waves for a human, byte-equal to the node render', () => {
        expect(result.stdout).toEqual('🗿 1.vision, judge, approved? 👋\n');
        expect(result.stdout).toEqual(`${result.rendered}\n`);
        expect(asReaderSnap(result)).toMatchSnapshot();
      });
    });

    when('[t1] the driver marks a wall', () => {
      const result = useThen('it reads', async () =>
        setPassageThenRead({
          reports: [
            new PassageReport({ stone: '1.vision', status: 'blocked' }),
          ],
        }),
      );

      then(
        'the line shows the stop hand, byte-equal to the node render',
        () => {
          expect(result.stdout).toEqual('🗿 1.vision, yield, blocked ✋\n');
          expect(result.stdout).toEqual(`${result.rendered}\n`);
          expect(asReaderSnap(result)).toMatchSnapshot();
        },
      );
    });

    when('[t2] the last stone passes', () => {
      const result = useThen('it reads', async () =>
        setPassageThenRead({
          reports: [
            new PassageReport({ stone: '1.vision', status: 'passed' }),
            new PassageReport({ stone: '2.plan', status: 'passed' }),
          ],
        }),
      );

      then('the line reads complete, byte-equal to the node render', () => {
        expect(result.stdout).toEqual('🗿 route complete 🌴🤙\n');
        expect(result.stdout).toEqual(`${result.rendered}\n`);
        expect(asReaderSnap(result)).toMatchSnapshot();
      });
    });
  });

  given('[case15] a peer-guarded route whose reviewer malfunctions', () => {
    const scene = useBeforeAll(async () => {
      const repo = await genBoundRouteRepo({
        slug: 'status-line-reader-malfunction',
      });
      const routeDir = path.join(repo.tempDir, repo.route);
      fs.writeFileSync(
        path.join(routeDir, '1.vision.guard'),
        [
          'artifacts:',
          '  - "$route/1.vision*.md"',
          'reviews:',
          '  peer:',
          '    - slug: reviewer-a',
          '      run: echo test',
          '      budget: 3',
          '      level: 1',
          'judges: []',
        ].join('\n'),
      );
      fs.writeFileSync(
        path.join(repo.stateDir, 'reviewPeerMeters.jsonl'),
        `${JSON.stringify({ stone: '1.vision', reviewer: { slug: 'reviewer-a' }, rounds: 2 })}\n`,
      );
      return repo;
    });

    when('[t0] the guard records the malfunction', () => {
      const result = useThen('it reads', async () => {
        await withinTempRepo(scene, () =>
          setPassageReport({
            report: new PassageReport({
              stone: '1.vision',
              status: 'malfunction',
            }),
            route: scene.route,
          }),
        );
        const rendered = await withinTempRepo(scene, () =>
          stepRouteStatusLine({ route: scene.route }),
        );
        return { ...runReader(scene), rendered: rendered.line };
      });

      then(
        'the line shows the collision, byte-equal to the node render',
        () => {
          expect(result.stdout).toEqual(
            '🗿 1.vision, review.peer, l1@i002, malfunction 💥\n',
          );
          expect(result.stdout).toEqual(`${result.rendered}\n`);
          expect(asReaderSnap(result)).toMatchSnapshot();
        },
      );
    });
  });

  given(
    '[case13] a corpus of branch names, read by the bash twin of the flat-name rule',
    () => {
      const BRANCHES = [
        'feat/my-feature',
        'a//b',
        'x__y',
        '-lead',
        'trail.',
        'a.-_b',
        'UPPER/Case_9',
        'unicode/é-ñ',
        'emoji/🦉owl',
        'sp ace+plus@at',
        '..dots..',
        'deep/nest/ed/branch',
      ];
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'status-line-reader-parity' });
        fs.mkdirSync(path.join(tempDir, '.git'));
        const stateDir = path.join(tempDir, 'r', '.route');
        fs.mkdirSync(stateDir, { recursive: true });
        fs.writeFileSync(
          path.join(stateDir, NAME_OF_ROUTE_STATUS_LINE_FILE),
          `${JSON.stringify({ route: 'r', stone: null, phase: null, line: 'parity' })}\n`,
        );
        return { tempDir, stateDir };
      });

      BRANCHES.map((branch) =>
        when(`[t0] HEAD names "${branch}"`, () => {
          const result = useThen('it runs', async () => {
            // name the pointer and the flag by the ts rule, then let bash find them
            fs.writeFileSync(
              path.join(scene.tempDir, '.git', 'HEAD'),
              `ref: refs/heads/${branch}\n`,
            );
            const pointerPath = asRouteStatusLinePointerPath({
              cwd: scene.tempDir,
              branch,
            });
            fs.mkdirSync(path.dirname(pointerPath), { recursive: true });
            fs.writeFileSync(pointerPath, 'r\n');
            fs.writeFileSync(
              path.join(
                scene.stateDir,
                `.bind.${sanitizeBranchName({ branch })}.flag`,
              ),
              '',
            );
            setMtimeAhead({
              filePath: path.join(
                scene.stateDir,
                NAME_OF_ROUTE_STATUS_LINE_FILE,
              ),
            });
            return runReader({ tempDir: scene.tempDir });
          });

          then('the bash twin names the same file the ts rule named', () => {
            expect(result.stdout).toEqual('parity\n');
          });
        }),
      );
    },
  );
});
