import * as fs from 'fs';
import * as path from 'path';
import {
  genTempDir,
  getError,
  given,
  then,
  useBeforeAll,
  when,
} from 'test-fns';

import { getOneRouteStatusLineCache } from './getOneRouteStatusLineCache';

/**
 * .what = the cache read at its own grain: a record, a miss, and a fault
 * .why = the read decides hit vs miss on every repaint; each branch of its catch is clamped
 *        here, never only through the orchestrator
 */
describe('getOneRouteStatusLineCache.integration', () => {
  const scene = useBeforeAll(async () => ({
    dir: fs.realpathSync(genTempDir({ slug: 'statusline-cache-read' })),
  }));

  given('[case1] a well-formed record on disk', () => {
    when('[t0] it is read', () => {
      const out = useBeforeAll(async () => {
        const cachePath = path.join(scene.dir, 'case1.json');
        const record = {
          line: '🗿 1.vision',
          route: 'my-route',
          fingerprint: 'fp',
          degradeRow: null,
        };
        fs.writeFileSync(cachePath, JSON.stringify(record));
        return {
          found: getOneRouteStatusLineCache({ cachePath }),
          mtimeMs: fs.statSync(cachePath).mtimeMs,
          record,
        };
      });

      then('it returns the record, aged by the file mtime', () => {
        expect(out.found).toEqual({
          record: out.record,
          writtenAtMs: out.mtimeMs,
        });
      });
    });
  });

  given('[case2] a cache that reads as a miss', () => {
    const MISSES: { slug: string; content: string | null }[] = [
      { slug: 'absent', content: null },
      { slug: 'torn json', content: '{"line": "🗿' },
      {
        slug: 'an older shape',
        content: JSON.stringify({ line: 'x', at: 'y' }),
      },
      { slug: 'a non-object', content: JSON.stringify(['x']) },
      {
        slug: 'a record with no degradeRow',
        content: JSON.stringify({ line: 'x', route: null, fingerprint: 'fp' }),
      },
      {
        slug: 'a record with a non-string degradeRow',
        content: JSON.stringify({
          line: 'x',
          route: null,
          fingerprint: 'fp',
          degradeRow: true,
        }),
      },
    ];

    MISSES.map((miss, index) =>
      when(`[t${index}] the file is ${miss.slug}`, () => {
        then('it reads as a miss (null)', () => {
          const cachePath = path.join(scene.dir, `case2.${index}.json`);
          if (miss.content !== null) fs.writeFileSync(cachePath, miss.content);
          expect(getOneRouteStatusLineCache({ cachePath })).toEqual(null);
        });
      }),
    );
  });

  given(
    '[case3] a fault other than absence (a dir where the file goes)',
    () => {
      when('[t0] it is read', () => {
        then(
          'CLAMP: it rethrows the fault, never reads it as a miss',
          async () => {
            const cachePath = path.join(scene.dir, 'case3.json');
            fs.mkdirSync(cachePath);
            const error = await getError(async () =>
              getOneRouteStatusLineCache({ cachePath }),
            );
            expect(error).toHaveProperty('code', 'EISDIR');
          },
        );
      });
    },
  );
});
