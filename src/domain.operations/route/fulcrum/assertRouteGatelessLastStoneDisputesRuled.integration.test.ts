import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { genFulcrumEntryContent } from '../__test_assets__/genFulcrumEntryContent';
import { assertRouteGatelessLastStoneDisputesRuled } from './assertRouteGatelessLastStoneDisputesRuled';

/**
 * .what = a stone, with an `approved?` judge on its guard where it is human-gated
 */
const genStone = (input: {
  route: string;
  name: string;
  isHumanGated: boolean;
}): RouteStone =>
  new RouteStone({
    name: input.name,
    path: path.join(input.route, `${input.name}.stone`),
    guard: input.isHumanGated
      ? new RouteStoneGuard({
          path: path.join(input.route, `${input.name}.guard`),
          artifacts: [`${input.name}*.md`],
          reviews: { self: [], peer: [] },
          judges: [
            'rhx route.stone.judge --mechanism approved? --stone $stone --route $route',
          ],
          protect: [],
        })
      : null,
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

/**
 * .what = masks the temp route in a refusal, so its bytes snap stable across runs
 */
const asStableRefusal = (input: { message: string; route: string }): string =>
  input.message.split(input.route).join('<route>');

describe('assertRouteGatelessLastStoneDisputesRuled', () => {
  given(
    '[case1] a route whose only human gate sits on an earlier stone',
    () => {
      const route = genRouteWithOpenDispute({ slug: 'gateless-earlier-gate' });
      const stoneFirst = genStone({
        route,
        name: '1.vision',
        isHumanGated: true,
      });
      const stoneLast = genStone({
        route,
        name: '2.ship',
        isHumanGated: false,
      });
      const stones = [stoneFirst, stoneLast];

      when('[t0] the last stone passes while a dispute owes the human', () => {
        then(
          'it is refused — a gate the route already passed cannot show a later dispute',
          async () => {
            const error = await getError(
              assertRouteGatelessLastStoneDisputesRuled({
                route,
                stone: stoneLast,
                stones,
              }),
            );
            expect(error.message).toContain('the last stone has no human gate');
            expect(error.message).toContain(
              'rhx route.fulcrum.rule --case F44 --as upheld|conceded',
            );
            expect(
              asStableRefusal({ message: error.message, route }),
            ).toMatchSnapshot();
          },
        );
      });

      when('[t1] an earlier stone passes', () => {
        then('it proceeds — only the last stone is in scope', async () => {
          await assertRouteGatelessLastStoneDisputesRuled({
            route,
            stone: stoneFirst,
            stones,
          });
        });
      });
    },
  );

  given('[case2] a route whose last stone carries its own human gate', () => {
    const route = genRouteWithOpenDispute({ slug: 'gateless-last-gated' });
    const stoneLast = genStone({ route, name: '2.ship', isHumanGated: true });
    const stones = [
      genStone({ route, name: '1.vision', isHumanGated: false }),
      stoneLast,
    ];

    when('[t0] the last stone passes', () => {
      then(
        'it proceeds — its own approval refusal names the dispute',
        async () => {
          await assertRouteGatelessLastStoneDisputesRuled({
            route,
            stone: stoneLast,
            stones,
          });
        },
      );
    });
  });

  given('[case3] a gateless route with no open dispute', () => {
    const route = genTempDir({ slug: 'gateless-clear' });
    const stoneLast = genStone({ route, name: '1.ship', isHumanGated: false });

    when('[t0] the last stone passes', () => {
      then('it proceeds', async () => {
        await assertRouteGatelessLastStoneDisputesRuled({
          route,
          stone: stoneLast,
          stones: [stoneLast],
        });
      });
    });
  });
});
