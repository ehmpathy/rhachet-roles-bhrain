import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { genFulcrumEntryContent } from '../__test_assets__/genFulcrumEntryContent';
import { getAllPassageReportsRaw } from '../passage/getAllPassageReportsRaw';
import { setStonePassage } from './setStonePassage';

/**
 * .what = a stone whose guard declares only artifacts, or an `approved?` judge where human-gated
 * .why = the artifacts-only guard is the passage branch no dispute clamp reached before the
 *        gate moved into this writer; it is the shape a revert would have slipped through
 */
const genStone = (input: {
  route: string;
  name: string;
  isHumanGated: boolean;
}): RouteStone =>
  new RouteStone({
    name: input.name,
    path: path.join(input.route, `${input.name}.stone`),
    guard: new RouteStoneGuard({
      path: path.join(input.route, `${input.name}.guard`),
      artifacts: [`${input.name}*.md`],
      reviews: { self: [], peer: [] },
      judges: input.isHumanGated
        ? [
            'rhx route.stone.judge --mechanism approved? --stone $stone --route $route',
          ]
        : [],
      protect: [],
    }),
  });

/**
 * .what = a temp route with one open human-owed dispute, F44
 */
const genRouteWithOpenDispute = (input: { slug: string }): string => {
  const route = genTempDir({ slug: input.slug });
  fs.mkdirSync(path.join(route, '.fulcrums'), { recursive: true });
  fs.writeFileSync(
    path.join(
      route,
      '.fulcrums',
      'inventory.of=fulcrums.case=F44-rename-table.md',
    ),
    genFulcrumEntryContent({ case: 'F44', confidence: 0.7 }),
  );
  return route;
};

describe('setStonePassage', () => {
  given('[case1] a route with an open human-owed dispute', () => {
    when(
      '[t0] the last stone, whose guard declares only artifacts, is passed',
      () => {
        const result = useThen('it is refused', async () => {
          const route = genRouteWithOpenDispute({ slug: 'passage-gateless' });
          const stoneFirst = genStone({
            route,
            name: '1.vision',
            isHumanGated: false,
          });
          const stoneLast = genStone({
            route,
            name: '2.execution',
            isHumanGated: false,
          });
          const error = await getError(
            setStonePassage({
              stone: stoneLast,
              stones: [stoneFirst, stoneLast],
              route,
            }),
          );
          const reports = await getAllPassageReportsRaw({ route });
          return { error, reports };
        });

        then(
          '🔴 the one writer of a pass refuses it, and names the dispute',
          () => {
            expect(result.error.message).toContain(
              'the last stone has no human gate',
            );
            expect(result.error.message).toContain('F44');
          },
        );

        then('no passed row is written', () => {
          expect(
            result.reports.filter((report) => report.status === 'passed'),
          ).toEqual([]);
        });
      },
    );

    // .note = a human-gated stone halts at its `approved?` judge, not here: the approval reader
    //         holds a later dispute's approval out of force (getOneStoneGuardApproval clamp)
    when('[t2] an ungated stone that is not last is passed', () => {
      then('it passes: a dispute never halts an ungated stone', async () => {
        const route = genRouteWithOpenDispute({ slug: 'passage-ungated' });
        const stoneFirst = genStone({
          route,
          name: '1.vision',
          isHumanGated: false,
        });
        const stoneLast = genStone({
          route,
          name: '2.execution',
          isHumanGated: false,
        });
        await setStonePassage({
          stone: stoneFirst,
          stones: [stoneFirst, stoneLast],
          route,
        });
        const reports = await getAllPassageReportsRaw({ route });
        expect(reports.map((report) => report.status)).toEqual(['passed']);
      });
    });
  });
});
