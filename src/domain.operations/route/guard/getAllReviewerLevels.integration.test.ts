import * as fs from 'fs';
import { asIsoPrice } from 'iso-price';
import * as path from 'path';
import { genTempDir, given, then, useBeforeAll, when } from 'test-fns';

import type { ReviewRunMeter } from '@src/domain.objects/Reviewer/ReviewRunMeter';
import { getAllReviewerLevels } from '@src/domain.operations/route/guard/getAllReviewerLevels';

/**
 * .what = one run that points its identity at a route + stone + slug
 * .why = the join under test reads exactly three fields off an identity, so a
 *        fixture that carries more would obscure which three it actually needs
 */
const genRun = (input: {
  dir: string;
  route: string | null;
  stone: string;
  slug: string;
}): ReviewRunMeter => ({
  dir: input.dir,
  head: null,
  brain: null,
  provider: null,
  identity: {
    route: input.route,
    stone: input.stone,
    iteration: 1,
    hash: 'abc1234',
    index: 0,
    slug: input.slug,
  },
  defect: null,
  grade: 'metered',
  scope: { rulesCount: 1, refsCount: 0, targetsCount: 1, focus: 'push' },
  tokens: { input: 1_000, cacheSet: 0, cacheGet: 0, output: 10 },
  cost: { total: asIsoPrice('USD 0.01'), cacheSaved: null },
  prompt: null,
});

/**
 * .what = writes a real guard file at `<tree>/<route>/<stone>.guard`
 * .why = the join is the risky half of this operation, and it is a
 *        filesystem act — it resolves a relative route against a tree, reads
 *        a real file, and runs the real `parseStoneGuard`. a fixture that
 *        handed in a parsed guard would test the fold a unit test already
 *        covers and say naught about the one step that can miss
 *        (rule.forbid.unit.remote-boundaries)
 */
const setOneGuard = (input: {
  tree: string;
  route: string;
  stone: string;
  body: string;
}): void => {
  const dir = path.join(input.tree, input.route);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, `${input.stone}.guard`), input.body);
};

const STONE = '5.1.execution.from_vision';
const ROUTE = '.behavior/v2026_09_18.feat-demo';

describe('getAllReviewerLevels', () => {
  given('[case1] a tree whose guard declares three lanes at two levels', () => {
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'reviewer-levels-case1' });
      setOneGuard({
        tree,
        route: ROUTE,
        stone: STONE,
        body: [
          'reviews:',
          '  peer:',
          '    - slug: repo-rules',
          '      run: rhx review --rules a',
          '      level: 1',
          '    - slug: mech-failhides',
          '      run: rhx review --rules b',
          // no `level:` — its contract says default 1, and the pour engine
          // genuinely runs it at L1. a fact, and it must read as `1`
          '    - slug: arch-smell-scopeleaks',
          '      run: rhx review --rules c',
          '      level: 3',
        ].join('\n'),
      });
      return { tree };
    });

    when('[t0] the runs of those lanes are joined', () => {
      const levels = useBeforeAll(async () => ({
        of: await getAllReviewerLevels({
          tree: scene.tree,
          runs: [
            genRun({
              dir: 'd1',
              route: ROUTE,
              stone: STONE,
              slug: 'repo-rules',
            }),
            genRun({
              dir: 'd2',
              route: ROUTE,
              stone: STONE,
              slug: 'mech-failhides',
            }),
            genRun({
              dir: 'd3',
              route: ROUTE,
              stone: STONE,
              slug: 'arch-smell-scopeleaks',
            }),
          ],
        }),
      }));

      then('a declared level is read verbatim', () => {
        expect(levels.of.levels.get('d1')).toEqual(1);
        expect(levels.of.levels.get('d3')).toEqual(3);
      });

      then('an OMITTED level reads 1 — a declared default, not a guess', () => {
        // the one nil here that is a fact. `level?:` is optional and its
        // contract says "default: 1"; the pour engine runs such a lane at
        // L1, so the meter must file it there rather than under "unknown"
        expect(levels.of.levels.get('d2')).toEqual(1);
      });

      then('the map is keyed by RUN DIR, so a caller needs no re-join', () => {
        expect([...levels.of.levels.keys()].sort()).toEqual(['d1', 'd2', 'd3']);
      });
    });

    when('[t1] a run names a slug the guard does not declare', () => {
      const levels = useBeforeAll(async () => ({
        of: await getAllReviewerLevels({
          tree: scene.tree,
          runs: [
            genRun({
              dir: 'gone',
              route: ROUTE,
              stone: STONE,
              slug: 'a-lane-since-removed',
            }),
          ],
        }),
      }));

      then('its level is ABSENT, never defaulted to 1', () => {
        // the guard read fine and simply does not carry this lane — a retired
        // reviewer whose runs are still on disk. to file it under L1 would
        // inflate L1's bill with spend nobody can attribute (rule.forbid.failhide)
        expect(levels.of.levels.has('gone')).toEqual(false);
      });
    });

    when('[t2] the SAME guard is pointed at by many runs', () => {
      const levels = useBeforeAll(async () => ({
        of: await getAllReviewerLevels({
          tree: scene.tree,
          // 11 lanes over 6 rounds point at one file in a real corpus; the read
          // is cached per guard, so this is one parse rather than six
          runs: [1, 2, 3, 4, 5, 6].map((round) =>
            genRun({
              dir: `round-${round}`,
              route: ROUTE,
              stone: STONE,
              slug: 'repo-rules',
            }),
          ),
        }),
      }));

      then('every run resolves to the same level', () => {
        for (const round of [1, 2, 3, 4, 5, 6])
          expect(levels.of.levels.get(`round-${round}`)).toEqual(1);
      });
    });
  });

  given('[case2] a run whose guard cannot be read', () => {
    const scene = useBeforeAll(async () => ({
      tree: genTempDir({ slug: 'reviewer-levels-case2' }),
    }));

    when('[t0] the route names a guard that is not on disk', () => {
      const levels = useBeforeAll(async () => ({
        of: await getAllReviewerLevels({
          tree: scene.tree,
          runs: [
            genRun({
              dir: 'd1',
              route: ROUTE,
              stone: STONE,
              slug: 'repo-rules',
            }),
          ],
        }),
      }));

      then('it answers an ABSENCE rather than a throw', () => {
        // the meter prices corpora that span archived routes and deleted
        // guards. an unreadable guard costs this axis its rows and costs the
        // report naught else — a throw here would deny a driver every other
        // figure over one absent file
        expect(levels.of.levels.has('d1')).toEqual(false);
      });
    });

    when('[t1] the run carries NO route at all', () => {
      const levels = useBeforeAll(async () => ({
        of: await getAllReviewerLevels({
          tree: scene.tree,
          runs: [
            genRun({
              dir: 'hand',
              route: null,
              stone: STONE,
              slug: 'whatever',
            }),
          ],
        }),
      }));

      then('it is skipped, because a hand run has no guard to read', () => {
        expect(levels.of.levels.has('hand')).toEqual(false);
      });
    });
  });

  given('[case3] two trees, each with its OWN guard at the same route', () => {
    // the clamp for the defect this operation shipped with: a route is
    // relative, so a join with no base resolves against the process cwd —
    // that is the tree only by coincidence. `--at <dir>` reads a tree the
    // process did not start in, and the lookup would then open the wrong
    // repo's guard and report its levels as this tree's.
    const scene = useBeforeAll(async () => {
      const here = genTempDir({ slug: 'reviewer-levels-case3-here' });
      const there = genTempDir({ slug: 'reviewer-levels-case3-there' });

      // the tree the caller did NOT ask for declares the lane at L1
      setOneGuard({
        tree: here,
        route: ROUTE,
        stone: STONE,
        body: [
          'reviews:',
          '  peer:',
          '    - slug: repo-rules',
          '      run: rhx review --rules a',
          '      level: 1',
        ].join('\n'),
      });

      // the tree the caller DID ask for declares the SAME lane at L3
      setOneGuard({
        tree: there,
        route: ROUTE,
        stone: STONE,
        body: [
          'reviews:',
          '  peer:',
          '    - slug: repo-rules',
          '      run: rhx review --rules a',
          '      level: 3',
        ].join('\n'),
      });

      return { here, there };
    });

    when('[t0] the FAR tree is the one asked for', () => {
      const levels = useBeforeAll(async () => ({
        of: await getAllReviewerLevels({
          tree: scene.there,
          runs: [
            genRun({
              dir: 'd1',
              route: ROUTE,
              stone: STONE,
              slug: 'repo-rules',
            }),
          ],
        }),
      }));

      then('the level comes from THAT tree, never from the process cwd', () => {
        // the assertion the defect fails. both guards exist, both parse, and
        // both declare the same slug — so the only quantity that parts them
        // is which base the route resolved against. `3` is the asked-for tree
        expect(levels.of.levels.get('d1')).toEqual(3);
        expect(levels.of.levels.get('d1')).not.toEqual(1);
      });
    });
  });

  given('[case4] a guard whose lane slug holds a path separator', () => {
    // the clamp for i015 r026 blocker.1: the legacy flat guard derives a slug from
    // the review command, so `.test/mock-review.sh` is a live slug. the write side
    // swaps its `/` before it builds the filename, so the meter parses the SANITIZED
    // slug off disk, and a raw-keyed level map missed it every time
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'reviewer-levels-case4' });
      setOneGuard({
        tree,
        route: ROUTE,
        stone: STONE,
        body: [
          'reviews:',
          '  peer:',
          '    - slug: .test/mock-review.sh',
          '      run: rhx review --rules a',
          '      level: 2',
        ].join('\n'),
      });
      return { tree };
    });

    when('[t0] a run names that lane by its on-disk slug', () => {
      const levels = useBeforeAll(async () => ({
        of: await getAllReviewerLevels({
          tree: scene.tree,
          runs: [
            genRun({
              dir: 'd1',
              route: ROUTE,
              stone: STONE,
              slug: '.test-mock-review.sh',
            }),
          ],
        }),
      }));

      then('its declared level is found, never read as absent', () => {
        expect(levels.of.levels.get('d1')).toEqual(2);
      });
    });
  });

  given('[case5] one malformed guard beside one healthy guard', () => {
    // the clamp for i035 r011 blocker.1: a guard is a hand-edited file, and one
    // malformed guard once threw out of the join and took the whole report down
    const STONE_BROKEN = '3.blueprint';
    const scene = useBeforeAll(async () => {
      const tree = genTempDir({ slug: 'reviewer-levels-case5' });
      setOneGuard({
        tree,
        route: ROUTE,
        stone: STONE,
        body: [
          'reviews:',
          '  peer:',
          '    - slug: repo-rules',
          '      run: rhx review --rules a',
          '      level: 2',
        ].join('\n'),
      });
      // `level: 0` is refused at parse — a BadRequestError, the malformed case
      setOneGuard({
        tree,
        route: ROUTE,
        stone: STONE_BROKEN,
        body: [
          'reviews:',
          '  peer:',
          '    - slug: repo-rules',
          '      run: rhx review --rules a',
          '      level: 0',
        ].join('\n'),
      });
      return { tree };
    });

    when('[t0] runs of both stones are joined', () => {
      const levels = useBeforeAll(async () => ({
        of: await getAllReviewerLevels({
          tree: scene.tree,
          runs: [
            genRun({
              dir: 'healthy',
              route: ROUTE,
              stone: STONE,
              slug: 'repo-rules',
            }),
            genRun({
              dir: 'broken-1',
              route: ROUTE,
              stone: STONE_BROKEN,
              slug: 'repo-rules',
            }),
            genRun({
              dir: 'broken-2',
              route: ROUTE,
              stone: STONE_BROKEN,
              slug: 'repo-rules',
            }),
          ],
        }),
      }));

      then('the healthy guard still yields its level', () => {
        expect(levels.of.levels.get('healthy')).toEqual(2);
      });

      then('the runs of the malformed guard carry no level', () => {
        expect(levels.of.levels.has('broken-1')).toEqual(false);
        expect(levels.of.levels.has('broken-2')).toEqual(false);
      });

      then('the malformed guard is named once, with why', () => {
        expect(levels.of.guardsUnread).toHaveLength(1);
        expect(levels.of.guardsUnread[0]?.path).toContain(
          `${STONE_BROKEN}.guard`,
        );
        expect(levels.of.guardsUnread[0]?.reason).toMatch(/^malformed — /);
      });

      then(
        '🔴 the reason names no error class — the caller opens the row under its own',
        () => {
          expect(levels.of.guardsUnread[0]?.reason).not.toMatch(/Error: /);
          expect(levels.of.guardsUnread[0]?.reason).toContain(
            'level must be a positive integer',
          );
        },
      );

      then('the malformed guard names the fix that clears it', () => {
        expect(levels.of.guardsUnread[0]?.fix).toContain(
          'repair the guard file',
        );
      });

      then('the reason and fix a reader sees are pinned', () => {
        expect({
          reason: levels.of.guardsUnread[0]?.reason,
          fix: levels.of.guardsUnread[0]?.fix,
        }).toMatchSnapshot();
      });
    });
  });
});
