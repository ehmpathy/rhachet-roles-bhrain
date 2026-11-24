import { given, then, when } from 'test-fns';

import configAcceptance from '../../jest.acceptance.config';
import configIntegration from '../../jest.integration.config';
import configUnit from '../../jest.unit.config';
import packageJson from '../../package.json';

/**
 * .what = clamps that each jest config carries every behavior this repo owes, through the repo
 *         seam (`jest.repo.ts`)
 * .why = the configs are practice-owned exact files (declapract-typescript-ehmpathy). a
 *        `declapract apply` rewrites them and drops the seam with no check red; this clamp is
 *        that check. jest judges snapshot obsolescence over every `.snap` its haste map holds,
 *        and an obsolete snapshot fails the run while every test passes, so the scratch cuts
 *        matter as much as the live-suite setup
 */
const ROOT = '/repo';

/**
 * .what = whether a set of path patterns cut a path
 * .why = jest substitutes `<rootDir>` and tests each pattern as a regex against the full path
 */
const isPathCut = (input: {
  patterns: string[] | undefined;
  path: string;
}): boolean =>
  (input.patterns ?? []).some((pattern) =>
    new RegExp(pattern.replace('<rootDir>', ROOT)).test(input.path),
  );

const CONFIGS = [
  { name: 'unit', config: configUnit },
  { name: 'integration', config: configIntegration },
  { name: 'acceptance', config: configAcceptance },
];

describe('jest repo seam', () => {
  CONFIGS.map(({ name, config }) =>
    given(`[case1] the ${name} config`, () => {
      when('[t0] a stray snapshot sits in a scratch dir', () => {
        then('a snapshot in the rmsafe trash is cut from the haste map', () => {
          expect(
            isPathCut({
              patterns: config.modulePathIgnorePatterns,
              path: `${ROOT}/.agent/.cache/repo=ehmpathy/role=mechanic/skill=rmsafe/trash/src/__snapshots__/x.test.ts.snap`,
            }),
          ).toEqual(true);
        });

        then('a snapshot in `.log/` is cut from the haste map', () => {
          expect(
            isPathCut({
              patterns: config.modulePathIgnorePatterns,
              path: `${ROOT}/.log/baseline/__snapshots__/x.test.ts.snap`,
            }),
          ).toEqual(true);
        });

        then('code a route archived is cut from the haste map', () => {
          expect(
            isPathCut({
              patterns: config.modulePathIgnorePatterns,
              path: `${ROOT}/.behavior/v2026_01_01.x/archive/src/x.test.ts`,
            }),
          ).toEqual(true);
        });

        then('a `.scratch/` draft is cut from the haste map', () => {
          expect(
            isPathCut({
              patterns: config.modulePathIgnorePatterns,
              path: `${ROOT}/src/domain.roles/thinker/.scratch/x.integration.test.ts`,
            }),
          ).toEqual(true);
        });

        then('a real snapshot beside its test stays in the haste map', () => {
          expect(
            isPathCut({
              patterns: config.modulePathIgnorePatterns,
              path: `${ROOT}/src/domain.operations/__snapshots__/x.test.ts.snap`,
            }),
          ).toEqual(false);
        });
      });

      when('[t1] a module ships as esm', () => {
        then('`.mjs` is transformed', () => {
          expect(config.moduleFileExtensions).toContain('mjs');
          expect(Object.keys(config.transform ?? {})).toContain('^.+\\.mjs$');
        });
      });
    }),
  );

  given('[case2] the unit config', () => {
    then('each test holds a 30s budget', () => {
      expect(configUnit.testTimeout).toEqual(30_000);
    });
  });

  given('[case3] the integration config', () => {
    const skillSuite = `${ROOT}/.agent/repo=.this/role=any/skills/x.integration.test.ts`;
    const linkedSuite = `${ROOT}/.agent/repo=ehmpathy/role=mechanic/skills/x.integration.test.ts`;

    then('the repo skill dir is not pruned by the haste crawler', () => {
      expect(
        isPathCut({
          patterns: configIntegration.modulePathIgnorePatterns,
          path: `${ROOT}/.agent/repo=.this`,
        }),
      ).toEqual(false);
    });

    then('a repo skill suite stays in the haste map and the run', () => {
      expect(
        isPathCut({
          patterns: configIntegration.modulePathIgnorePatterns,
          path: skillSuite,
        }),
      ).toEqual(false);
      expect(
        isPathCut({
          patterns: configIntegration.testPathIgnorePatterns,
          path: skillSuite,
        }),
      ).toEqual(false);
    });

    then('a linked role suite stays cut', () => {
      expect(
        isPathCut({
          patterns: configIntegration.testPathIgnorePatterns,
          path: linkedSuite,
        }),
      ).toEqual(true);
    });
  });

  given('[case5] the acceptance run', () => {
    then('a pool of workers runs the files, not one band', () => {
      expect(configAcceptance.maxWorkers).toEqual(
        Number(process.env.ACCEPTANCE_WORKERS ?? 7),
      );
      const scripts = packageJson.scripts as Record<string, string>;
      expect(scripts['test:acceptance']).not.toContain('--runInBand');
      expect(scripts['test:acceptance:locally']).not.toContain('--runInBand');
    });
  });

  [
    { name: 'integration', config: configIntegration },
    { name: 'acceptance', config: configAcceptance },
  ].map(({ name, config }) =>
    given(`[case4] the ${name} config`, () => {
      then('the repo env runs after the practice env', () => {
        expect(config.setupFilesAfterEnv?.at(-1)).toEqual('./jest.repo.env.ts');
      });

      then('the repo prepare runs once per run, the practice prepare within it', () => {
        expect(config.globalSetup).toEqual('./jest.repo.prepare.ts');
        expect(config.globals?.jestRepoPrepare).toEqual({
          suite: name,
          practice: `./jest.${name}.prepare.ts`,
        });
      });
    }),
  );
});
