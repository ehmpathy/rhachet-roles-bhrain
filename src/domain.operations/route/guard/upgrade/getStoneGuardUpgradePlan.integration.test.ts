import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { getError, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getStoneGuardUpgradePlan } from './getStoneGuardUpgradePlan';

/**
 * .what = builds a minimal, parseable guard body (no provenance)
 * .why = templates + route guards must parse as real guards; a distinct `note`
 *        lets each fixture differ so the diff/decision paths are exercised
 */
const guardBody = (note: string): string =>
  ['artifacts:', '  - "$route/x.md"', 'judges:', `  - echo "${note}"`].join(
    '\n',
  );

/**
 * .what = prepends a provenance block to a guard body
 * .why = the decide-phase reads lineage from the top-level provenance.uri
 */
const withProvenance = (uri: string, body: string): string =>
  ['provenance:', `  uri: ${uri}`, body].join('\n');

describe('getStoneGuardUpgradePlan.integration', () => {
  const scene = useBeforeAll(async () => {
    const repoRoot = await fs.mkdtemp(
      path.join(os.tmpdir(), 'test-upgrade-plan-'),
    );
    const routeDir = path.join(repoRoot, 'route');
    const templatesDir = path.join(repoRoot, 'templates');
    await fs.mkdir(routeDir, { recursive: true });
    await fs.mkdir(templatesDir, { recursive: true });

    // upgrade: route guard differs from its template
    await fs.writeFile(
      path.join(routeDir, '5.1.execution.guard'),
      withProvenance('templates/5.1.execution.guard', guardBody('old')),
    );
    await fs.writeFile(
      path.join(templatesDir, '5.1.execution.guard'),
      withProvenance('templates/5.1.execution.guard', guardBody('new')),
    );

    // kept: route guard byte-identical to its template
    const keptContent = withProvenance(
      'templates/2.kept.guard',
      guardBody('same'),
    );
    await fs.writeFile(path.join(routeDir, '2.kept.guard'), keptContent);
    await fs.writeFile(path.join(templatesDir, '2.kept.guard'), keptContent);

    // skipped: no provenance
    await fs.writeFile(
      path.join(routeDir, '1.vision.guard'),
      guardBody('novenance'),
    );

    // absent-source: provenance points at a template that is not present
    await fs.writeFile(
      path.join(routeDir, '9.broken.guard'),
      withProvenance('templates/absent.guard', guardBody('broken')),
    );

    // invalid-source: template exists but fails to parse (self+peer slug clash)
    await fs.writeFile(
      path.join(templatesDir, 'invalid.guard'),
      [
        'reviews:',
        '  self:',
        '    - slug: dup',
        '      say: "hi"',
        '  peer:',
        '    - slug: dup',
        '      run: echo hi',
      ].join('\n'),
    );
    await fs.writeFile(
      path.join(routeDir, '6.invalid.guard'),
      withProvenance('templates/invalid.guard', guardBody('invalid')),
    );

    // traversal: provenance escapes the repo root
    await fs.writeFile(
      path.join(routeDir, '8.escape.guard'),
      withProvenance('../../../etc/passwd', guardBody('escape')),
    );

    // unknown-var: the template parses fine but carries a stray `$FOO`
    // outside the runtime allowlist (a future-supplier var that survives copy)
    await fs.writeFile(
      path.join(templatesDir, '7.unknownvar.guard'),
      withProvenance(
        'templates/7.unknownvar.guard',
        ['artifacts:', '  - "$route/x.md"', 'judges:', '  - echo "$FOO"'].join(
          '\n',
        ),
      ),
    );
    await fs.writeFile(
      path.join(routeDir, '7.unknownvar.guard'),
      withProvenance('templates/7.unknownvar.guard', guardBody('nofoo')),
    );

    // variant fidelity: the guard's provenance names the EXACT `.heavy` file;
    // a `.light` peer exists and must NOT be pulled, and the write target keeps
    // the suffix-less guard name
    await fs.writeFile(
      path.join(templatesDir, '3.variant.guard.heavy'),
      withProvenance('templates/3.variant.guard.heavy', guardBody('heavy')),
    );
    await fs.writeFile(
      path.join(templatesDir, '3.variant.guard.light'),
      withProvenance('templates/3.variant.guard.light', guardBody('light')),
    );
    await fs.writeFile(
      path.join(routeDir, '3.variant.guard'),
      withProvenance(
        'templates/3.variant.guard.heavy',
        guardBody('variant-old'),
      ),
    );

    return { repoRoot, routeDir };
  });

  afterAll(async () => {
    await fs.rm(scene.repoRoot, { recursive: true, force: true });
  });

  given('[case1] a guard whose template differs', () => {
    when('[t0] the plan is decided', () => {
      const result = useThen('the decision is computed', async () =>
        getStoneGuardUpgradePlan({
          guardPath: path.join(scene.routeDir, '5.1.execution.guard'),
          route: 'route',
          repoRoot: scene.repoRoot,
        }),
      );

      then('the decision is upgrade', () => {
        expect(result.decision.decision).toBe('upgrade');
      });

      then('next holds the source content', () => {
        expect(result.next).toContain('echo "new"');
      });

      then('the diff surfaces the change', () => {
        expect(result.diff.some((d) => d.kind === 'remove')).toBe(true);
        expect(result.diff.some((d) => d.kind === 'add')).toBe(true);
      });

      then('from names the provenance uri', () => {
        expect(result.from).toBe('templates/5.1.execution.guard');
      });

      then('the guard file is not modified', async () => {
        const onDisk = await fs.readFile(
          path.join(scene.routeDir, '5.1.execution.guard'),
          'utf-8',
        );
        expect(onDisk).toContain('echo "old"');
      });
    });
  });

  given('[case2] a guard byte-identical to its template', () => {
    when('[t0] the plan is decided', () => {
      const result = useThen('the decision is computed', async () =>
        getStoneGuardUpgradePlan({
          guardPath: path.join(scene.routeDir, '2.kept.guard'),
          route: 'route',
          repoRoot: scene.repoRoot,
        }),
      );

      then('the decision is kept', () => {
        expect(result.decision.decision).toBe('kept');
      });

      then('next is null (no write intended)', () => {
        expect(result.next).toBeNull();
      });

      then('from still names the uri (legible no-op)', () => {
        expect(result.from).toBe('templates/2.kept.guard');
      });
    });
  });

  given('[case3] a guard with no provenance', () => {
    when('[t0] the plan is decided', () => {
      const result = useThen('the decision is computed', async () =>
        getStoneGuardUpgradePlan({
          guardPath: path.join(scene.routeDir, '1.vision.guard'),
          route: 'route',
          repoRoot: scene.repoRoot,
        }),
      );

      then('the decision is skipped', () => {
        expect(result.decision.decision).toBe('skipped');
      });

      then('from is null', () => {
        expect(result.from).toBeNull();
      });
    });
  });

  given('[case4] a guard whose template is absent', () => {
    when('[t0] the plan is decided', () => {
      const result = useThen('the decision is computed', async () =>
        getStoneGuardUpgradePlan({
          guardPath: path.join(scene.routeDir, '9.broken.guard'),
          route: 'route',
          repoRoot: scene.repoRoot,
        }),
      );

      then('the decision is absent-source', () => {
        expect(result.decision.decision).toBe('absent-source');
      });

      then('from names the absent uri', () => {
        expect(result.from).toBe('templates/absent.guard');
      });
    });
  });

  given('[case5] a guard whose template fails to parse', () => {
    when('[t0] the plan is decided', () => {
      const result = useThen('the decision is computed', async () =>
        getStoneGuardUpgradePlan({
          guardPath: path.join(scene.routeDir, '6.invalid.guard'),
          route: 'route',
          repoRoot: scene.repoRoot,
        }),
      );

      then('the decision is invalid-source', () => {
        expect(result.decision.decision).toBe('invalid-source');
      });
    });
  });

  given('[case6] a guard whose provenance escapes the repo root', () => {
    when('[t0] the plan is decided', () => {
      then('it fails loud with a BadRequestError', async () => {
        const error = await getError(
          getStoneGuardUpgradePlan({
            guardPath: path.join(scene.routeDir, '8.escape.guard'),
            route: 'route',
            repoRoot: scene.repoRoot,
          }),
        );
        expect(error).toBeInstanceOf(BadRequestError);
        expect(error.message).toContain('escapes the repo root');
      });

      then('the guard file is not modified', async () => {
        const onDisk = await fs.readFile(
          path.join(scene.routeDir, '8.escape.guard'),
          'utf-8',
        );
        expect(onDisk).toContain('../../../etc/passwd');
      });
    });
  });

  given('[case7] a guard whose template carries a stray $FOO', () => {
    when('[t0] the plan is decided', () => {
      const result = useThen('the decision is computed', async () =>
        getStoneGuardUpgradePlan({
          guardPath: path.join(scene.routeDir, '7.unknownvar.guard'),
          route: 'route',
          repoRoot: scene.repoRoot,
        }),
      );

      then('the decision is unknown-var', () => {
        expect(result.decision.decision).toBe('unknown-var');
      });

      then('the stray var is named', () => {
        const decision = result.decision;
        if (decision.decision !== 'unknown-var')
          throw new Error('expected unknown-var');
        expect(decision.vars).toContain('$FOO');
      });
    });
  });

  given(
    '[case8] a suffix-less guard whose provenance names the .heavy variant',
    () => {
      when('[t0] the plan is decided', () => {
        const result = useThen('the decision is computed', async () =>
          getStoneGuardUpgradePlan({
            guardPath: path.join(scene.routeDir, '3.variant.guard'),
            route: 'route',
            repoRoot: scene.repoRoot,
          }),
        );

        then('the decision is upgrade', () => {
          expect(result.decision.decision).toBe('upgrade');
        });

        then('next holds the HEAVY content, not the light peer', () => {
          expect(result.next).toContain('echo "heavy"');
          expect(result.next).not.toContain('echo "light"');
        });

        then('from names the exact .heavy uri', () => {
          expect(result.from).toBe('templates/3.variant.guard.heavy');
        });
      });
    },
  );
});
