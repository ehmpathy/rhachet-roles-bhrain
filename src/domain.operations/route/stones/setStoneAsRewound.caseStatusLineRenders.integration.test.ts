import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { sanitizeBranchName } from '@src/utils/git/sanitizeBranchName';

import { setStoneAsRewound } from './setStoneAsRewound';

/**
 * .what = the routes each status line render was asked for, in call order
 * .why = the count is the claim under test: one compound move, one render. the name carries
 *        the `mock` prefix so the hoisted jest.mock factory below may reference it
 */
const mockRendersOfRoute: string[] = [];

/**
 * .mock = the status line render, wrapped around its real implementation
 * .why = a render leaves no trace a test can count from outside: two renders of one route
 *        write the same bytes. the wrapper records each call, then calls the REAL render on
 *        the REAL route, so every write is the real one and only the count is observed
 * .real = setRouteStatusLineFile.integration.test.ts [case10] runs the same rewind with no
 *         wrapper, and checks the file it leaves
 */
jest.mock('@src/domain.operations/route/stepRouteStatusLine', () => {
  const actual = jest.requireActual(
    '@src/domain.operations/route/stepRouteStatusLine',
  );
  return {
    stepRouteStatusLine: async (input: { route: string }) => {
      mockRendersOfRoute.push(input.route);
      return actual.stepRouteStatusLine(input);
    },
  };
});

const BRANCH = 'feat/rewind-renders';

/**
 * .what = runs a step inside a chdir to the temp repo, as the cli runs
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
 * .what = clamps that a rewind which cascades over several stones costs one status line
 *         render, never one per ledger row it writes
 * .why = each generation bump, meter reset row, and passage row a rewind writes asks for a
 *        refresh; unheld, a cascade of N stones with M meters rendered about N + M + N + 1
 *        times, where one render shows the state it leaves (rule.require.clamp-edge-cases)
 */
describe('setStoneAsRewound.caseStatusLineRenders', () => {
  given(
    '[case1] a bound route with three passed stones, two meters each',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = genTempDir({ slug: 'rewind-renders', git: true });
        execSync(`git checkout -q -b ${BRANCH}`, { cwd: tempDir });
        const route = 'r-a';
        const routeDir = path.join(tempDir, route);
        fs.mkdirSync(path.join(routeDir, '.route'), { recursive: true });
        const stones = ['1.vision', '2.criteria', '3.plan'];
        for (const stone of stones)
          fs.writeFileSync(path.join(routeDir, `${stone}.stone`), `# ${stone}`);
        fs.writeFileSync(
          path.join(routeDir, '.route', 'passage.jsonl'),
          stones
            .map((stone) => `${JSON.stringify({ stone, status: 'passed' })}\n`)
            .join(''),
        );
        // two peer meters per stone: the rewind resets each, one ledger row apiece
        fs.writeFileSync(
          path.join(routeDir, '.route', 'reviewPeerMeters.jsonl'),
          stones
            .flatMap((stone) =>
              ['reviewer-a', 'reviewer-b'].map(
                (slug) =>
                  `${JSON.stringify({ stone, reviewer: { slug }, rounds: 2 })}\n`,
              ),
            )
            .join(''),
        );
        fs.writeFileSync(
          path.join(
            routeDir,
            '.route',
            `.bind.${sanitizeBranchName({ branch: BRANCH })}.flag`,
          ),
          `branch: ${BRANCH}\n`,
        );
        return { tempDir, route };
      });

      when(
        '[t0] the first stone is rewound, which cascades to all three',
        () => {
          const result = useThen('it rewinds', async () =>
            withinTempRepo(scene, async () => {
              mockRendersOfRoute.length = 0;
              const rewound = await setStoneAsRewound(
                { stone: '1.vision', route: scene.route },
                { cliEmit: { onGuardProgress: () => {} } },
              );
              return { rewound, renders: [...mockRendersOfRoute] };
            }),
          );

          then('all three stones were rewound', () => {
            expect(result.rewound.affectedStones).toHaveLength(3);
          });

          then('each of the six meters was reset, one row apiece', () => {
            const rows = fs
              .readFileSync(
                path.join(
                  scene.tempDir,
                  scene.route,
                  '.route',
                  'reviewPeerMeters.jsonl',
                ),
                'utf-8',
              )
              .split('\n')
              .filter((row) => row.length > 0);
            expect(rows).toHaveLength(12);
          });

          then('the whole cascade cost one render', () => {
            expect(result.renders).toEqual([scene.route]);
          });
        },
      );
    },
  );
});
