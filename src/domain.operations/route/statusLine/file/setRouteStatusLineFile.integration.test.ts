import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { PassageReport } from '@src/domain.objects/Driver/PassageReport';
import { RouteStoneGuardReviewPeerMeter } from '@src/domain.objects/Driver/RouteStoneGuardReviewPeerMeter';
import { delRouteBind } from '@src/domain.operations/route/bind/delRouteBind';
import { setRouteStoneGuardReviewPeerMeter } from '@src/domain.operations/route/guard/review/peer/meter/setRouteStoneGuardReviewPeerMeter';
import { withStoneGenerationHold } from '@src/domain.operations/route/guard/round/withStoneGenerationHold';
import { setPassageReport } from '@src/domain.operations/route/passage/setPassageReport';
import { stepRouteStatusLine } from '@src/domain.operations/route/stepRouteStatusLine';
import { stepRouteStoneAdd } from '@src/domain.operations/route/stepRouteStoneAdd';
import { stepRouteStoneDel } from '@src/domain.operations/route/stepRouteStoneDel';
import { setStoneAsRewound } from '@src/domain.operations/route/stones/setStoneAsRewound';
import { sanitizeBranchName } from '@src/utils/git/sanitizeBranchName';

import { ATTEMPTS_OF_SETTLE } from './ATTEMPTS_OF_SETTLE';
import { asRouteStatusLineFilePath } from './asRouteStatusLineFilePath';
import { asRouteStatusLinePointerPath } from './asRouteStatusLinePointerPath';
import { MARK_OF_MULTI_BIND } from './MARK_OF_MULTI_BIND';
import { setRouteStatusLineFile } from './setRouteStatusLineFile';

/**
 * .what = integration tests for the status file writer
 * .why = the file must hold the render the node entry prints, the pointer must name only a
 *        route bound to this branch, a second bound route must read as a multi-bind, and a
 *        write fault must never refuse the move it follows
 *
 * .note = the writer reads paths relative to process.cwd(), as the cli does, so each act
 *         runs inside a chdir to the temp repo, restored after
 */

const BRANCH = 'feat/status-file';

/**
 * .what = runs a step inside a chdir to the temp repo
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
 * .what = a temp git repo on a feature branch with routes `r-a` and `r-b`, each one stone
 * .why = each case binds by hand the routes it needs, so the bind ops stay out of its way
 */
const genRepoOfRoutes = (input: { slug: string }): { tempDir: string } => {
  const tempDir = genTempDir({ slug: input.slug, git: true });
  execSync(`git checkout -q -b ${BRANCH}`, { cwd: tempDir });
  ['r-a', 'r-b'].map((route) => {
    fs.mkdirSync(path.join(tempDir, route, '.route'), { recursive: true });
    fs.writeFileSync(path.join(tempDir, route, '1.vision.stone'), '# vision');
  });
  return { tempDir };
};

/**
 * .what = binds a route to the branch by hand: its flag, and no more
 */
const setFlag = (input: { tempDir: string; route: string }): void =>
  fs.writeFileSync(
    path.join(
      input.tempDir,
      input.route,
      '.route',
      `.bind.${sanitizeBranchName({ branch: BRANCH })}.flag`,
    ),
    '',
  );

/**
 * .what = the pointer content, or null when absent
 */
const getPointer = (input: { tempDir: string }): string | null => {
  const pointerPath = asRouteStatusLinePointerPath({
    cwd: input.tempDir,
    branch: BRANCH,
  });
  return fs.existsSync(pointerPath)
    ? fs.readFileSync(pointerPath, 'utf-8')
    : null;
};

describe('setRouteStatusLineFile', () => {
  given('[case1] a route bound to this branch', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoOfRoutes({ slug: 'status-file-bound' });
      setFlag({ tempDir: repo.tempDir, route: 'r-a' });
      return repo;
    });

    when('[t0] the writer runs', () => {
      const written = useThen('it writes', async () =>
        withinTempRepo(scene, () =>
          setRouteStatusLineFile({ route: 'r-a', pointerAuthority: 'flag' }),
        ),
      );

      then('the file holds one line of compact json, `line` last', () => {
        const content = fs.readFileSync(
          asRouteStatusLineFilePath({ cwd: scene.tempDir, route: 'r-a' }),
          'utf-8',
        );
        expect(content).toEqual(
          '{"route":"r-a","stone":"1.vision","phase":"yield","line":"🗿 1.vision, yield 🌾"}\n',
        );
        expect(written.line).toEqual('🗿 1.vision, yield 🌾');
      });

      then('the pointer names the route', () => {
        expect(getPointer(scene)).toEqual('r-a\n');
      });
    });
  });

  given('[case2] a route not bound to this branch', () => {
    const scene = useBeforeAll(async () =>
      genRepoOfRoutes({ slug: 'status-file-unbound' }),
    );

    when('[t0] the writer runs', () => {
      useThen('it writes', async () =>
        withinTempRepo(scene, () =>
          setRouteStatusLineFile({ route: 'r-a', pointerAuthority: 'flag' }),
        ),
      );

      then('the status file is written beside the route', () => {
        expect(
          fs.existsSync(
            asRouteStatusLineFilePath({ cwd: scene.tempDir, route: 'r-a' }),
          ),
        ).toEqual(true);
      });

      then('no pointer is named: the branch is bound to no route', () => {
        expect(getPointer(scene)).toEqual(null);
      });
    });
  });

  given('[case3] two routes bound to this branch', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoOfRoutes({ slug: 'status-file-multi-bind' });
      setFlag({ tempDir: repo.tempDir, route: 'r-a' });
      setFlag({ tempDir: repo.tempDir, route: 'r-b' });
      return repo;
    });

    when('[t0] each route is written, one after the other', () => {
      useThen('they write', async () =>
        withinTempRepo(scene, async () => {
          await setRouteStatusLineFile({
            route: 'r-a',
            pointerAuthority: 'flag',
          });
          await setRouteStatusLineFile({
            route: 'r-b',
            pointerAuthority: 'flag',
          });
        }),
      );

      then('the pointer reads as a multi-bind', () => {
        expect(getPointer(scene)).toEqual(`${MARK_OF_MULTI_BIND}\n`);
      });
    });

    when('[t1] a third write, from a writer that knows only its flag', () => {
      useThen('it writes', async () =>
        withinTempRepo(scene, () =>
          setRouteStatusLineFile({ route: 'r-a', pointerAuthority: 'flag' }),
        ),
      );

      then('the mark stands: only a full bind lookup may clear it', () => {
        expect(getPointer(scene)).toEqual(`${MARK_OF_MULTI_BIND}\n`);
      });
    });

    when('[t2] the second flag is removed, and a drive runs the lookup', () => {
      useThen('it writes', async () => {
        fs.rmSync(
          path.join(
            scene.tempDir,
            'r-b',
            '.route',
            `.bind.${sanitizeBranchName({ branch: BRANCH })}.flag`,
          ),
        );
        return withinTempRepo(scene, () =>
          setRouteStatusLineFile({ route: 'r-a', pointerAuthority: 'lookup' }),
        );
      });

      then('the pointer names the one route again', () => {
        expect(getPointer(scene)).toEqual('r-a\n');
      });
    });
  });

  given('[case4] a status file path the writer cannot write', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoOfRoutes({ slug: 'status-file-fault' });
      setFlag({ tempDir: repo.tempDir, route: 'r-a' });

      // a non-empty dir where the file belongs: the rename over it faults
      const filePath = asRouteStatusLineFilePath({
        cwd: repo.tempDir,
        route: 'r-a',
      });
      fs.mkdirSync(filePath, { recursive: true });
      fs.writeFileSync(path.join(filePath, 'blocker'), '');
      return repo;
    });

    when('[t0] a passage is set', () => {
      const result = useThen('it sets', async () => {
        const errorsCaught: string[] = [];
        const consoleErrorOriginal = console.error;
        console.error = (...args: unknown[]) =>
          errorsCaught.push(args.join(' '));
        try {
          const set = await withinTempRepo(scene, () =>
            setPassageReport({
              report: new PassageReport({
                stone: '1.vision',
                status: 'passed',
              }),
              route: 'r-a',
            }),
          );
          return { set, errorsCaught };
        } finally {
          console.error = consoleErrorOriginal;
        }
      });

      then('the passage lands: a display cache never vetoes the move', () => {
        const passages = fs.readFileSync(
          path.join(scene.tempDir, result.set.path),
          'utf-8',
        );
        expect(passages).toContain('"status":"passed"');
      });

      then('one stderr row names the cause and the fix', () => {
        expect(result.errorsCaught).toHaveLength(1);
        expect(result.errorsCaught[0]).toMatch(
          /^\[route\.status\.line\] fault: status file write failed \(E[A-Z]+\) for r-a, the line reads stale, or unknown if never written, until the next write\. fix: repair the cause, then rhx route\.drive$/,
        );
      });
    });
  });

  given('[case5] a bound branch, then an unbind', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoOfRoutes({ slug: 'status-file-unbind' });
      setFlag({ tempDir: repo.tempDir, route: 'r-a' });
      await withinTempRepo(repo, () =>
        setRouteStatusLineFile({ route: 'r-a', pointerAuthority: 'lookup' }),
      );
      return repo;
    });

    when('[t0] the route is unbound', () => {
      useThen('it unbinds', async () =>
        withinTempRepo(scene, () => delRouteBind()),
      );

      then('the pointer is dropped', () => {
        expect(getPointer(scene)).toEqual(null);
      });
    });
  });

  given('[case6] a render input moves while the first render runs', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoOfRoutes({ slug: 'status-file-race-once' });
      setFlag({ tempDir: repo.tempDir, route: 'r-a' });
      return repo;
    });

    when(
      '[t0] a concurrent passage lands between the render and the rename',
      () => {
        const result = useThen('it writes', async () => {
          // the seam: the first render returns, then a peer writer's passage row lands
          const lines: string[] = [];
          const renderRoute: typeof stepRouteStatusLine = async (input) => {
            const rendered = await stepRouteStatusLine(input);
            lines.push(rendered.line);
            if (lines.length === 1)
              setPassageRowByHand({ ...scene, route: 'r-a' });
            return rendered;
          };
          const written = await withinTempRepo(scene, () =>
            setRouteStatusLineFile(
              { route: 'r-a', pointerAuthority: 'flag' },
              { renderRoute },
            ),
          );
          return { written, lines };
        });

        then(
          'CLAMP: it renders again, since the inputs moved under the render',
          () => {
            expect(result.lines).toHaveLength(2);
            expect(result.lines[1]).not.toEqual(result.lines[0]);
          },
        );

        then(
          'the file holds the newer render, never the one the passage outdated',
          () => {
            const content = fs.readFileSync(
              asRouteStatusLineFilePath({ cwd: scene.tempDir, route: 'r-a' }),
              'utf-8',
            );
            expect(content).toContain(JSON.stringify(result.lines[1]));
            expect(result.written.line).toEqual(result.lines[1]);
          },
        );

        then('the two lines match the snapshot', () => {
          expect(result.lines).toMatchSnapshot();
        });
      },
    );
  });

  given('[case7] a render input moves under every render', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoOfRoutes({ slug: 'status-file-race-always' });
      setFlag({ tempDir: repo.tempDir, route: 'r-a' });
      return repo;
    });

    when('[t0] each render is followed by a fresh passage row', () => {
      const result = useThen('it writes', async () => {
        const counter = { renders: 0 };
        const renderRoute: typeof stepRouteStatusLine = async (input) => {
          const rendered = await stepRouteStatusLine(input);
          counter.renders += 1;
          setPassageRowByHand({ ...scene, route: 'r-a' });
          return rendered;
        };
        await withinTempRepo(scene, () =>
          setRouteStatusLineFile(
            { route: 'r-a', pointerAuthority: 'flag' },
            { renderRoute },
          ),
        );
        return counter;
      });

      then(
        'CLAMP: it stops at the bound, so a busy route cannot loop it',
        () => {
          expect(result.renders).toEqual(ATTEMPTS_OF_SETTLE);
        },
      );
    });
  });

  given('[case8] the stone writers refresh the file as their last act', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoOfRoutes({ slug: 'status-file-writers' });
      setFlag({ tempDir: repo.tempDir, route: 'r-a' });
      await withinTempRepo(repo, () =>
        setRouteStatusLineFile({ route: 'r-a', pointerAuthority: 'lookup' }),
      );
      return repo;
    });

    when('[t0] a stone is added ahead of the current one', () => {
      useThen('it adds', async () =>
        withinTempRepo(scene, () =>
          stepRouteStoneAdd({
            stone: '0.seed',
            source: '@stdin',
            stdin: '# seed',
            route: 'r-a',
            mode: 'apply',
          }),
        ),
      );

      then('the file names the new stone', () => {
        expect(getStatusFile({ ...scene, route: 'r-a' }).stone).toEqual(
          '0.seed',
        );
      });
    });

    when('[t1] that stone is deleted', () => {
      useThen('it deletes', async () =>
        withinTempRepo(scene, () =>
          stepRouteStoneDel({
            stones: ['0.seed'],
            route: 'r-a',
            mode: 'apply',
          }),
        ),
      );

      then('the file names the prior stone again', () => {
        expect(getStatusFile({ ...scene, route: 'r-a' }).stone).toEqual(
          '1.vision',
        );
      });
    });

    when(
      '[t2] a peer meter is written, with the status file removed first',
      () => {
        const result = useThen('it meters', async () => {
          fs.rmSync(
            asRouteStatusLineFilePath({ cwd: scene.tempDir, route: 'r-a' }),
          );
          return withinTempRepo(scene, async () => {
            await setRouteStoneGuardReviewPeerMeter({
              meter: new RouteStoneGuardReviewPeerMeter({
                stone: '1.vision',
                reviewer: { slug: 'peer' },
                rounds: 1,
              }),
              route: 'r-a',
            });
            return { rendered: await stepRouteStatusLine({ route: 'r-a' }) };
          });
        });

        then(
          'the meter write wrote the file anew, equal to a fresh render',
          () => {
            const written = getStatusFile({ ...scene, route: 'r-a' });
            expect(written.stone).toEqual('1.vision');
            expect(written.line).toEqual(result.rendered.line);
          },
        );
      },
    );
  });

  given('[case9] a passage written under a stone generation hold', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoOfRoutes({ slug: 'status-file-hold' });
      setFlag({ tempDir: repo.tempDir, route: 'r-a' });
      await withinTempRepo(repo, () =>
        setRouteStatusLineFile({ route: 'r-a', pointerAuthority: 'lookup' }),
      );
      return repo;
    });

    when('[t0] the passage lands inside the hold', () => {
      const result = useThen('it writes', async () =>
        withinTempRepo(scene, async () => {
          const lineBefore = getStatusFile({ ...scene, route: 'r-a' }).line;
          const lineInsideHold = await withStoneGenerationHold({
            route: 'r-a',
            stone: '1.vision',
            logic: async () => {
              await setPassageReport({
                report: new PassageReport({
                  stone: '1.vision',
                  status: 'passed',
                }),
                route: 'r-a',
              });
              return getStatusFile({ ...scene, route: 'r-a' }).line;
            },
          });
          const lineAfterHold = getStatusFile({ ...scene, route: 'r-a' }).line;
          const rendered = await stepRouteStatusLine({ route: 'r-a' });
          return { lineBefore, lineInsideHold, lineAfterHold, rendered };
        }),
      );

      then('the hold spans no render: the file is unchanged inside it', () => {
        expect(result.lineInsideHold).toEqual(result.lineBefore);
      });

      then('the render lands once the hold releases', () => {
        expect(result.lineAfterHold).not.toEqual(result.lineBefore);
        expect(result.lineAfterHold).toEqual(result.rendered.line);
      });
    });
  });

  given('[case10] a stone rewound with a promise and no meters', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoOfRoutes({ slug: 'status-file-rewind' });
      setFlag({ tempDir: repo.tempDir, route: 'r-a' });
      const routeDir = path.join(repo.tempDir, 'r-a');
      fs.writeFileSync(
        path.join(routeDir, '1.vision.guard'),
        [
          'artifacts:',
          '  - "$route/1.vision*.md"',
          'reviews:',
          '  self:',
          '    - slug: slug-a',
          '      say: review a',
          '    - slug: slug-b',
          '      say: review b',
          'judges: []',
        ].join('\n'),
      );
      fs.writeFileSync(
        path.join(routeDir, '.route', '1.vision.guard.promise.slug-a.md'),
        '# promised',
      );
      fs.writeFileSync(
        path.join(routeDir, '.route', 'passage.jsonl'),
        `${JSON.stringify({ stone: '1.vision', status: 'blocked', blocker: 'review.self' })}\n`,
      );
      await withinTempRepo(repo, () =>
        setRouteStatusLineFile({ route: 'r-a', pointerAuthority: 'lookup' }),
      );
      return repo;
    });

    when('[t0] the stone is rewound', () => {
      const result = useThen('it rewinds', async () =>
        withinTempRepo(scene, async () => {
          const lineBefore = getStatusFile({ ...scene, route: 'r-a' }).line;
          await setStoneAsRewound(
            { stone: '1.vision', route: 'r-a' },
            { cliEmit: { onGuardProgress: () => {} } },
          );
          const rendered = await stepRouteStatusLine({ route: 'r-a' });
          return {
            lineBefore,
            lineAfter: getStatusFile({ ...scene, route: 'r-a' }).line,
            rendered,
          };
        }),
      );

      then('the file holds the render taken after the deletes landed', () => {
        expect(result.lineAfter).toEqual(result.rendered.line);
        expect(result.lineAfter).not.toEqual(result.lineBefore);
        expect({
          lineBefore: result.lineBefore,
          lineAfter: result.lineAfter,
        }).toMatchSnapshot();
      });
    });
  });

  given('[case11] a route whose passage ledger holds a corrupt row', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoOfRoutes({ slug: 'status-file-corrupt-ledger' });
      setFlag({ tempDir: repo.tempDir, route: 'r-a' });
      fs.writeFileSync(
        path.join(repo.tempDir, 'r-a', '.route', 'passage.jsonl'),
        '{"stone":"1.vision","sta\n',
      );
      return repo;
    });

    when('[t0] a passage and a stone add land on it', () => {
      const result = useThen('they run', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation();
        try {
          await withinTempRepo(scene, async () => {
            await setPassageReport({
              report: new PassageReport({
                stone: '1.vision',
                status: 'passed',
              }),
              route: 'r-a',
            });
            await stepRouteStoneAdd({
              stone: '2.plan',
              source: '@stdin',
              stdin: '# plan',
              route: 'r-a',
              mode: 'apply',
            });
          });
          return {
            rows: errorSpy.mock.calls.map((call) => String(call[0])),
          };
        } finally {
          errorSpy.mockRestore();
        }
      });

      then('both moves land: the render fault never refuses them', () => {
        expect(
          fs.existsSync(path.join(scene.tempDir, 'r-a', '2.plan.stone')),
        ).toEqual(true);
        expect(
          fs
            .readFileSync(
              path.join(scene.tempDir, 'r-a', '.route', 'passage.jsonl'),
              'utf-8',
            )
            .split('\n')
            .filter((row) => row.length > 0),
        ).toHaveLength(2);
      });

      then('each move warns once on stderr, with the fix', () => {
        expect(result.rows).toHaveLength(2);
        expect(result.rows).toMatchSnapshot();
      });
    });
  });

  given('[case12] a route whose meter ledger holds a corrupt row', () => {
    const scene = useBeforeAll(async () => {
      const repo = genRepoOfRoutes({ slug: 'status-file-degrade' });
      setFlag({ tempDir: repo.tempDir, route: 'r-a' });
      fs.writeFileSync(
        path.join(repo.tempDir, 'r-a', '1.vision.guard'),
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

      // a corrupt meter row faults the phase read, never the stone lookup
      fs.writeFileSync(
        path.join(repo.tempDir, 'r-a', '.route', 'reviewPeerMeters.jsonl'),
        '{ this is not valid json\n',
      );
      return repo;
    });

    when('[t0] the status file is written', () => {
      const result = useThen('it writes', async () => {
        const errorSpy = jest.spyOn(console, 'error').mockImplementation();
        try {
          await withinTempRepo(scene, () =>
            setRouteStatusLineFile({ route: 'r-a', pointerAuthority: 'flag' }),
          );
          return {
            rows: errorSpy.mock.calls.map((call) => String(call[0])),
          };
        } finally {
          errorSpy.mockRestore();
        }
      });

      then('the line degrades to the plain stone', () => {
        expect(getStatusFile({ ...scene, route: 'r-a' }).line).toEqual(
          '🗿 1.vision',
        );
      });

      then('the degrade row names the cause once on stderr', () => {
        expect(result.rows).toHaveLength(1);
        expect(result.rows[0]).toContain(
          'phase derivation faulted for stone "1.vision"',
        );
        expect(result.rows[0]).toContain('SyntaxError');
      });
    });
  });
});

/**
 * .what = appends one passage row by hand, as a concurrent writer would, with no status write
 * .why = the race cases need an input that moves with no second writer of the status file
 */
const setPassageRowByHand = (input: { tempDir: string; route: string }): void =>
  fs.appendFileSync(
    path.join(input.tempDir, input.route, '.route', 'passage.jsonl'),
    `${JSON.stringify({ stone: '1.vision', status: 'passed' })}\n`,
  );

/**
 * .what = the status file a route holds, parsed
 */
const getStatusFile = (input: {
  tempDir: string;
  route: string;
}): { stone: string; line: string } =>
  JSON.parse(
    fs.readFileSync(
      asRouteStatusLineFilePath({ cwd: input.tempDir, route: input.route }),
      'utf-8',
    ),
  );
