import * as path from 'path';
import { given, then, when } from 'test-fns';

import { parseStoneGuard } from './parseStoneGuard';

const ASSETS_DIR = path.join(__dirname, '../.test/assets');

describe('parseStoneGuard', () => {
  given('[case1] a guard file with artifacts and judges', () => {
    const guardPath = path.join(ASSETS_DIR, 'route.guarded', '1.vision.guard');

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with artifacts and judges', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.path).toEqual(guardPath);
        expect(result.artifacts).toContain('1.vision*.md');
        expect(result.reviews).toHaveLength(0);
        expect(result.judges).toHaveLength(1);
      });
    });
  });

  given('[case2] a guard file with reviews and judges', () => {
    const guardPath = path.join(
      ASSETS_DIR,
      'route.guarded',
      '5.implement.guard',
    );

    when('[t0] guard is parsed', () => {
      then('returns RouteStoneGuard with reviews and judges', async () => {
        const result = await parseStoneGuard({ path: guardPath });
        expect(result.path).toEqual(guardPath);
        expect(result.artifacts).toContain('src/**/*.ts');
        expect(result.reviews).toHaveLength(1);
        expect(result.judges).toHaveLength(2);
      });
    });
  });
});
