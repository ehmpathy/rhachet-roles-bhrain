import * as fs from 'fs';
import { UnexpectedCodePathError } from 'helpful-errors';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, useThen, when } from 'test-fns';

import { getOneRouteGuardPartitions } from './getOneRouteGuardPartitions';
import { setRouteGuardPartitions } from './setRouteGuardPartitions';
import { setRouteGuardPartitionsOfScope } from './setRouteGuardPartitionsOfScope';

const ROUTE = '.behavior/v2026_01_01.demo';
const STONE = '5.1.test';
const SCOPE_PEER = { kind: 'peer', stone: STONE, peer: 'r2' } as const;

const SET_ALL = [
  `route=src/route/**,${ROUTE}/**`,
  `review=src/review/**,${ROUTE}/**`,
];
const FILES_COVERED = [
  'src/route/a.ts',
  'src/review/c.ts',
  `${ROUTE}/0.wish.md`,
];

/**
 * .what = the stone and guard every scene's route holds — two peer reviewers, r1 and r2
 * .why = a one-reviewer override must name a stone on the route and a peer of its guard
 */
const STONE_FILES: Record<string, string> = {
  [`${ROUTE}/${STONE}.stone`]: '# test\n',
  [`${ROUTE}/${STONE}.guard`]: [
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
};

/**
 * .what = a temp git repo whose branch changes the given files, on a route with one stone
 * .why = untracked files count as since-main targets, so no commit is needed
 */
const genRepoWithChanges = (input: { slug: string; files: string[] }) =>
  useBeforeAll(async () => {
    const cwd = genTempDir({ slug: input.slug, git: true });
    for (const file of input.files) {
      fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
      fs.writeFileSync(path.join(cwd, file), `// ${file}\n`, 'utf-8');
    }
    for (const [file, content] of Object.entries(STONE_FILES)) {
      fs.mkdirSync(path.dirname(path.join(cwd, file)), { recursive: true });
      fs.writeFileSync(path.join(cwd, file), content, 'utf-8');
    }
    return { cwd };
  });

/**
 * .what = the bytes of the route's partition declaration, or null when absent
 * .why = a plan, or a refusal, must leave the declaration exactly as it found it
 */
const getDeclarationBytes = (input: { cwd: string }): string | null => {
  const file = path.join(input.cwd, ROUTE, '.route', 'partitions.json');
  if (!fs.existsSync(file)) return null;
  return fs.readFileSync(file, 'utf-8');
};

describe('setRouteGuardPartitionsOfScope', () => {
  given('[case1] a declaration that covers the branch', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-of-scope-declare',
      files: FILES_COVERED,
    });

    when('[t0] it is declared in plan mode', () => {
      const result = useThen('the plan succeeds', async () =>
        setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          mode: 'plan',
          action: { kind: 'declare', partition: SET_ALL },
        }),
      );

      then('it earns no refusal, and splits every changed file', () => {
        expect(result.refusal).toEqual(null);
        if (result.outcome?.kind !== 'split')
          throw new UnexpectedCodePathError('the outcome is not a split', {
            outcome: result.outcome,
            hint: 'the action must yield a split; check the partitions this case supplied to setRouteGuardPartitionsOfScope',
          });
        expect(result.outcome.targets.sort()).toEqual([
          'src/review/c.ts',
          'src/route/a.ts',
        ]);
        expect(result.outcome.replaced).toEqual(null);
        expect(result.outcome.claimed).toEqual(null);
      });

      then('plan writes naught', () => {
        expect(getDeclarationBytes({ cwd: scene.cwd })).toEqual(null);
      });
    });

    when('[t1] it is declared in apply mode', () => {
      const result = useThen('the apply succeeds', async () =>
        setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          mode: 'apply',
          action: { kind: 'declare', partition: SET_ALL },
        }),
      );

      then('it earns no refusal', () => {
        expect(result.refusal).toEqual(null);
      });

      then('the whole set is written for @all', async () => {
        const declared = await getOneRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
        });
        expect(declared).toEqual({ all: SET_ALL, byPeer: {} });
      });
    });
  });

  given('[case2] a declaration that leaves a changed file unclaimed', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-of-scope-declare-gap',
      files: [...FILES_COVERED, 'src/other/z.ts'],
    });

    when('[t0] it is declared in apply mode', () => {
      const result = useThen('the call returns', async () =>
        setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          mode: 'apply',
          action: { kind: 'declare', partition: SET_ALL },
        }),
      );

      then('it refuses, and names the unclaimed file', () => {
        expect(result.outcome).toEqual(null);
        expect(
          [result.refusal?.headline, ...(result.refusal?.lines ?? [])].join(
            '\n',
          ),
        ).toContain('src/other/z.ts');
      });

      then('a refusal writes naught, even on apply', () => {
        expect(getDeclarationBytes({ cwd: scene.cwd })).toEqual(null);
      });
    });
  });

  given('[case3] an override with no set of its own, and an @all set', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-of-scope-claim-from-all',
      files: [...FILES_COVERED, 'src/new/d.ts'],
    });

    when('[t0] a claim into a held slug is applied to the override', () => {
      const result = useThen('the claim succeeds', async () => {
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          partition: SET_ALL,
        });
        return setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: SCOPE_PEER,
          mode: 'apply',
          action: {
            kind: 'claim',
            claims: [{ glob: 'src/new/**', into: 'review' }],
          },
        });
      });

      then('it earns no refusal, and names the claim it made', () => {
        expect(result.refusal).toEqual(null);
        if (result.outcome?.kind !== 'split')
          throw new UnexpectedCodePathError('the outcome is not a split', {
            outcome: result.outcome,
            hint: 'the action must yield a split; check the partitions this case supplied to setRouteGuardPartitionsOfScope',
          });
        expect(result.outcome.claimed).toEqual([
          { glob: 'src/new/**', into: 'review' },
        ]);
        expect(result.outcome.replaced).toEqual(null);
      });

      then(
        '🔴 the override grew from @all, with the claim folded in',
        async () => {
          const declared = await getOneRouteGuardPartitions({
            route: ROUTE,
            cwd: scene.cwd,
          });
          const override = declared.byPeer[`${STONE}/r2`]!;
          expect(override.length).toEqual(SET_ALL.length);
          expect(override[0]).toEqual(SET_ALL[0]);
          expect(override[1]).toContain('src/new/**');
        },
      );

      then('the @all set is left as it stood', async () => {
        const declared = await getOneRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
        });
        expect(declared.all).toEqual(SET_ALL);
      });
    });
  });

  given('[case4] a held set and a claim into a slug it does not hold', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-of-scope-claim-unknown',
      files: FILES_COVERED,
    });

    when('[t0] the claim is applied', () => {
      const result = useThen('the call returns', async () => {
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          partition: SET_ALL,
        });
        const before = getDeclarationBytes({ cwd: scene.cwd });
        const returned = await setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          mode: 'apply',
          action: {
            kind: 'claim',
            claims: [{ glob: 'src/new/**', into: 'reveiw' }],
          },
        });
        return { returned, before };
      });

      then('it refuses, and a claim never creates a partition', () => {
        expect(result.returned.outcome).toEqual(null);
        expect(result.returned.refusal?.headline).toContain('--into reveiw');
        expect(result.returned.refusal?.lines.join('\n')).toContain('review');
      });

      then('a refusal writes naught', () => {
        expect(getDeclarationBytes({ cwd: scene.cwd })).toEqual(result.before);
      });
    });
  });

  given('[case5] a route with no set at all', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-of-scope-claim-none-held',
      files: FILES_COVERED,
    });

    when('[t0] a claim is applied', () => {
      const result = useThen('the call returns', async () =>
        setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: SCOPE_PEER,
          mode: 'apply',
          action: {
            kind: 'claim',
            claims: [{ glob: 'src/new/**', into: 'review' }],
          },
        }),
      );

      then('it refuses: there is no partition to claim into', () => {
        expect(result.outcome).toEqual(null);
        expect(result.refusal?.headline).toContain(
          'no partition to claim into',
        );
      });

      then('a refusal writes naught', () => {
        expect(getDeclarationBytes({ cwd: scene.cwd })).toEqual(null);
      });
    });
  });

  /**
   * .what = 🔴 CLAMP. a held set with a stale glob, unclaimed
   * .why = a stale glob once had no drop lever but a re-declaration of every partition
   */
  given('[case10] a held set with a stale glob, and a prune of it', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-of-scope-prune',
      files: FILES_COVERED,
    });
    const SET_STALE = [
      `route=src/route/**,src/gone/**,${ROUTE}/**`,
      `review=src/review/**,${ROUTE}/**`,
    ];

    when('[t0] the prune is applied', () => {
      const result = useThen('the prune succeeds', async () => {
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          partition: SET_STALE,
        });
        return setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          mode: 'apply',
          action: {
            kind: 'prune',
            prunes: [{ glob: 'src/gone/**', from: null }],
          },
        });
      });

      then('it earns no refusal, and names the prune it made', () => {
        expect(result.refusal).toEqual(null);
        if (result.outcome?.kind !== 'split')
          throw new UnexpectedCodePathError('the outcome is not a split', {
            outcome: result.outcome,
            hint: 'a prune of a held glob must yield a split',
          });
        expect(result.outcome.pruned).toEqual([
          { glob: 'src/gone/**', from: null },
        ]);
        expect(result.outcome.claimed).toEqual(null);
      });

      then(
        '🔴 the stale glob is gone, and the untouched partition keeps its bytes',
        async () => {
          const declared = await getOneRouteGuardPartitions({
            route: ROUTE,
            cwd: scene.cwd,
          });
          expect(declared.all).toEqual([
            `route=src/route/**,${ROUTE}/**`,
            SET_STALE[1],
          ]);
        },
      );
    });
  });

  given('[case11] a held set, and a prune of a glob it does not hold', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-of-scope-prune-unheld',
      files: FILES_COVERED,
    });

    when('[t0] the prune is applied', () => {
      const result = useThen('the call returns', async () => {
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          partition: SET_ALL,
        });
        const before = getDeclarationBytes({ cwd: scene.cwd });
        const returned = await setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          mode: 'apply',
          action: {
            kind: 'prune',
            prunes: [{ glob: 'src/rout/**', from: null }],
          },
        });
        return { returned, before };
      });

      then('it refuses, names the glob, and lists what is held', () => {
        expect(result.returned.outcome).toEqual(null);
        expect(result.returned.refusal?.headline).toContain(
          '--prune src/rout/**',
        );
        expect(result.returned.refusal?.lines.join('\n')).toContain(
          'src/route/**',
        );
      });

      then('a refusal writes naught', () => {
        expect(getDeclarationBytes({ cwd: scene.cwd })).toEqual(result.before);
      });
    });
  });

  given(
    '[case12] a held set, and a prune that would orphan a changed file',
    () => {
      const scene = genRepoWithChanges({
        slug: 'partition-of-scope-prune-gap',
        files: FILES_COVERED,
      });

      when('[t0] the prune is applied', () => {
        const result = useThen('the call returns', async () => {
          await setRouteGuardPartitions({
            route: ROUTE,
            cwd: scene.cwd,
            scope: { kind: 'all' },
            partition: SET_ALL,
          });
          const before = getDeclarationBytes({ cwd: scene.cwd });
          const returned = await setRouteGuardPartitionsOfScope({
            route: ROUTE,
            cwd: scene.cwd,
            scope: { kind: 'all' },
            mode: 'apply',
            action: {
              kind: 'prune',
              prunes: [{ glob: 'src/route/**', from: null }],
            },
          });
          return { returned, before };
        });

        then(
          '🔴 the whole-set check refuses, and names the orphaned file',
          () => {
            expect(result.returned.outcome).toEqual(null);
            expect(
              [
                result.returned.refusal?.headline,
                ...(result.returned.refusal?.lines ?? []),
              ].join('\n'),
            ).toContain('src/route/a.ts');
          },
        );

        then('a refusal writes naught', () => {
          expect(getDeclarationBytes({ cwd: scene.cwd })).toEqual(
            result.before,
          );
        });
      });
    },
  );

  given('[case6] an @all set declared, then cleared', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-of-scope-clear',
      files: FILES_COVERED,
    });

    when('[t0] a clear is planned', () => {
      const result = useThen('the plan succeeds', async () => {
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          partition: SET_ALL,
        });
        const before = getDeclarationBytes({ cwd: scene.cwd });
        const returned = await setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          mode: 'plan',
          action: { kind: 'clear', others: [] },
        });
        return { returned, before };
      });

      then('it names the set it would replace', () => {
        expect(result.returned.refusal).toEqual(null);
        expect(result.returned.outcome).toEqual({
          kind: 'clear',
          replaced: SET_ALL,
        });
      });

      then('plan writes naught', () => {
        expect(getDeclarationBytes({ cwd: scene.cwd })).toEqual(result.before);
      });
    });

    when('[t1] a clear beside another --partition is applied', () => {
      const result = useThen('the call returns', async () =>
        setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          mode: 'apply',
          action: { kind: 'clear', others: [SET_ALL[0]!] },
        }),
      );

      then('it refuses, since a clear stands alone', () => {
        expect(result.outcome).toEqual(null);
        expect(result.refusal?.headline).toContain(
          '--partition none clears the scope',
        );
      });

      then('the set still stands', async () => {
        const declared = await getOneRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
        });
        expect(declared.all).toEqual(SET_ALL);
      });
    });

    when('[t2] a clear is applied', () => {
      const result = useThen('the apply succeeds', async () =>
        setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'all' },
          mode: 'apply',
          action: { kind: 'clear', others: [] },
        }),
      );

      then('it names the set it replaced', () => {
        expect(result.outcome).toEqual({ kind: 'clear', replaced: SET_ALL });
      });

      then('the scope holds no set after', async () => {
        const declared = await getOneRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
        });
        expect(declared).toEqual({ all: null, byPeer: {} });
      });
    });
  });

  given('[case7] an override for a stone the route does not hold', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-of-scope-stone-unknown',
      files: FILES_COVERED,
    });

    when('[t0] it is declared in plan mode', () => {
      const result = useThen('the call returns', async () =>
        setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'peer', stone: '5.1.tset', peer: 'r2' },
          mode: 'plan',
          action: { kind: 'declare', partition: SET_ALL },
        }),
      );

      then('🔴 it refuses, and names the stone and the stones held', () => {
        expect(result.outcome).toEqual(null);
        expect(result.refusal?.headline).toContain('stone 5.1.tset not found');
        expect(result.refusal?.lines.join('\n')).toContain(STONE);
      });
    });

    when('[t1] it is declared in apply mode', () => {
      const result = useThen('the call returns', async () =>
        setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'peer', stone: '5.1.tset', peer: 'r2' },
          mode: 'apply',
          action: { kind: 'declare', partition: SET_ALL },
        }),
      );

      then('🔴 it refuses', () => {
        expect(result.outcome).toEqual(null);
        expect(result.refusal?.headline).toContain('stone 5.1.tset not found');
      });

      then('🔴 a refusal writes naught, even on apply', () => {
        expect(getDeclarationBytes({ cwd: scene.cwd })).toEqual(null);
      });
    });
  });

  given('[case8] an override for a peer the guard does not declare', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-of-scope-peer-unknown',
      files: FILES_COVERED,
    });

    when('[t0] it is declared in apply mode', () => {
      const result = useThen('the call returns', async () =>
        setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'peer', stone: STONE, peer: 'r3' },
          mode: 'apply',
          action: { kind: 'declare', partition: SET_ALL },
        }),
      );

      then('🔴 it refuses, and names the peer and the peers held', () => {
        expect(result.outcome).toEqual(null);
        expect(result.refusal?.headline).toContain(
          `peer r3 is not a reviewer of stone ${STONE}`,
        );
        expect(result.refusal?.lines.join('\n')).toContain('r1, r2');
      });

      then('🔴 a refusal writes naught, even on apply', () => {
        expect(getDeclarationBytes({ cwd: scene.cwd })).toEqual(null);
      });
    });
  });

  given('[case9] a held override whose stone has since left the route', () => {
    const scene = genRepoWithChanges({
      slug: 'partition-of-scope-clear-stale',
      files: FILES_COVERED,
    });

    when('[t0] its clear is applied', () => {
      const result = useThen('the clear succeeds', async () => {
        await setRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'peer', stone: '9.gone', peer: 'r2' },
          partition: SET_ALL,
        });
        return setRouteGuardPartitionsOfScope({
          route: ROUTE,
          cwd: scene.cwd,
          scope: { kind: 'peer', stone: '9.gone', peer: 'r2' },
          mode: 'apply',
          action: { kind: 'clear', others: [] },
        });
      });

      then('it earns no refusal, so a stale override can be cleared', () => {
        expect(result.refusal).toEqual(null);
        expect(result.outcome).toEqual({ kind: 'clear', replaced: SET_ALL });
      });

      then('the override is gone', async () => {
        const declared = await getOneRouteGuardPartitions({
          route: ROUTE,
          cwd: scene.cwd,
        });
        expect(declared.byPeer).toEqual({});
      });
    });
  });
});
