import { given, then, when } from 'test-fns';

import configIntegration from '../../jest.integration.config';
import configUnit from '../../jest.unit.config';

/**
 * .what = clamps that the unit and integration jest configs cut gitignored scratch dirs out of
 *         the haste map
 * .why = jest judges snapshot obsolescence over every `.snap` its haste map holds, and an
 *        obsolete snapshot fails the run while every test passes — `0 failed`, exit 2, and no
 *        cause in the summary. `.log/` is this repo's scratch dir and `.agent/.cache/` holds the
 *        rmsafe trash, so a `.snap` parked in either must never reach the map
 */
const ROOT = '/repo';

/**
 * .what = whether a config's modulePathIgnorePatterns cut a path out of the haste map
 * .why = jest substitutes `<rootDir>` and tests each pattern as a regex against the full path
 */
const isPathCutFromHasteMap = (input: {
  patterns: string[] | undefined;
  path: string;
}): boolean =>
  (input.patterns ?? []).some((pattern) =>
    new RegExp(pattern.replace('<rootDir>', ROOT)).test(input.path),
  );

const CONFIGS = [
  { name: 'unit', config: configUnit },
  { name: 'integration', config: configIntegration },
];

describe('jest scratch exclusion', () => {
  CONFIGS.map(({ name, config }) =>
    given(`[case1] the ${name} config`, () => {
      when('[t0] a stray snapshot sits in a scratch dir', () => {
        then('a snapshot parked in .log/ is cut from the haste map', () => {
          expect(
            isPathCutFromHasteMap({
              patterns: config.modulePathIgnorePatterns,
              path: `${ROOT}/.log/tmp-main-guard-peer.snap`,
            }),
          ).toEqual(true);
        });

        then('a snapshot in the rmsafe trash is cut from the haste map', () => {
          expect(
            isPathCutFromHasteMap({
              patterns: config.modulePathIgnorePatterns,
              path: `${ROOT}/.agent/.cache/repo=ehmpathy/role=mechanic/skill=rmsafe/trash/src/__snapshots__/x.test.ts.snap`,
            }),
          ).toEqual(true);
        });

        then('a real snapshot beside its test stays in the haste map', () => {
          expect(
            isPathCutFromHasteMap({
              patterns: config.modulePathIgnorePatterns,
              path: `${ROOT}/src/domain.operations/__snapshots__/x.test.ts.snap`,
            }),
          ).toEqual(false);
        });
      });
    }),
  );
});
