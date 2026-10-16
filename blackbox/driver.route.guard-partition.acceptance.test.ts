import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import { given, then, useBeforeAll, useThen, when } from 'test-fns';

import {
  execAsync,
  genTempDirForRhachet,
  invokeRouteSkill,
} from './.test/invokeRouteSkill';

const ASSETS_DIR = path.join(__dirname, '.test/assets/route-halt');
const ROUTE = '.behavior/v2026_01_01.demo';

/**
 * .what = acceptance coverage for `rhx route.guard.partition` — the one place a route declares
 *         how its peer reviews split when they overflow
 * .why = the declaration is read by every guarded review on the route (seed S45) and always
 *        replaces the whole set for its scope (seed S46). a set that leaves a changed file
 *        unclaimed must refuse BEFORE the write, or the overflow it was meant to cure returns
 *        on some later round of some later lane
 *
 * .note = the fixture holds a route plus two vertical domains, each with its own test, all
 *         uncommitted on a feature branch — so every file reads as changed since main
 */
describe('driver.route.guard-partition.acceptance', () => {
  const scene = useBeforeAll(async () => {
    const tempDir = genTempDirForRhachet({
      slug: 'route-guard-partition',
      clone: ASSETS_DIR,
    });
    await execAsync('npx rhachet roles link --role driver', { cwd: tempDir });

    // settle the linked role on main, so only the branch's own work reads as changed
    await execAsync('git add -A && git commit -m "link driver" --no-verify', {
      cwd: tempDir,
    });
    await execAsync('git checkout -b vlad/test-guard-partition', {
      cwd: tempDir,
    });

    // two vertical domains, each with its own test, plus the route spec
    const files: Record<string, string> = {
      [`${ROUTE}/1.vision.md`]: '# vision\n',
      'src/review/getReview.ts': 'export const getReview = () => 1;\n',
      'src/review/getReview.test.ts': "test('review', () => undefined);\n",
      'src/route/getRoute.ts': 'export const getRoute = () => 2;\n',
      'src/route/getRoute.test.ts': "test('route', () => undefined);\n",
    };
    Object.entries(files).map(([relative, content]) => {
      const absolute = path.join(tempDir, relative);
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, content);
    });
    return { tempDir };
  });

  const PARTITIONS_COVERED = [
    `review={src/review/**,${ROUTE}/**}`,
    `route={src/route/**,${ROUTE}/**}`,
  ];
  const asDeclarationPath = (): string =>
    path.join(scene.tempDir, ROUTE, '.route', 'partitions.json');

  given('[case1] a set that claims every changed file', () => {
    when('[t0] it is previewed (the default mode)', () => {
      const result = useThen('the preview succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            route: ROUTE,
            partition: PARTITIONS_COVERED,
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('it says naught was written, and names how to write it', () => {
        expect(result.stdout).toContain('naught written');
        expect(result.stdout).toContain('add --mode apply');
      });

      then('naught is written to the route', () => {
        expect(fs.existsSync(asDeclarationPath())).toEqual(false);
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('plan @all');
      });
    });

    when('[t1] it is applied', () => {
      const result = useThen('the write succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            route: ROUTE,
            partition: PARTITIONS_COVERED,
            mode: 'apply',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('the whole set lands at $route/.route/partitions.json', () => {
        expect(JSON.parse(fs.readFileSync(asDeclarationPath(), 'utf-8'))).toEqual(
          { all: PARTITIONS_COVERED, byPeer: {} },
        );
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('apply @all');
      });
    });

    when('[t2] the scope is read with no --partition', () => {
      const result = useThen('the read succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: { for: 'review', peer: '@all', route: ROUTE },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('it shows each partition the scope holds', () => {
        PARTITIONS_COVERED.map((value) =>
          expect(result.stdout).toContain(value),
        );
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('show @all');
      });
    });
  });

  given('[case2] a set that leaves a changed file unclaimed', () => {
    when('[t0] it is applied', () => {
      const result = useThen('the declaration is refused', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            route: ROUTE,
            partition: [`review={src/review/**,${ROUTE}/**}`],
            mode: 'apply',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2 (constraint — the caller must widen the set)', () => {
        expect(result.code).toEqual(2);
      });

      then('the refusal names the unclaimed file, on stderr', () => {
        expect(result.stderr).toContain('src/route/getRoute.ts');
      });

      then('the prior declaration is left as it stood', () => {
        expect(JSON.parse(fs.readFileSync(asDeclarationPath(), 'utf-8'))).toEqual(
          { all: PARTITIONS_COVERED, byPeer: {} },
        );
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('refuse unclaimed');
      });
    });
  });

  given('[case2b] an @all scope cleared with --partition none', () => {
    when('[t0] the clear is applied', () => {
      const result = useThen('the clear succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            route: ROUTE,
            partition: ['none'],
            mode: 'apply',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('the scope reads as none declared', () => {
        expect(
          JSON.parse(fs.readFileSync(asDeclarationPath(), 'utf-8')),
        ).toEqual({ all: null, byPeer: {} });
      });

      then('stdout names how many partitions it cleared', () => {
        expect(result.stdout).toContain('clears: 2 partitions');
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('clear @all');
      });
    });

    when('[t1] none is mixed with a real partition', () => {
      const result = useThen('the input is refused', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            route: ROUTE,
            partition: ['none', `review={src/review/**,${ROUTE}/**}`],
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2, and stderr says none stands alone', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('takes no other --partition');
      });

      then('the refusal renders whole', () => {
        expect(result.stderr).toMatchSnapshot('refuse none mixed');
      });
    });
  });

  given('[case3] a per-peer scope with no --stone', () => {
    when('[t0] it is invoked', () => {
      const result = useThen('the input is refused', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: 'r1',
            route: ROUTE,
            partition: PARTITIONS_COVERED,
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2', () => {
        expect(result.code).toEqual(2);
      });

      then('the error names --stone, on stderr', () => {
        expect(result.stderr).toContain('--stone');
        expect(result.stdout).not.toContain('--stone');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('refuse peer without stone');
      });
    });
  });

  /**
   * .what = every argument refusal the command can raise before it reads the branch
   * .why = each is a blocked state a driver meets, so each renders whole in a snapshot;
   *        an assertion sees only the line it names
   */
  const ARGUMENT_REFUSALS: Array<{
    slug: string;
    args: Record<string, string | string[] | boolean>;
    names: string;
  }> = [
    {
      slug: 'for absent',
      args: { peer: '@all', route: ROUTE, partition: PARTITIONS_COVERED },
      names: '--for review is required',
    },
    {
      slug: 'peer absent',
      args: { for: 'review', route: ROUTE, partition: PARTITIONS_COVERED },
      names: '--peer is required',
    },
    {
      slug: 'stone beside all',
      args: {
        for: 'review',
        peer: '@all',
        stone: '1.vision',
        route: ROUTE,
        partition: PARTITIONS_COVERED,
      },
      names: '--stone scopes a one-reviewer override',
    },
    {
      slug: 'mode unknown',
      args: {
        for: 'review',
        peer: '@all',
        route: ROUTE,
        mode: 'bogus',
        partition: PARTITIONS_COVERED,
      },
      names: '--mode must be "plan" or "apply"',
    },
    {
      slug: 'no bound route',
      args: { for: 'review', peer: '@all', partition: PARTITIONS_COVERED },
      names: 'no bound route found',
    },
    {
      slug: 'stone valueless',
      // `--stone` typed bare once parsed as a stone named 'true' and passed every check
      args: {
        for: 'review',
        peer: 'r1',
        stone: true,
        route: ROUTE,
        partition: PARTITIONS_COVERED,
      },
      names: '--stone given with no value',
    },
    {
      slug: 'claim without into',
      args: { for: 'review', peer: '@all', route: ROUTE, claim: 'src/new/**' },
      names: '--claim needs --into <slug>',
    },
    {
      slug: 'claim into count mismatch',
      args: {
        for: 'review',
        peer: '@all',
        route: ROUTE,
        claim: ['a/**', 'b/**', 'c/**'],
        into: ['x', 'y'],
      },
      names: '3 --claim beside 2 --into',
    },
    {
      slug: 'claim beside partition',
      args: {
        for: 'review',
        peer: '@all',
        route: ROUTE,
        claim: 'src/new/**',
        into: 'review',
        partition: PARTITIONS_COVERED,
      },
      names: '--partition and --claim are separate edits',
    },
    {
      slug: 'into without claim',
      args: { for: 'review', peer: '@all', route: ROUTE, into: 'review' },
      names: '--into names the home of a --claim',
    },
    {
      slug: 'prune beside claim',
      args: {
        for: 'review',
        peer: '@all',
        route: ROUTE,
        claim: 'src/new/**',
        into: 'review',
        prune: 'src/gone/**',
      },
      names: '--claim and --prune are separate edits',
    },
    {
      slug: 'from without prune',
      args: { for: 'review', peer: '@all', route: ROUTE, from: 'review' },
      names: '--from names the partition a --prune leaves',
    },
    {
      slug: 'prune from count mismatch',
      args: {
        for: 'review',
        peer: '@all',
        route: ROUTE,
        prune: ['a/**', 'b/**', 'c/**'],
        from: ['x', 'y'],
      },
      names: '3 --prune beside 2 --from',
    },
  ];

  given('[case3b] an argument the command cannot act on', () => {
    ARGUMENT_REFUSALS.map((refusal, index) =>
      when(`[t${index}] ${refusal.slug}`, () => {
        const result = useThen('the input is refused', async () =>
          invokeRouteSkill({
            skill: 'route.guard.partition',
            args: refusal.args,
            cwd: scene.tempDir,
          }),
        );

        then('exit code is 2, and stderr names the fault', () => {
          expect(result.code).toEqual(2);
          expect(result.stderr).toContain(`✋ ConstraintError: `);
          expect(result.stderr).toContain(refusal.names);
        });

        then('it speaks in the same frame as the coverage refusal', () => {
          // one command, one visual shape: the owl header leads every refusal (r011 nitpick.2)
          expect(result.stderr.trimStart().startsWith('🦉 woah there')).toEqual(
            true,
          );
        });

        then('the refusal renders whole', () => {
          expect(result.stderr).toMatchSnapshot(`refuse ${refusal.slug}`);
        });
      }),
    );
  });

  given('[case4] a request for help', () => {
    when('[t0] --help is passed', () => {
      const result = useThen('help is shown', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: { help: true },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('it names every flag', () => {
        [
          '--for',
          '--peer',
          '--stone',
          '--full',
          '--partition',
          '--claim',
          '--into',
          '--prune',
          '--from',
          '--mode',
          '--route',
        ].map((flag) => expect(result.stdout).toContain(flag));
      });

      then('it stays dense: one line per option, one notes block', () => {
        // .note = the cap grows by exactly the lines a new flag pair adds (one usage, two
        //         options) less what a note fold won back; it never grows to fit prose
        const lines = result.stdout.trim().split('\n');
        expect(lines.length).toBeLessThanOrEqual(27);
        const optionLines = lines.filter((line) => /^ {2}--[a-z]/.test(line));
        expect(optionLines).toHaveLength(11);
        expect(result.stdout).toContain('\nnotes:\n');
      });

      then('every option description starts at one column', () => {
        // an option row is `  --flag <arg>   description`; the description column is the
        // first non-space char after a run of 2+ spaces past the flag
        const columns = result.stdout
          .split('\n')
          .filter((line) => /^ {2}--/.test(line))
          .map((line) => /^ {2}--\S.*? {2,}(?=\S)/.exec(line)?.[0].length);
        expect(columns.length).toBeGreaterThan(5);
        expect(new Set(columns).size).toEqual(1);
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('help');
      });
    });
  });

  given('[case5] a partition widened by a repeated slug, braces free', () => {
    when('[t0] it is previewed, with one glob mistyped', () => {
      const result = useThen('the preview succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            route: ROUTE,
            partition: [
              `review=src/review/**,${ROUTE}/**`,
              `route=src/route/**,${ROUTE}/**`,
              'route=src/rout/**',
            ],
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0 — the repeated slug merges, never refuses', () => {
        expect(result.code).toEqual(0);
      });

      then('it shows two partitions, never three', () => {
        expect(result.stdout).toContain('├─ review:');
        expect(result.stdout).toContain('└─ route:');
      });

      then('🔴 it flags the mistyped glob by slug', () => {
        expect(result.stdout).toContain('matched no changed file');
        expect(result.stdout).toContain('route: src/rout/**');
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('plan widened with a typo');
      });
    });

    when('[t1] it is declared with an append form', () => {
      const result = useThen('the declaration is refused', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            route: ROUTE,
            partition: ['route+=src/route/**'],
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2, and stderr prints the corrected declaration', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain("fix: --partition 'route=src/route/**'");
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('refuse append form');
      });
    });

    when('[t2] it is declared with an unclosed brace', () => {
      const result = useThen('the declaration is refused', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            route: ROUTE,
            partition: [`route={src/route/**,${ROUTE}/**`],
          },
          cwd: scene.tempDir,
        }),
      );

      then(
        'exit code is 2, and stderr prints the fix as a bare comma list',
        () => {
          expect(result.code).toEqual(2);
          expect(result.stderr).toContain(
            `fix: --partition 'route=src/route/**,${ROUTE}/**'`,
          );
        },
      );

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('refuse unclosed brace');
      });
    });
  });

  /**
   * .what = `--claim <glob> --into <slug>`: one path added to one held partition (seed S53)
   * .why = 🔴 to claim one new file once cost a re-declaration of every partition. a claim reads
   *        the held set, folds the glob into its slug, checks coverage, and writes the WHOLE set
   *        back — so the stored declaration still names the whole set (seed S46)
   */
  given('[case5b] a new file claimed into one held partition', () => {
    useBeforeAll(async () => {
      // a file the held set does not claim, under a dir no partition lists
      const absolute = path.join(scene.tempDir, 'src/extra/notes.ts');
      fs.mkdirSync(path.dirname(absolute), { recursive: true });
      fs.writeFileSync(absolute, 'export const notes = 3;\n');

      // hold a set that leaves the new file unclaimed, as a set declared before it would
      fs.mkdirSync(path.dirname(asDeclarationPath()), { recursive: true });
      fs.writeFileSync(
        asDeclarationPath(),
        JSON.stringify({ all: PARTITIONS_COVERED, byPeer: {} }),
      );
      return {};
    });

    when('[t0] the claim is previewed (the default mode)', () => {
      const result = useThen('the preview succeeds', async () => {
        const before = fs.readFileSync(asDeclarationPath(), 'utf-8');
        const output = await invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            route: ROUTE,
            claim: 'src/extra/**',
            into: 'review',
          },
          cwd: scene.tempDir,
        });
        const after = fs.readFileSync(asDeclarationPath(), 'utf-8');
        return { ...output, before, after };
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('it names the claim, and naught is written', () => {
        expect(result.stdout).toContain('src/extra/** → review');
        expect(result.stdout).toContain('naught written');
        expect(result.after).toEqual(result.before);
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('plan claim');
      });
    });

    when('[t1] the claim is applied', () => {
      const result = useThen('the write succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            route: ROUTE,
            claim: 'src/extra/**',
            into: 'review',
            mode: 'apply',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('🔴 the WHOLE set is written back, the glob folded into its slug', () => {
        expect(JSON.parse(fs.readFileSync(asDeclarationPath(), 'utf-8'))).toEqual(
          {
            all: [
              `review=src/review/**,${ROUTE}/**,src/extra/**`,
              `route={src/route/**,${ROUTE}/**}`,
            ],
            byPeer: {},
          },
        );
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('apply claim');
      });
    });

    when('[t2] the claim names a slug the scope does not hold', () => {
      const result = useThen('the claim is refused', async () => {
        const before = fs.readFileSync(asDeclarationPath(), 'utf-8');
        const output = await invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            route: ROUTE,
            claim: 'src/extra/**',
            into: 'extras',
            mode: 'apply',
          },
          cwd: scene.tempDir,
        });
        const after = fs.readFileSync(asDeclarationPath(), 'utf-8');
        return { ...output, before, after };
      });

      then('🔴 exit code is 2, and naught is written', () => {
        expect(result.code).toEqual(2);
        expect(result.after).toEqual(result.before);
      });

      then('🔴 stderr names the slug, the known slugs, and the fix', () => {
        expect(result.stderr).toContain('extras');
        expect(result.stderr).toContain('review');
        expect(result.stderr).toContain('route');
        expect(result.stderr).toContain('--into');
      });

      then('🔴 the whole-set echo prints a held brace set as a comma list', () => {
        expect(result.stderr).toContain(
          `--partition 'route=src/route/**,${ROUTE}/**'`,
        );
        expect(result.stderr).not.toMatch(/[{}]/);
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('refuse claim into unknown slug');
      });
    });
  });

  /**
   * .what = the brain-free read of one stone's coverage, before arrival
   * .why = a driver must see what the entrance gate would see — which partition claims each
   *        changed file, and any gap — with no review run and naught written
   *
   * .note = last in the suite: the stone and guard it writes are changed files under the route
   * .note = every partition is named for its domain; no catch-all (seed S52)
   */
  const STONE = '5.1.execution';
  const SET_BY_DOMAIN = [
    `review=src/review/**,src/extra/**,${ROUTE}/**`,
    `route=src/route/**,${ROUTE}/**`,
    `newdir=src/newdir/**,${ROUTE}/**`,
  ];

  given('[case6] a stone whose two reviewers read the @all set', () => {
    useBeforeAll(async () => {
      fs.writeFileSync(
        path.join(scene.tempDir, ROUTE, `${STONE}.stone`),
        '# execution\n',
      );
      fs.writeFileSync(
        path.join(scene.tempDir, ROUTE, `${STONE}.guard`),
        [
          'artifacts:',
          `  - ${STONE}*.md`,
          '',
          'reviews:',
          '  peer:',
          '    - slug: r1',
          '      level: 1',
          "      run: rhx review --rules 'x.md'",
          '    - slug: r2',
          '      level: 1',
          "      run: rhx review --rules 'y.md'",
          '',
        ].join('\n'),
      );

      // six files in one more domain, so its narrow list overflows the head cap
      Array.from({ length: 6 }, (_, index) => `src/newdir/n${index}.ts`).map(
        (relative) => {
          const absolute = path.join(scene.tempDir, relative);
          fs.mkdirSync(path.dirname(absolute), { recursive: true });
          fs.writeFileSync(absolute, `export const n = ${relative.length};\n`);
        },
      );
      const applied = await invokeRouteSkill({
        skill: 'route.guard.partition',
        args: {
          for: 'review',
          peer: '@all',
          route: ROUTE,
          partition: SET_BY_DOMAIN,
          mode: 'apply',
        },
        cwd: scene.tempDir,
      });
      // halt loud if the setup set did not land; every case below reads it
      if (applied.code !== 0)
        throw new UnexpectedCodePathError('setup apply failed', {
          stderr: applied.stderr,
          hint: 'the setup set must claim every changed file; read the stderr for the gap',
        });
      return {};
    });

    when('[t0] the stone coverage is read', () => {
      const result = useThen('the read succeeds', async () => {
        const before = fs.readFileSync(asDeclarationPath(), 'utf-8');
        const output = await invokeRouteSkill({
          skill: 'route.guard.partition',
          args: { for: 'review', peer: '@all', stone: STONE, route: ROUTE },
          cwd: scene.tempDir,
        });
        const after = fs.readFileSync(asDeclarationPath(), 'utf-8');
        return { ...output, before, after };
      });

      then('exit code is 0 — the set holds', () => {
        expect(result.code).toEqual(0);
      });

      then('it says it is a read, and names the stone and its reviewers', () => {
        expect(result.stdout).toContain('naught written, no review run');
        expect(result.stdout).toContain(`stone = ${STONE}`);
        expect(result.stdout).toContain('scope @all — read by r1, r2');
      });

      then('each partition counts and lists the files it alone claims', () => {
        expect(result.stdout).toContain('newdir: 6 narrow targets');
        expect(result.stdout).toContain('route: 2 narrow targets');
        expect(result.stdout).toContain('src/route/getRoute.ts');
        expect(result.stdout).toContain('unclaimed: 0');
      });

      then('🔴 no catch-all is celebrated — no rest text at all', () => {
        expect(result.stdout).not.toContain('fell to rest');
        expect(result.stdout).not.toContain('rest:');
      });

      then('a long list shows a head of 5, and names the remainder', () => {
        expect(result.stdout).toContain('… +1 more (--full lists every path)');
      });

      then('naught is written', () => {
        expect(result.after).toEqual(result.before);
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('read stone coverage');
      });
    });

    when('[t0b] the stone coverage is read with --full', () => {
      const result = useThen('the read succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: '@all',
            stone: STONE,
            route: ROUTE,
            full: true,
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('every path is listed, and no remainder named', () => {
        expect(result.stdout).toContain('src/route/getRoute.ts');
        expect(result.stdout).toContain('src/route/getRoute.test.ts');
        expect(result.stdout).toContain('src/newdir/n5.ts');
        expect(result.stdout).not.toContain('more (--full');
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('read stone coverage full');
      });
    });

    when('[t1] the declared set leaves a changed file unclaimed', () => {
      const result = useThen('the read reports the gap', async () => {
        // seed the gap on disk: the write path refuses such a set, so only a stale file holds one
        fs.writeFileSync(
          asDeclarationPath(),
          JSON.stringify({
            all: [`review={src/review/**,${ROUTE}/**}`],
            byPeer: {},
          }),
        );
        const before = fs.readFileSync(asDeclarationPath(), 'utf-8');
        const output = await invokeRouteSkill({
          skill: 'route.guard.partition',
          args: { for: 'review', peer: '@all', stone: STONE, route: ROUTE },
          cwd: scene.tempDir,
        });
        const after = fs.readFileSync(asDeclarationPath(), 'utf-8');
        return { ...output, before, after };
      });

      then('exit code is 2 — the entrance gate would halt here', () => {
        expect(result.code).toEqual(2);
      });

      then('stdout names the unclaimed file and the gap verdict', () => {
        expect(result.stdout).toContain('src/route/getRoute.ts');
        expect(result.stdout).toContain('verdict: gap');
      });

      then('stderr carries the repair command, as the gate prints it', () => {
        expect(result.stderr).toContain('rhx route.guard.partition');
        expect(result.stderr).toContain('--mode apply');
      });

      then('🔴 the repair names domains, never a catch-all, never a brace', () => {
        expect(result.stderr).not.toContain("'rest=");
        expect(result.stderr).not.toMatch(/--partition '[^']*[{}]/);
      });

      then('naught is written', () => {
        expect(result.after).toEqual(result.before);
      });

      then('stdout and stderr match snapshots', () => {
        expect(result.stdout).toMatchSnapshot('read stone coverage gap stdout');
        expect(result.stderr).toMatchSnapshot('read stone coverage gap stderr');
      });
    });

    when('[t2] the stone is not on the route', () => {
      const result = useThen('the read is refused', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: { for: 'review', peer: '@all', stone: '9.absent', route: ROUTE },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 2, and stderr names the stone', () => {
        expect(result.code).toEqual(2);
        expect(result.stderr).toContain('9.absent');
      });

      then('the refusal renders whole', () => {
        expect(result.stderr).toMatchSnapshot('refuse stone not found');
      });
    });

    when('[t3] an override names a peer the stone guard does not declare', () => {
      const result = useThen('the override is refused', async () => {
        const before = fs.readFileSync(asDeclarationPath(), 'utf-8');
        const output = await invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: 'r3',
            stone: STONE,
            route: ROUTE,
            partition: SET_BY_DOMAIN,
            mode: 'apply',
          },
          cwd: scene.tempDir,
        });
        const after = fs.readFileSync(asDeclarationPath(), 'utf-8');
        return { ...output, before, after };
      });

      then('🔴 exit code is 2, and naught is written', () => {
        expect(result.code).toEqual(2);
        expect(result.after).toEqual(result.before);
      });

      then('🔴 stderr names the typo and the peers the stone holds', () => {
        expect(result.stderr).toContain('✋ ConstraintError: ');
        expect(result.stderr).toContain(`peer r3 is not a reviewer of stone ${STONE}`);
        expect(result.stderr).toContain('r1, r2');
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('refuse override of unknown peer');
      });
    });

    when('[t4] an override names a stone the route does not hold', () => {
      const result = useThen('the override is refused', async () => {
        const before = fs.readFileSync(asDeclarationPath(), 'utf-8');
        const output = await invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: 'r1',
            stone: '5.1.exectuion',
            route: ROUTE,
            partition: SET_BY_DOMAIN,
            mode: 'apply',
          },
          cwd: scene.tempDir,
        });
        const after = fs.readFileSync(asDeclarationPath(), 'utf-8');
        return { ...output, before, after };
      });

      then('🔴 exit code is 2, and naught is written', () => {
        expect(result.code).toEqual(2);
        expect(result.after).toEqual(result.before);
      });

      then('🔴 stderr names the typo and the stones the route holds', () => {
        expect(result.stderr).toContain('stone 5.1.exectuion not found');
        expect(result.stderr).toContain(STONE);
      });

      then('stderr matches snapshot', () => {
        expect(result.stderr).toMatchSnapshot('refuse override of unknown stone');
      });
    });

    /**
     * .what = the positive journey of a one-reviewer override: preview, then apply
     * .why = the override was covered only by its refusals; a driver who narrows one lane on
     *        one stone must see the scope it writes, and find it on disk under that one key
     */
    when('[t5] an override for one reviewer is previewed', () => {
      const result = useThen('the preview succeeds', async () => {
        // [t1] left a gap set on disk; restore a covered @all set, so only the override varies
        fs.writeFileSync(
          asDeclarationPath(),
          JSON.stringify({ all: SET_BY_DOMAIN, byPeer: {} }),
        );
        const before = fs.readFileSync(asDeclarationPath(), 'utf-8');
        const output = await invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: 'r1',
            stone: STONE,
            route: ROUTE,
            partition: SET_BY_DOMAIN,
          },
          cwd: scene.tempDir,
        });
        const after = fs.readFileSync(asDeclarationPath(), 'utf-8');
        return { ...output, before, after };
      });

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('it names the one reviewer, its stone, and that it overrides @all', () => {
        expect(result.stdout).toContain(`peer = r1 on ${STONE} (overrides @all)`);
      });

      then('naught is written', () => {
        expect(result.after).toEqual(result.before);
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('plan override');
      });
    });

    when('[t6] the override is applied', () => {
      const result = useThen('the write succeeds', async () =>
        invokeRouteSkill({
          skill: 'route.guard.partition',
          args: {
            for: 'review',
            peer: 'r1',
            stone: STONE,
            route: ROUTE,
            partition: SET_BY_DOMAIN,
            mode: 'apply',
          },
          cwd: scene.tempDir,
        }),
      );

      then('exit code is 0', () => {
        expect(result.code).toEqual(0);
      });

      then('🔴 the set lands under that one reviewer on that one stone', () => {
        const declared = JSON.parse(fs.readFileSync(asDeclarationPath(), 'utf-8'));
        expect(declared.byPeer[`${STONE}/r1`]).toEqual(SET_BY_DOMAIN);
        expect(declared.all).toEqual(SET_BY_DOMAIN);
      });

      then('it names that it overrides @all', () => {
        expect(result.stdout).toContain('(overrides @all)');
      });

      then('stdout matches snapshot', () => {
        expect(result.stdout).toMatchSnapshot('apply override');
      });
    });
  });
});
