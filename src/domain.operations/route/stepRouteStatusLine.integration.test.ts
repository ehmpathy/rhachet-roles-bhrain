import * as fs from 'fs/promises';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { stepRouteStatusLine } from './stepRouteStatusLine';

/**
 * .what = integration tests for stepRouteStatusLine
 * .why = verifies the status line reflects the current stone via real filesystem
 *
 * .note = tests pass route param directly to avoid bind conflicts
 *         (all tests run in same git repo context)
 */
describe('stepRouteStatusLine.integration', () => {
  given('[case1] route with unpassed stones', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case1', git: true });

      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.vision.stone'),
        '# stone: vision\n\ndone when:\n- vision drafted',
      );

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns the current stone line', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then('line shows the moai prefix + current stone name', () => {
        expect(result.line).toEqual('🗿 1.vision');
      });
    });
  });

  given('[case2] route with multiple stones, first unpassed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case2', git: true });

      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.vision.stone'),
        '# stone: vision',
      );
      await fs.writeFile(
        path.join(tempDir, '5.1.execution.from_vision.stone'),
        '# stone: execution',
      );

      // pass the first stone so the current stone is the second
      await fs.writeFile(
        path.join(tempDir, '1.vision.yield.md'),
        '# vision yielded',
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1.vision', status: 'passed' }) + '\n',
      );

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns the next unpassed stone', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then('line shows the second (current) stone', () => {
        expect(result.line).toEqual('🗿 5.1.execution.from_vision');
      });
    });
  });

  given('[case3] route with all stones passed', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case3', git: true });

      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      await fs.writeFile(
        path.join(tempDir, '1.vision.stone'),
        '# stone: vision',
      );
      await fs.writeFile(
        path.join(tempDir, '1.vision.yield.md'),
        '# vision yielded',
      );
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      await fs.writeFile(
        path.join(tempDir, '.route', 'passage.jsonl'),
        JSON.stringify({ stone: '1.vision', status: 'passed' }) + '\n',
      );

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns the route-complete line', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then('line shows the route-complete celebration', () => {
        // a bound route whose stones all passed is `complete` — distinct from an
        // unbound / stone-less route (which stays blank). the celebration marks the
        // finish so an observer sees the route wrapped, not a line that just vanished
        expect(result.line).toEqual('🗿 route complete 🎉');
      });
    });
  });

  given('[case4] empty route (no stones)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case4', git: true });

      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns an empty line', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then(
        'line is blank (no stones → not complete: no stone was passed)',
        () => {
          // a route with zero stones is blank, NOT `route complete` — a celebration
          // here would be a lie (no stone was ever passed). complete is reserved for a
          // route that had stones and passed them all (see case3)
          expect(result.line).toEqual('');
        },
      );
    });
  });

  given('[case5] a route path that does not exist', () => {
    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns an empty line', async () =>
        stepRouteStatusLine({ route: '/does/not/exist/route' }),
      );

      then('line is blank (a dir with no stones is not complete)', () => {
        // an absent dir globs to zero stones — a blank line (not `route complete`,
        // and not a swallowed fault)
        expect(result.line).toEqual('');
      });
    });
  });

  given('[case6] a parallel stone group (same numeric prefix)', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = genTempDir({ slug: 'statusline-int-case6', git: true });

      await fs.writeFile(
        path.join(tempDir, '0.wish.md'),
        '# wish\n\nbuild a feature.',
      );
      // two parallel stones share the 3.1 prefix; neither passed
      await fs.writeFile(path.join(tempDir, '3.1.a.stone'), '# stone: a');
      await fs.writeFile(path.join(tempDir, '3.1.b.stone'), '# stone: b');

      return { tempDir };
    });

    when('[t0] stepRouteStatusLine is called', () => {
      const result = useThen('returns a single current stone', async () =>
        stepRouteStatusLine({ route: scene.tempDir }),
      );

      then('line shows the first stone (documented v1 tradeoff)', () => {
        // vision assumption #6: parallel groups show the first stone (@next-one),
        // the same rule route.drive uses; a group under-tells but never crashes
        expect(result.line).toEqual('🗿 3.1.a');
      });
    });
  });
});
