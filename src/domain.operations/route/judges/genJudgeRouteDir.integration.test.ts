import * as fs from 'fs';
import * as path from 'path';
import { genTempDir, given, then, useThen, when } from 'test-fns';

import { genJudgeRouteDir } from './genJudgeRouteDir';

describe('genJudgeRouteDir', () => {
  given('[case1] a route with no .route dir', () => {
    const route = genTempDir({ slug: 'gen-judge-route-dir' });

    when('[t0] it is called', () => {
      const result = useThen('it returns the dir', async () =>
        genJudgeRouteDir({ route }),
      );

      then('the dir sits at .route under the route', () => {
        expect(result.path).toEqual(path.join(route, '.route'));
      });

      then('the dir now exists on disk', () => {
        expect(fs.statSync(result.path).isDirectory()).toBe(true);
      });
    });
  });

  given('[case2] a .route dir that already holds a judge artifact', () => {
    const route = genTempDir({ slug: 'gen-judge-route-dir-kept' });
    const dir = path.join(route, '.route');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'prior.md'), 'passed: true\n');

    when('[t0] it is called', () => {
      then(
        'it converges with no EEXIST, and the prior artifact survives',
        async () => {
          const result = await genJudgeRouteDir({ route });
          expect(result.path).toEqual(dir);
          expect(fs.readFileSync(path.join(dir, 'prior.md'), 'utf-8')).toEqual(
            'passed: true\n',
          );
        },
      );
    });
  });
});
