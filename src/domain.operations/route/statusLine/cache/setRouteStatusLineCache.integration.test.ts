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

import { setRouteStatusLineCache } from './setRouteStatusLineCache';

const RECORD = {
  line: '🗿 1.vision',
  route: 'my-route',
  fingerprint: 'fp',
  degradeRow: null,
};

/**
 * .what = the cache write at its own grain: an atomic write, and a fault that leaves no temp
 * .why = the write races across seats; its rename and its cleanup on a fault are clamped here
 */
describe('setRouteStatusLineCache.integration', () => {
  const scene = useBeforeAll(async () => ({
    dir: fs.realpathSync(genTempDir({ slug: 'statusline-cache-write' })),
  }));

  given('[case1] a cache dir not yet made', () => {
    when('[t0] a record is written', () => {
      const out = useBeforeAll(async () => {
        const cacheDir = path.join(scene.dir, 'case1', 'nested');
        const cachePath = path.join(cacheDir, 'branch=main.json');
        await setRouteStatusLineCache({ cachePath, record: RECORD });
        return { cachePath, names: fs.readdirSync(cacheDir) };
      });

      then('it makes the dir and writes the record whole', () => {
        expect(JSON.parse(fs.readFileSync(out.cachePath, 'utf-8'))).toEqual(
          RECORD,
        );
      });

      then('it leaves no temp file beside the record', () => {
        expect([...out.names].sort()).toEqual([
          '.gitignore',
          'branch=main.json',
        ]);
      });
    });
  });

  given('[case2] a dir where the cache file goes, so the rename faults', () => {
    const occupied = useBeforeAll(async () => {
      const cacheDir = path.join(scene.dir, 'case2');
      const cachePath = path.join(cacheDir, 'branch=main.json');
      fs.mkdirSync(path.join(cachePath, 'occupant'), { recursive: true });
      return { cacheDir, cachePath };
    });

    when('[t0] a record is written', () => {
      const out = useBeforeAll(async () => {
        const error = await getError(async () =>
          setRouteStatusLineCache({
            cachePath: occupied.cachePath,
            record: RECORD,
          }),
        );
        return { error, names: fs.readdirSync(occupied.cacheDir) };
      });

      then('it throws the fs fault to the caller', () => {
        expect(out.error).toHaveProperty('code');
      });

      then('CLAMP: it drops its temp file, so no orphan is left', () => {
        expect([...out.names].sort()).toEqual([
          '.gitignore',
          'branch=main.json',
        ]);
      });
    });
  });
});
