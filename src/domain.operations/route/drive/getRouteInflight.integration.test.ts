import * as fs from 'fs/promises';
import { MalfunctionError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { getRouteInflight } from './getRouteInflight';
import { RouteInflight } from './RouteInflight';
import { setRouteInflight } from './setRouteInflight';

const SINCE = Date.parse('2026-10-07T09:05:00.000Z');

/**
 * .what = integration tests for the inflight watermark round trip
 * .why = proves `since` rides the file's mtime and never the json body
 *        (rule.forbid.timestamps-in-route-artifacts), and that a corrupt watermark names its fix
 */
describe('getRouteInflight', () => {
  given('[case1] a watermark written via setRouteInflight', () => {
    when('[t0] it is read back', () => {
      const scene = useThen('the watermark round trips', async () => {
        const route = genTempDir({ slug: 'get-route-inflight-case1' });
        await setRouteInflight({
          route,
          inflight: new RouteInflight({
            stone: '5.1.execution',
            since: SINCE,
            what: 'three delegates repair blockers 1-4',
          }),
        });
        const body = await fs.readFile(
          path.join(route, '.route', 'inflight.json'),
          'utf-8',
        );
        const inflight = await getRouteInflight({ route });
        return { body, inflight };
      });

      then('the body holds no time-precision field', () => {
        expect(JSON.parse(scene.body)).toEqual({
          stone: '5.1.execution',
          what: 'three delegates repair blockers 1-4',
        });
      });

      then('since is read back from the mtime', () => {
        expect(scene.inflight?.since).toEqual(SINCE);
        expect(scene.inflight?.stone).toEqual('5.1.execution');
      });
    });
  });

  given('[case2] a watermark whose bytes are not json', () => {
    when('[t0] it is read', () => {
      then('it fails loud and names the fix', async () => {
        const route = genTempDir({ slug: 'get-route-inflight-case2' });
        await fs.mkdir(path.join(route, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(route, '.route', 'inflight.json'),
          '{ torn',
        );
        const error = await getError(getRouteInflight({ route }));
        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toContain('inflight watermark is not valid json');
        expect(error.message).toContain('fix: delete ');
        expect(error.message).toContain('--as inflight');
        // the parse error's own words belong to the js engine and shift across node versions,
        // so the snapshot masks them and pins only the words this repo owns
        expect(
          error.message
            .split(route)
            .join('<route>')
            .replace(/"error": ".*"/, '"error": "<json parse error>"'),
        ).toMatchSnapshot();
      });
    });
  });

  given('[case3] a watermark that lacks its stone', () => {
    when('[t0] it is read', () => {
      then('it fails loud and names the fix', async () => {
        const route = genTempDir({ slug: 'get-route-inflight-case3' });
        await fs.mkdir(path.join(route, '.route'), { recursive: true });
        await fs.writeFile(
          path.join(route, '.route', 'inflight.json'),
          JSON.stringify({ what: 'orphan' }),
        );
        const error = await getError(getRouteInflight({ route }));
        expect(error).toBeInstanceOf(MalfunctionError);
        expect(error.message).toContain('lacks { stone, what }');
        expect(error.message).toContain('fix: delete ');
        expect(error.message.split(route).join('<route>')).toMatchSnapshot();
      });
    });
  });

  given('[case4] a route with no watermark', () => {
    when('[t0] it is read', () => {
      then('it returns null', async () => {
        const route = genTempDir({ slug: 'get-route-inflight-case4' });
        expect(await getRouteInflight({ route })).toBeNull();
      });
    });
  });

  given(
    '[case6] a reader holds the prior watermark open while a new one is written',
    () => {
      when('[t0] the new watermark lands', () => {
        const scene = useThen('the write completes', async () => {
          const route = genTempDir({ slug: 'get-route-inflight-case6' });
          const statePath = path.join(route, '.route', 'inflight.json');
          await setRouteInflight({
            route,
            inflight: new RouteInflight({
              stone: '5.1.execution',
              since: SINCE,
              what: 'the prior wait',
            }),
          });

          // the stop hook's reader, mid-read in another process, holds this handle
          const handle = await fs.open(statePath, 'r');
          try {
            await setRouteInflight({
              route,
              inflight: new RouteInflight({
                stone: '5.1.execution',
                since: SINCE + 60_000,
                what: 'the next wait',
              }),
            });
            const bodyOfHeldHandle = await handle.readFile('utf-8');
            const inflightAfter = await getRouteInflight({ route });
            const entries = await fs.readdir(path.join(route, '.route'));
            return { bodyOfHeldHandle, inflightAfter, entries };
          } finally {
            await handle.close();
          }
        });

        then(
          '🔴 the held reader sees the prior watermark whole, never a rewrite in place',
          () => {
            // an in-place write truncates the same file the reader holds, so a reader
            // mid-read parses a torn or empty body and the stop hook throws
            expect(JSON.parse(scene.bodyOfHeldHandle)).toEqual({
              stone: '5.1.execution',
              what: 'the prior wait',
            });
          },
        );

        then(
          'a fresh read sees the new body and its own mtime together',
          () => {
            expect(scene.inflightAfter?.what).toEqual('the next wait');
            expect(scene.inflightAfter?.since).toEqual(SINCE + 60_000);
          },
        );

        then('no draft is left beside the watermark', () => {
          expect(scene.entries).toEqual(['inflight.json']);
        });
      });
    },
  );

  given('[case5] a route whose .route is a file, not a dir', () => {
    when('[t0] it is read', () => {
      then(
        'it returns null — ENOTDIR is an absence, per the one shared allowlist',
        async () => {
          const route = genTempDir({ slug: 'get-route-inflight-case5' });
          await fs.writeFile(path.join(route, '.route'), 'not a dir');
          expect(await getRouteInflight({ route })).toBeNull();
        },
      );
    });
  });
});
