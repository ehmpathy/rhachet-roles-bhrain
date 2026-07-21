import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { setRouteGuardsFromProvenance } from './setRouteGuardsFromProvenance';

/**
 * .what = a minimal, parseable guard body (no provenance)
 * .why = every template + route guard must parse; the `note` lets fixtures differ
 */
const guardBody = (note: string): string =>
  ['artifacts:', '  - "$route/x.md"', 'judges:', `  - echo "${note}"`].join(
    '\n',
  );

const withProvenance = (uri: string, body: string): string =>
  ['provenance:', `  uri: ${uri}`, body].join('\n');

/**
 * .what = seeds a temp repo with a route dir + peer templates dir
 * .why = mirrors reality (provenance points OUTSIDE the route into a supplier dir)
 *        and gives each test an isolated, hermetic filesystem
 */
const seedRepo = async (
  guards: { name: string; content: string }[],
  templates: { name: string; content: string }[],
): Promise<{ repoRoot: string; routeDir: string }> => {
  const repoRoot = await fs.mkdtemp(
    path.join(os.tmpdir(), 'test-upgrade-set-'),
  );
  const routeDir = path.join(repoRoot, 'route');
  const templatesDir = path.join(repoRoot, 'templates');
  await fs.mkdir(routeDir, { recursive: true });
  await fs.mkdir(templatesDir, { recursive: true });
  await Promise.all(
    guards.map((g) => fs.writeFile(path.join(routeDir, g.name), g.content)),
  );
  await Promise.all(
    templates.map((t) =>
      fs.writeFile(path.join(templatesDir, t.name), t.content),
    ),
  );
  return { repoRoot, routeDir };
};

describe('setRouteGuardsFromProvenance.integration', () => {
  given('[case1] a route with an upgrade, a kept, and a skip', () => {
    const scene = useBeforeAll(async () =>
      seedRepo(
        [
          {
            name: '5.1.execution.guard',
            content: withProvenance(
              'templates/5.1.execution.guard',
              guardBody('old'),
            ),
          },
          {
            name: '2.kept.guard',
            content: withProvenance(
              'templates/2.kept.guard',
              guardBody('same'),
            ),
          },
          { name: '1.vision.guard', content: guardBody('novenance') },
        ],
        [
          {
            name: '5.1.execution.guard',
            content: withProvenance(
              'templates/5.1.execution.guard',
              guardBody('new'),
            ),
          },
          {
            name: '2.kept.guard',
            content: withProvenance(
              'templates/2.kept.guard',
              guardBody('same'),
            ),
          },
        ],
      ),
    );

    afterAll(async () => {
      await fs.rm(scene.repoRoot, { recursive: true, force: true });
    });

    when('[t0] the whole route is applied (no --stone)', () => {
      const applied = useThen('the apply succeeds', async () => {
        const results = await setRouteGuardsFromProvenance({
          route: 'route',
          stone: null,
          mode: 'apply',
          repoRoot: scene.repoRoot,
        });
        return {
          byName: Object.fromEntries(
            results.map((r) => [r.guardName, r.decision.decision]),
          ),
        };
      });

      then('each guard reports its own decision', () => {
        expect(applied.byName['5.1.execution.guard']).toBe('upgrade');
        expect(applied.byName['2.kept.guard']).toBe('kept');
        expect(applied.byName['1.vision.guard']).toBe('skipped');
      });

      then('the upgraded guard now equals its template', async () => {
        const onDisk = await fs.readFile(
          path.join(scene.routeDir, '5.1.execution.guard'),
          'utf-8',
        );
        expect(onDisk).toContain('echo "new"');
      });

      then('the kept guard is byte-unchanged', async () => {
        const onDisk = await fs.readFile(
          path.join(scene.routeDir, '2.kept.guard'),
          'utf-8',
        );
        expect(onDisk).toContain('echo "same"');
      });

      then('the skipped guard is byte-unchanged', async () => {
        const onDisk = await fs.readFile(
          path.join(scene.routeDir, '1.vision.guard'),
          'utf-8',
        );
        expect(onDisk).toContain('echo "novenance"');
      });
    });
  });

  given('[case2] plan mode over a guard that differs from its template', () => {
    const scene = useBeforeAll(async () =>
      seedRepo(
        [
          {
            name: '5.1.execution.guard',
            content: withProvenance(
              'templates/5.1.execution.guard',
              guardBody('old'),
            ),
          },
        ],
        [
          {
            name: '5.1.execution.guard',
            content: withProvenance(
              'templates/5.1.execution.guard',
              guardBody('new'),
            ),
          },
        ],
      ),
    );

    afterAll(async () => {
      await fs.rm(scene.repoRoot, { recursive: true, force: true });
    });

    when('[t0] the route is planned (default mode)', () => {
      const results = useThen('the plan succeeds', async () =>
        setRouteGuardsFromProvenance({
          route: 'route',
          stone: null,
          mode: 'plan',
          repoRoot: scene.repoRoot,
        }),
      );

      then('the decision is upgrade', () => {
        expect(results[0]!.decision.decision).toBe('upgrade');
      });

      then('the guard file is NOT written in plan mode', async () => {
        const onDisk = await fs.readFile(
          path.join(scene.routeDir, '5.1.execution.guard'),
          'utf-8',
        );
        expect(onDisk).toContain('echo "old"');
      });
    });
  });

  given('[case3] an apply with one blocked guard among good ones', () => {
    const scene = useBeforeAll(async () =>
      seedRepo(
        [
          {
            name: '5.1.execution.guard',
            content: withProvenance(
              'templates/5.1.execution.guard',
              guardBody('old'),
            ),
          },
          {
            name: '9.broken.guard',
            content: withProvenance(
              'templates/absent.guard',
              guardBody('broken'),
            ),
          },
        ],
        [
          {
            name: '5.1.execution.guard',
            content: withProvenance(
              'templates/5.1.execution.guard',
              guardBody('new'),
            ),
          },
        ],
      ),
    );

    afterAll(async () => {
      await fs.rm(scene.repoRoot, { recursive: true, force: true });
    });

    when('[t0] the whole route is applied', () => {
      then('it fails loud with a BadRequestError', async () => {
        const error = await getError(
          setRouteGuardsFromProvenance({
            route: 'route',
            stone: null,
            mode: 'apply',
            repoRoot: scene.repoRoot,
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('9.broken.guard');
        expect(error.message).toContain('absent-source');
      });

      then('the good guard was NOT written (gate fires first)', async () => {
        const onDisk = await fs.readFile(
          path.join(scene.routeDir, '5.1.execution.guard'),
          'utf-8',
        );
        expect(onDisk).toContain('echo "old"');
      });
    });
  });

  given('[case4] a --stone boundary match (5.1 not 5.10)', () => {
    const scene = useBeforeAll(async () =>
      seedRepo(
        [
          {
            name: '5.1.execution.guard',
            content: withProvenance(
              'templates/5.1.execution.guard',
              guardBody('old'),
            ),
          },
          {
            name: '5.10.other.guard',
            content: withProvenance(
              'templates/5.10.other.guard',
              guardBody('old-ten'),
            ),
          },
        ],
        [
          {
            name: '5.1.execution.guard',
            content: withProvenance(
              'templates/5.1.execution.guard',
              guardBody('new'),
            ),
          },
          {
            name: '5.10.other.guard',
            content: withProvenance(
              'templates/5.10.other.guard',
              guardBody('new-ten'),
            ),
          },
        ],
      ),
    );

    afterAll(async () => {
      await fs.rm(scene.repoRoot, { recursive: true, force: true });
    });

    when('[t0] apply --stone 5.1', () => {
      const applied = useThen('the apply succeeds', async () => {
        const results = await setRouteGuardsFromProvenance({
          route: 'route',
          stone: '5.1',
          mode: 'apply',
          repoRoot: scene.repoRoot,
        });
        return { names: results.map((r) => r.guardName) };
      });

      then('only the 5.1 guard is in the result set', () => {
        expect(applied.names).toEqual(['5.1.execution.guard']);
      });

      then('the 5.1 guard is upgraded', async () => {
        const onDisk = await fs.readFile(
          path.join(scene.routeDir, '5.1.execution.guard'),
          'utf-8',
        );
        expect(onDisk).toContain('echo "new"');
      });

      then('the 5.10 lookalike is byte-unchanged', async () => {
        const onDisk = await fs.readFile(
          path.join(scene.routeDir, '5.10.other.guard'),
          'utf-8',
        );
        expect(onDisk).toContain('echo "old-ten"');
      });
    });
  });

  given('[case5] a --stone that matches no guard', () => {
    const scene = useBeforeAll(async () =>
      seedRepo(
        [{ name: '1.vision.guard', content: guardBody('novenance') }],
        [],
      ),
    );

    afterAll(async () => {
      await fs.rm(scene.repoRoot, { recursive: true, force: true });
    });

    when('[t0] apply --stone 9.absent', () => {
      then('it fails loud and lists the available stones', async () => {
        const error = await getError(
          setRouteGuardsFromProvenance({
            route: 'route',
            stone: '9.absent',
            mode: 'apply',
            repoRoot: scene.repoRoot,
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('no guard matched');
        expect(error.message).toContain('1.vision');
      });
    });
  });

  given('[case6] an empty route (no guard files)', () => {
    const scene = useBeforeAll(async () => seedRepo([], []));

    afterAll(async () => {
      await fs.rm(scene.repoRoot, { recursive: true, force: true });
    });

    when('[t0] the route is planned', () => {
      const planned = useThen('the plan succeeds', async () => {
        const results = await setRouteGuardsFromProvenance({
          route: 'route',
          stone: null,
          mode: 'plan',
          repoRoot: scene.repoRoot,
        });
        return { count: results.length };
      });

      then('the result set is empty (benign no-op)', () => {
        expect(planned.count).toBe(0);
      });
    });
  });

  given('[case7] a re-run after an upgrade (idempotency)', () => {
    const scene = useBeforeAll(async () =>
      seedRepo(
        [
          {
            name: '5.1.execution.guard',
            content: withProvenance(
              'templates/5.1.execution.guard',
              guardBody('old'),
            ),
          },
        ],
        [
          {
            name: '5.1.execution.guard',
            content: withProvenance(
              'templates/5.1.execution.guard',
              guardBody('new'),
            ),
          },
        ],
      ),
    );

    afterAll(async () => {
      await fs.rm(scene.repoRoot, { recursive: true, force: true });
    });

    when('[t0] apply is run twice', () => {
      const second = useThen('both applies complete', async () => {
        await setRouteGuardsFromProvenance({
          route: 'route',
          stone: null,
          mode: 'apply',
          repoRoot: scene.repoRoot,
        });
        return setRouteGuardsFromProvenance({
          route: 'route',
          stone: null,
          mode: 'apply',
          repoRoot: scene.repoRoot,
        });
      });

      then('the second run reports kept (no change)', () => {
        expect(second[0]!.decision.decision).toBe('kept');
      });
    });
  });
});
