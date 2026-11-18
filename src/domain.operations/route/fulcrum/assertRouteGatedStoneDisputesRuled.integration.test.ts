import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { RouteStoneGuard } from '@src/domain.objects/Driver/RouteStoneGuard';

import { genFulcrumEntryContent } from '../__test_assets__/genFulcrumEntryContent';
import { assertRouteGatedStoneDisputesRuled } from './assertRouteGatedStoneDisputesRuled';

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

describe('assertRouteGatedStoneDisputesRuled', () => {
  given(
    '[case1] a human-gated stone, approved before a dispute was raised',
    () => {
      const route = genRouteWithOpenDispute({ slug: 'gated-post-approval' });
      const stone = genStone({ route, name: '1.vision', isHumanGated: true });

      when('[t0] the stone passes while the dispute owes the human', () => {
        then(
          '🔴 it is refused — the gate the human opened does not wave a later dispute through',
          async () => {
            const error = await getError(
              assertRouteGatedStoneDisputesRuled({ route, stone }),
            );
            expect(error.message).toContain(
              "a dispute owes the human at this stone's gate",
            );
            expect(error.message).toContain(
              'rhx route.fulcrum.rule --case F44 --as upheld|conceded',
            );
            expect(
              asStableRefusal({ message: error.message, route }),
            ).toMatchSnapshot();
          },
        );
      });
    },
  );

  given('[case2] an ungated stone with an open dispute', () => {
    const route = genRouteWithOpenDispute({ slug: 'gated-ungated' });
    const stone = genStone({ route, name: '1.vision', isHumanGated: false });

    when('[t0] the stone passes', () => {
      then('it proceeds — a dispute never halts an ungated stone', async () => {
        await assertRouteGatedStoneDisputesRuled({ route, stone });
      });
    });
  });

  given('[case3] a human-gated stone with no open dispute', () => {
    const route = genTempDir({ slug: 'gated-clear' });
    const stone = genStone({ route, name: '1.vision', isHumanGated: true });

    when('[t0] the stone passes', () => {
      then('it proceeds', async () => {
        await assertRouteGatedStoneDisputesRuled({ route, stone });
      });
    });
  });
});
