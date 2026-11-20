import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, getError, given, then, when } from 'test-fns';

import { assertFulcrumPathOnRoute } from './assertFulcrumPathOnRoute';

const NAME_F3 = 'inventory.of=fulcrums.case=F3-demo.md';

describe('assertFulcrumPathOnRoute', () => {
  given('[case1] a repo with two routes, each with its own F3', () => {
    const repoRoot = genTempDir({ slug: 'fulcrum-on-route' });
    const routeThis = '.behavior/v2026_11_18.this';
    const routeOther = '.behavior/v2026_10_01.other';
    [routeThis, routeOther].map((route) => {
      fs.mkdirSync(path.join(repoRoot, route, '.fulcrums'), {
        recursive: true,
      });
      fs.writeFileSync(path.join(repoRoot, route, '.fulcrums', NAME_F3), 'x');
    });

    when('[t0] the dispute cites this route own F3', () => {
      then('it is accepted', () => {
        assertFulcrumPathOnRoute({
          pathResolved: path.join(repoRoot, routeThis, '.fulcrums', NAME_F3),
          route: routeThis,
          repoRoot,
        });
      });
    });

    // r011 i007 blocker.1: the gate reads by case id from this route, so another route's F3
    // would bind the dispute to this route's unrelated F3
    when('[t1] the dispute cites the other route F3', () => {
      then('🔴 it is refused, and names the fix', async () => {
        const error = await getError(() =>
          assertFulcrumPathOnRoute({
            pathResolved: path.join(repoRoot, routeOther, '.fulcrums', NAME_F3),
            route: routeThis,
            repoRoot,
          }),
        );
        expect(error.message).toContain(
          "--why must name a fulcrum in this route's own .fulcrums/",
        );
        expect(error.message).toContain('--why .fulcrums/');
      });
    });

    when('[t2] the dispute cites a file outside any .fulcrums/', () => {
      then('🔴 it is refused', async () => {
        fs.writeFileSync(path.join(repoRoot, routeThis, NAME_F3), 'x');
        const error = await getError(() =>
          assertFulcrumPathOnRoute({
            pathResolved: path.join(repoRoot, routeThis, NAME_F3),
            route: routeThis,
            repoRoot,
          }),
        );
        expect(error.message).toContain('this route');
      });
    });
  });
});
