import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { RouteStone } from '@src/domain.objects/Driver/RouteStone';
import { setStoneAsPromised } from '@src/domain.operations/route/stones/setStoneAsPromised';

import { getStonePromises } from './getStonePromises';

describe('getStonePromises', () => {
  given('[case1] no .route directory found', () => {
    const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-1`);

    when('[t0] getStonePromises called', () => {
      then('returns empty array', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await getStonePromises({
          stone,
          route: tempDir,
        });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case2] .route directory found but no promise files', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-2`);
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });
      return { tempDir };
    });

    when('[t0] getStonePromises called', () => {
      then('returns empty array', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await getStonePromises({
          stone,
          route: scene.tempDir,
        });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case3] hashless promise files found', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-3`);
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create hashless promise files
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.promise.all-done.md'),
        '# promise: all-done',
      );
      await fs.writeFile(
        path.join(routeDir, '1.vision.guard.promise.tests-pass.md'),
        '# promise: tests-pass',
      );

      return { tempDir };
    });

    when('[t0] getStonePromises called', () => {
      then('returns promise artifacts', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await getStonePromises({
          stone,
          route: scene.tempDir,
        });
        expect(result).toHaveLength(2);
        const slugs = result.map((p) => p.slug).sort();
        expect(slugs).toEqual(['all-done', 'tests-pass']);
      });
    });
  });

  given('[case4] promise files for different stone', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-4`);
      const routeDir = path.join(tempDir, '.route');
      await fs.mkdir(routeDir, { recursive: true });

      // create promise for different stone
      await fs.writeFile(
        path.join(routeDir, '2.criteria.guard.promise.all-done.md'),
        '# promise: all-done',
      );

      return { tempDir };
    });

    when('[t0] getStonePromises called for different stone', () => {
      then('returns empty array', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });
        const result = await getStonePromises({
          stone,
          route: scene.tempDir,
        });
        expect(result).toEqual([]);
      });
    });
  });

  given('[case5] a slug that carries a dot', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-5`);
      await fs.mkdir(path.join(tempDir, '.route'), { recursive: true });
      return { tempDir };
    });

    when('[t0] the writer writes it and the reader reads it back', () => {
      then('the slug round trips', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });

        // 🔴 the clamp is aimed at the AGREEMENT, never at either value: the writer
        //    mints the filename, the reader parses it, and the slug must survive the
        //    trip. a hand-typed filename here would grade the reader against this
        //    test's own guess rather than against the writer it must agree with
        const slug = 'i1.p1';
        await setStoneAsPromised({ stone, slug, route: scene.tempDir });

        const result = await getStonePromises({ stone, route: scene.tempDir });
        expect(result).toHaveLength(1);
        expect(result[0]!.slug).toEqual(slug);
      });
    });
  });

  given(
    '[case6] a route path whose own parent is a file, not a directory',
    () => {
      const scene = useBeforeAll(async () => {
        const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-6`);
        await fs.mkdir(tempDir, { recursive: true });

        // 🔴 the fault is provoked DETERMINISTICALLY rather than mocked, and it is aimed at
        //    the PROBE rather than at the enumeration below it. a regular file at a path
        //    COMPONENT makes `fs.access` itself throw `ENOTDIR` — a fault that is not
        //    `ENOENT`, so it is not an absence and must not read as one.
        //
        // 🟡 a file at the `.route` path itself does NOT clamp this: `fs.access` SUCCEEDS on
        //    a file, so the fault lands in the glob instead and reaches the caller either
        //    way. that first draft passed under the bare catch too — a clamp with no teeth
        await fs.writeFile(path.join(tempDir, 'notadir'), 'a regular file');

        return { route: path.join(tempDir, 'notadir', 'nested') };
      });

      when('[t0] getStonePromises is called', () => {
        then(
          'the fault reaches the caller rather than an empty list',
          async () => {
            const stone = new RouteStone({
              name: '1.vision',
              path: '1.vision.stone',
              guard: null,
            });

            // 🔴 an empty list HERE is the silent-drop failure: the guard would read "no
            //    promises on record" and RE-HAND every review the driver already promised
            await expect(
              getStonePromises({ stone, route: scene.route }),
            ).rejects.toThrow();
          },
        );
      });
    },
  );

  given('[case7] the route dir is genuinely absent', () => {
    const scene = useBeforeAll(async () => {
      const tempDir = path.join(os.tmpdir(), `test-promises-${Date.now()}-7`);
      await fs.mkdir(tempDir, { recursive: true });
      return { tempDir };
    });

    when('[t0] getStonePromises is called', () => {
      then('an ENOENT is still a legitimate empty list', async () => {
        const stone = new RouteStone({
          name: '1.vision',
          path: '1.vision.stone',
          guard: null,
        });

        // the bound on [case6]: only a NON-ENOENT fault may reach the caller. a stone
        // that has never been driven has no `.route` dir, and that absence is real
        const result = await getStonePromises({ stone, route: scene.tempDir });
        expect(result).toEqual([]);
      });
    });
  });
});
