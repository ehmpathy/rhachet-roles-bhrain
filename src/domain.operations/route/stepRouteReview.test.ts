import * as path from 'path';
import { given, then, when } from 'test-fns';

import { stepRouteReview } from './stepRouteReview';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-review');

describe('stepRouteReview', () => {
  given('[case1] a route with a single artifact stone', () => {
    when('[t0] stepRouteReview is called for 1.vision', () => {
      then('returns treestruct with one artifact', async () => {
        const result = await stepRouteReview({
          route: ASSETS_DIR,
          stone: '1.vision',
        });

        expect(result.emit.stderr).toBeUndefined();
        expect(result.artifacts).toHaveLength(1);
        expect(result.emit.stdout).toContain('🦉 look for the light');
        expect(result.emit.stdout).toContain('1 file to review');
        expect(result.emit.stdout).toContain('1.vision');
      });
    });
  });

  given('[case2] a route with multiple artifact stone', () => {
    when('[t0] stepRouteReview is called for 2.criteria', () => {
      then('returns treestruct with multiple artifacts', async () => {
        const result = await stepRouteReview({
          route: ASSETS_DIR,
          stone: '2.criteria',
        });

        expect(result.emit.stderr).toBeUndefined();
        expect(result.artifacts).toHaveLength(2);
        expect(result.emit.stdout).toContain('2 files to review');
      });
    });
  });

  given('[case3] a nonexistent stone', () => {
    when('[t0] stepRouteReview is called', () => {
      then('returns error with treestruct format', async () => {
        const result = await stepRouteReview({
          route: ASSETS_DIR,
          stone: 'nonexistent',
        });

        expect(result.emit.stderr).toBeDefined();
        expect(result.emit.stderr?.reason).toContain('🦉 look for the light');
        expect(result.emit.stderr?.reason).toContain('🗿 route.review');
        expect(result.emit.stderr?.reason).toContain('not found in route');
      });
    });
  });

  given('[case4] multiple artifacts with --open specified', () => {
    when('[t0] stepRouteReview is called', () => {
      then('shows tip message about --open ignored', async () => {
        const result = await stepRouteReview({
          route: ASSETS_DIR,
          stone: '2.criteria',
          open: 'vim',
        });

        expect(result.opened).toBe(false);
        expect(result.emit.stdout).toContain('--open vim ignored');
        expect(result.emit.stdout).toContain('multiple files matched');
      });
    });
  });

  given('[case5] a stone with no artifacts', () => {
    when('[t0] stepRouteReview is called for 3.empty', () => {
      then('returns empty state message', async () => {
        const result = await stepRouteReview({
          route: ASSETS_DIR,
          stone: '3.empty',
        });

        expect(result.emit.stderr).toBeUndefined();
        expect(result.artifacts).toHaveLength(0);
        expect(result.emit.stdout).toContain('no artifacts to review');
      });
    });
  });

  given('[case6] single artifact with --open specified', () => {
    when('[t0] stepRouteReview is called', () => {
      then('stdout shows "opened $path in $opener"', async () => {
        const result = await stepRouteReview({
          route: ASSETS_DIR,
          stone: '1.vision',
          open: 'cat', // use cat as opener (exists on all systems, safe for test)
        });

        expect(result.emit.stderr).toBeUndefined();
        expect(result.artifacts).toHaveLength(1);
        expect(result.emit.stdout).toContain('opened');
        expect(result.emit.stdout).toContain('1.vision');
        expect(result.emit.stdout).toContain('in cat');
      });
    });
  });
});
