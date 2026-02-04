import * as path from 'path';
import { given, then, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';

import { getOneStoneGuardApproval } from './getOneStoneGuardApproval';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

describe('getOneStoneGuardApproval', () => {
  given('[case1] stone in route.approved with approval marker', () => {
    const routePath = path.join(ASSETS_DIR, 'route.approved');
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(routePath, '1.vision.stone'),
      guard: null,
    });

    when('[t0] approval is checked', () => {
      then('returns approval artifact', async () => {
        const approval = await getOneStoneGuardApproval({
          stone,
          route: routePath,
        });
        expect(approval).not.toBeNull();
        expect(approval?.path).toContain('1.vision.approved');
      });
    });
  });

  given('[case2] stone in route.simple without approval marker', () => {
    const routePath = path.join(ASSETS_DIR, 'route.simple');
    const stone = new RouteStone({
      name: '1.vision',
      path: path.join(routePath, '1.vision.stone'),
      guard: null,
    });

    when('[t0] approval is checked', () => {
      then('returns null', async () => {
        const approval = await getOneStoneGuardApproval({
          stone,
          route: routePath,
        });
        expect(approval).toBeNull();
      });
    });
  });
});
