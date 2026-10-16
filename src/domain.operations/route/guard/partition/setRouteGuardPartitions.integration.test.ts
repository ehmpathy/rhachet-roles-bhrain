import * as fs from 'fs';
import { BadRequestError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, getError, given, then, useThen, when } from 'test-fns';

import { asRouteGuardPartitionsPath } from './asRouteGuardPartitionsPath';
import { getOneRouteGuardPartitions } from './getOneRouteGuardPartitions';
import { setRouteGuardPartitions } from './setRouteGuardPartitions';

const ROUTE = '.behavior/v2026_01_01.demo';
const SET_ALL = [
  `review={src/review/**,${ROUTE}/**}`,
  `route={src/route/**,${ROUTE}/**}`,
];
const SET_PEER = [`solo={src/**,${ROUTE}/**}`];

describe('setRouteGuardPartitions', () => {
  given('[case1] a route with no declaration', () => {
    const cwd = genTempDir({ slug: 'route-partitions-absent' });

    when('[t0] the declaration is read', () => {
      then('it reads as empty, never as a fault', async () => {
        const declared = await getOneRouteGuardPartitions({
          route: ROUTE,
          cwd,
        });
        expect(declared).toEqual({ all: null, byPeer: {} });
      });
    });
  });

  given('[case6] a route whose parent path is a file, not a dir', () => {
    const cwd = genTempDir({ slug: 'route-partitions-enotdir' });
    fs.writeFileSync(path.join(cwd, '.behavior'), 'not a dir\n');

    when('[t0] the declaration is read', () => {
      then('ENOTDIR reads as absent, never as a fault', async () => {
        const declared = await getOneRouteGuardPartitions({
          route: ROUTE,
          cwd,
        });
        expect(declared).toEqual({ all: null, byPeer: {} });
      });
    });
  });

  given('[case2] an @all set declared, then an override beside it', () => {
    const cwd = genTempDir({ slug: 'route-partitions-roundtrip' });

    when('[t0] the @all set is written', () => {
      const result = useThen('the write succeeds', async () =>
        setRouteGuardPartitions({
          route: ROUTE,
          cwd,
          scope: { kind: 'all' },
          partition: SET_ALL,
        }),
      );

      then('it replaced an empty declaration', () => {
        expect(result.before).toEqual({ all: null, byPeer: {} });
      });

      then('it lands at $route/.route/partitions.json', () => {
        expect(
          fs.existsSync(path.join(cwd, ROUTE, '.route', 'partitions.json')),
        ).toEqual(true);
      });

      then('a read returns what was written', async () => {
        const declared = await getOneRouteGuardPartitions({
          route: ROUTE,
          cwd,
        });
        expect(declared).toEqual({ all: SET_ALL, byPeer: {} });
      });
    });

    when('[t1] an override for one reviewer is written', () => {
      const result = useThen('the write succeeds', async () =>
        setRouteGuardPartitions({
          route: ROUTE,
          cwd,
          scope: { kind: 'peer', stone: '3.blueprint', peer: 'r2' },
          partition: SET_PEER,
        }),
      );

      then('the @all set is kept beside it', () => {
        expect(result.after).toEqual({
          all: SET_ALL,
          byPeer: { '3.blueprint/r2': SET_PEER },
        });
      });
    });

    when('[t2] the same override is written again', () => {
      then('the bytes on disk do not change', async () => {
        const filePath = asRouteGuardPartitionsPath({ route: ROUTE, cwd });
        const bytesBefore = fs.readFileSync(filePath, 'utf-8');
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd,
          scope: { kind: 'peer', stone: '3.blueprint', peer: 'r2' },
          partition: SET_PEER,
        });
        expect(fs.readFileSync(filePath, 'utf-8')).toEqual(bytesBefore);
      });
    });
  });

  given('[case3] a declaration file that does not parse', () => {
    const cwd = genTempDir({ slug: 'route-partitions-malformed' });
    const filePath = asRouteGuardPartitionsPath({ route: ROUTE, cwd });
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '{ "all": "not a list" }\n');

    when('[t0] the declaration is read', () => {
      then('it refuses loud, and names how to re-declare', async () => {
        const error = await getError(
          getOneRouteGuardPartitions({ route: ROUTE, cwd }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('rhx route.guard.partition');
      });

      then('it names why the file does not read', async () => {
        const error = await getError(
          getOneRouteGuardPartitions({ route: ROUTE, cwd }),
        );
        expect(error.message).toContain('not the shape the tool writes');
      });

      then('the whole refusal is pinned, route, cause, and fix', async () => {
        const error = await getError(
          getOneRouteGuardPartitions({ route: ROUTE, cwd }),
        );
        // the temp dir differs per run, so it is masked before the snapshot
        expect(error.message.split(cwd).join('<cwd>')).toMatchSnapshot();
      });
    });
  });

  given('[case5] a partition widened by a repeated slug', () => {
    const cwd = genTempDir({ slug: 'route-partitions-merged' });
    const SET_WIDENED = [
      `route={src/route/**,${ROUTE}/**}`,
      `review=src/review/**,${ROUTE}/**`,
      'route=blackbox/driver.route.*,blackbox/__snapshots__/driver.route.*',
    ];

    when('[t0] the set is written', () => {
      const result = useThen('the write succeeds', async () =>
        setRouteGuardPartitions({
          route: ROUTE,
          cwd,
          scope: { kind: 'all' },
          partition: SET_WIDENED,
        }),
      );

      then(
        '🔴 the repeated slug is stored once, merged, at its first position',
        () => {
          expect(result.after.all).toEqual([
            `route=src/route/**,${ROUTE}/**,blackbox/driver.route.*,blackbox/__snapshots__/driver.route.*`,
            `review=src/review/**,${ROUTE}/**`,
          ]);
        },
      );

      then('the lone slug keeps its bytes as declared', () => {
        expect(result.after.all?.[1]).toEqual(SET_WIDENED[1]);
      });

      then('the file on disk matches the snapshot', () => {
        const filePath = asRouteGuardPartitionsPath({ route: ROUTE, cwd });
        expect(fs.readFileSync(filePath, 'utf-8')).toMatchSnapshot();
      });
    });

    when('[t1] the merged set is written back as read', () => {
      then('the bytes on disk do not change', async () => {
        const filePath = asRouteGuardPartitionsPath({ route: ROUTE, cwd });
        const bytesBefore = fs.readFileSync(filePath, 'utf-8');
        const declared = await getOneRouteGuardPartitions({
          route: ROUTE,
          cwd,
        });
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd,
          scope: { kind: 'all' },
          partition: declared.all!,
        });
        expect(fs.readFileSync(filePath, 'utf-8')).toEqual(bytesBefore);
      });
    });
  });

  given('[case4] a declaration file that is not json', () => {
    const cwd = genTempDir({ slug: 'route-partitions-not-json' });
    const filePath = asRouteGuardPartitionsPath({ route: ROUTE, cwd });
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, '{ "all": [\n');

    when('[t0] the declaration is read', () => {
      then('it refuses loud, and carries the parser cause', async () => {
        const error = await getError(
          getOneRouteGuardPartitions({ route: ROUTE, cwd }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('not json — ');

        // the whole refusal, pinned; the temp dir differs per run, so it is masked
        expect(error.message.split(cwd).join('<cwd>')).toMatchSnapshot();
      });
    });
  });

  given(
    '[case7] a declaration that stands, then a new one written over it',
    () => {
      const cwd = genTempDir({ slug: 'route-partitions-atomic' });

      // 🔴 the clamp: an in-place write truncates the file a concurrent `rhx review` may read,
      //    so a pour that reads mid-write meets a torn body and refuses a valid declaration.
      //    a swap lands a new file whole, so the path changes inode and no draft is left behind
      when('[t0] the second declaration is written', () => {
        then('it lands as a whole-file swap, with no draft left', async () => {
          const filePath = asRouteGuardPartitionsPath({ route: ROUTE, cwd });
          await setRouteGuardPartitions({
            route: ROUTE,
            cwd,
            scope: { kind: 'all' },
            partition: SET_ALL,
          });
          const inodeBefore = fs.statSync(filePath).ino;
          await setRouteGuardPartitions({
            route: ROUTE,
            cwd,
            scope: { kind: 'peer', stone: '3.blueprint', peer: 'r2' },
            partition: SET_PEER,
          });
          expect(fs.statSync(filePath).ino).not.toEqual(inodeBefore);
          expect(fs.readdirSync(path.dirname(filePath))).toEqual([
            'partitions.json',
          ]);
        });
      });
    },
  );
});
