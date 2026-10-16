import { rmSync } from 'fs';
import * as fs from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { DIR_OF_REVIEW_LOGS } from '@src/domain.operations/review/asReviewLogsDir';
import {
  genReviewGroveReport,
  type ReviewGroveProgress,
} from '@src/domain.operations/review/grove/genReviewGroveReport';

/**
 * .what = seeds one metered review run under a tree, exactly as `stepReview` writes it
 * .why = the report's contract is with the artifacts on disk, so the fixture must carry
 *        the same filenames and the same `--output` shape a real guard records
 */
const setOneMeteredRun = async (input: {
  tree: string;
  name: string;
  output: string;
}): Promise<void> => {
  const dir = path.join(input.tree, DIR_OF_REVIEW_LOGS, input.name);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, 'input.args.json'),
    JSON.stringify({
      args: { output: input.output, focus: 'push' },
      scope: { ruleFiles: ['a.md'], refFiles: [], targetFiles: ['x.ts'] },
    }),
    'utf-8',
  );
  await fs.writeFile(path.join(dir, 'input.prompt.md'), '# review', 'utf-8');
  await fs.writeFile(
    path.join(dir, 'metrics.realized.json'),
    JSON.stringify({
      tokens: {
        input: 100_000,
        inputCacheCreation: 0,
        inputCacheRead: 0,
        output: 1_000,
      },
      cost: { total: '$0.1000' },
    }),
    'utf-8',
  );
};

/**
 * .what = seeds one run whose `metrics.realized.json` is present and unparseable
 * .why = the shape a half-written file or a hand edit leaves behind. it is the ONE
 *        input that makes every artifact read throw, so it is what proves the
 *        per-run isolation actually holds at grove breadth.
 */
const setOneCorruptRun = async (input: {
  tree: string;
  name: string;
}): Promise<void> => {
  const dir = path.join(input.tree, DIR_OF_REVIEW_LOGS, input.name);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, 'input.args.json'),
    JSON.stringify({ args: { focus: 'push' }, scope: {} }),
    'utf-8',
  );
  await fs.writeFile(
    path.join(dir, 'metrics.realized.json'),
    '{ this is not json',
    'utf-8',
  );
};

/**
 * .what = integration tests for the grove rollup over a real tree corpus on disk
 * .why = the report walks the filesystem, which is a remote boundary — so this is an
 *        integration test, never a unit one (rule.forbid.unit.remote-boundaries).
 */
describe('genReviewGroveReport.integration', () => {
  given(
    '[case1] one tree whose runs record --output in BOTH path shapes',
    () => {
      // the regression this clamps: a guard records `--output` with whatever path
      // shape it was invoked under, so `identity.route` arrives ABSOLUTE from some runs
      // and RELATIVE from others. a bare `path.relative(tree, route)` resolves the
      // RELATIVE case against process.cwd() — the tree the MINE runs in, never the tree
      // the review ran in — so every route rendered as `../<the-miners-own-tree>/...`,
      // which attributed the whole grove to the one worktree the command ran from.
      const scene = useBeforeAll(async () => {
        const root = path.join(
          os.tmpdir(),
          `int-review-grove-${Date.now()}-${process.pid}`,
        );
        const tree = path.join(root, 'repo.beav.feat-demo');
        await fs.mkdir(tree, { recursive: true });

        const route = '.behavior/v2026_09_18.feat-demo';
        const leaf =
          '5.1.execution.from_vision._.review.i001.abc1234.r000._.given.by_peer.repo-rules.report.md';

        // the guard was invoked with a RELATIVE --output
        await setOneMeteredRun({
          tree,
          name: '2026-09-18T00-00-00-000Z.pid1.aaa',
          output: path.join(route, '.reviews', 'peer', leaf),
        });

        // and, on another round, with an ABSOLUTE one — the same route, either way
        await setOneMeteredRun({
          tree,
          name: '2026-09-18T00-00-01-000Z.pid1.bbb',
          output: path.join(tree, route, '.reviews', 'peer', leaf),
        });

        return {
          root,
          tree,
          report: await genReviewGroveReport({
            root,
            onProgress: null,
          }),
        };
      });

      when('[t0] the grove is rolled up by route', () => {
        then('both path shapes key to ONE route, never two rows', () => {
          expect(scene.report.byRoute).toHaveLength(1);
          expect(scene.report.byRoute[0]?.runs).toEqual(2);
        });

        then(
          'the route key is tree-relative, so it names the route alone',
          () => {
            expect(scene.report.byRoute[0]?.key).toEqual(
              '.behavior/v2026_09_18.feat-demo',
            );
          },
        );

        then('no route key escapes its tree with a `..` segment', () => {
          // the exact shape of the regression: `../<other-tree>/.behavior/<slug>`
          for (const row of scene.report.byRoute)
            expect(row.key).not.toContain('..');
        });

        then('the spend of both runs lands on that one route', () => {
          expect(scene.report.byRoute[0]?.tokens.input).toEqual(200_000);
        });
      });

      when('[t0b] the grove is rolled up by stone and by reviewer', () => {
        // vision case=4 [t0]: the stone and reviewer axes, read off the --output leaf
        then('both runs key to the one stone the leaf names', () => {
          expect(scene.report.byStone).toHaveLength(1);
          expect(scene.report.byStone[0]?.key).toContain('5.1.execution');
          expect(scene.report.byStone[0]?.runs).toEqual(2);
        });

        then('both runs key to the one reviewer the leaf names', () => {
          expect(scene.report.byReviewer).toHaveLength(1);
          expect(scene.report.byReviewer[0]?.key).toContain('repo-rules');
          expect(scene.report.byReviewer[0]?.runs).toEqual(2);
        });
      });

      when('[t1] the grove totals are read', () => {
        then('every run found is counted, and every one is metered', () => {
          expect(scene.report.runsFound).toEqual(2);
          expect(scene.report.census).toEqual({
            metered: 2,
            refused: 0,
            unknown: 0,
          });
        });

        then('the tree that carried the logs is reported as present', () => {
          expect(scene.report.treesWithLogs).toEqual(1);
        });
      });
    },
  );

  given('[case2] a grove root where no tree has ever reviewed', () => {
    when('[t0] the grove is rolled up', () => {
      then(
        'the cache rate is ABSENT, never a 0.0% nobody measured',
        async () => {
          const root = path.join(
            os.tmpdir(),
            `int-review-grove-empty-${Date.now()}-${process.pid}`,
          );
          await fs.mkdir(root, { recursive: true });

          const report = await genReviewGroveReport({
            root,
            onProgress: null,
          });
          expect(report.runsFound).toEqual(0);
          expect(report.rateOfCacheHit).toEqual(null);
          expect(report.byRoute).toEqual([]);
        },
      );
    });
  });

  given('🔴 [case3] a grove where ONE tree holds a corrupt artifact', () => {
    /**
     * the blocker that founded this whole behavior, asked at GROVE breadth.
     *
     * every artifact read fails loud by design — a present-but-unparseable
     * `metrics.realized.json` throws. the repair was per-run isolation inside
     * `getAllReviewRunMeters`, and it was proven at `run` breadth and at that
     * operation's own grain — and NEVER here. so `genReviewGroveReport` carried
     * zero coverage of the path, at any grain.
     *
     * the gap is not that the code is wrong today; it is shared code, and it
     * holds. the gap is that `getAllRunMetersByTree`'s per-tree read could be
     * recast — into a `Promise.all`, into a fan that re-reads, into any shape
     * that hoists the throw — and NO test would go red. a driver would find it
     * as a stack trace where a report should be, which is the exact experience
     * this behavior exists to prevent (rule.forbid.friction-hazards).
     *
     * and the isolation must hold on BOTH axes, so the corpus proves both: a
     * healthy run beside the corrupt one INSIDE one tree, and a wholly healthy
     * tree BESIDE the defective one.
     */
    const scene = useBeforeAll(async () => {
      const root = path.join(
        os.tmpdir(),
        `int-review-grove-corrupt-${Date.now()}-${process.pid}`,
      );

      const treeGood = path.join(root, 'repo.beav.feat-good');
      const treeHalf = path.join(root, 'repo.beav.feat-half');
      await fs.mkdir(treeGood, { recursive: true });
      await fs.mkdir(treeHalf, { recursive: true });

      const output = path.join(
        '.behavior/v2026_09_20.demo',
        '.reviews',
        'peer',
        '5.1.execution._.review.i001.abc1234.r000._.given.by_peer.repo-rules.report.md',
      );

      // a wholly healthy tree
      await setOneMeteredRun({
        tree: treeGood,
        name: '2026-09-20T00-00-00-000Z.pid1.aaa',
        output,
      });

      // and a tree that carries a healthy run AND a corrupt one
      await setOneMeteredRun({
        tree: treeHalf,
        name: '2026-09-20T00-00-01-000Z.pid1.bbb',
        output,
      });
      await setOneCorruptRun({
        tree: treeHalf,
        name: '2026-09-20T00-00-02-000Z.pid1.zzz',
      });

      return {
        root,
        report: await genReviewGroveReport({
          root,
          onProgress: null,
        }),
      };
    });

    when('[t0] the grove is rolled up over the mixed corpus', () => {
      then('🔴 it REPORTS — one corrupt file aborts no walk', () => {
        // the whole case in one line: the report exists at all
        expect(scene.report.runsFound).toEqual(3);
      });

      then(
        'the corrupt run is `unknown`, and the healthy two are metered',
        () => {
          expect(scene.report.census).toEqual({
            metered: 2,
            refused: 0,
            unknown: 1,
          });
        },
      );

      then('🔴 the corrupt run enters NO sum', () => {
        // an `unknown` run's spend is UNRECORDED, never zero — to fold it in as
        // zeroes would lower every figure it touches by a number nobody measured
        // (rule.forbid.failhide)
        expect(scene.report.tokens.input).toEqual(200_000);
        expect(scene.report.tokens.output).toEqual(2_000);
      });
    });

    when('[t1] the rollups are read', () => {
      then('BOTH trees are reported — the defective one is not dropped', () => {
        // a dropped tree would make the rows understate the headline, and no
        // reader could see by how much
        expect(scene.report.treesWithLogs).toEqual(2);
        expect(scene.report.byTree).toHaveLength(2);
      });

      then('🔴 the census travels WITH the row that carries the defect', () => {
        // the grove total already says "1 unknown". only the per-tree census says
        // WHICH tree a human must go look at
        const half = scene.report.byTree.find((row) =>
          row.key.includes('feat-half'),
        );
        expect(half?.runs).toEqual(2);
        expect(half?.census).toEqual({ metered: 1, refused: 0, unknown: 1 });

        const good = scene.report.byTree.find((row) =>
          row.key.includes('feat-good'),
        );
        expect(good?.census).toEqual({ metered: 1, refused: 0, unknown: 0 });
      });

      then('the healthy tree still prices, so isolation is per-RUN', () => {
        const good = scene.report.byTree.find((row) =>
          row.key.includes('feat-good'),
        );
        expect(good?.cost).not.toEqual(null);
      });
    });
  });

  given('🔴 [case3b] a grove where ONE tree`s log root is DENIED', () => {
    /**
     * the grain above [case3]. there the root read fine and one RUN was corrupt;
     * here the root ITSELF cannot be read, so `getAllEntriesInDir` rethrows the
     * denial by design, and the per-tree loop catches it — one denied tree of
     * nineteen reports its fault; the other eighteen still render.
     *
     * a root user reads a mode-000 dir regardless, so the case refuses to run as
     * root rather than pass on a denial that never happened (rule.forbid.failhide)
     */
    const scene = useBeforeAll(async () => {
      if (process.getuid?.() === 0)
        throw new BadRequestError(
          'case3b needs a non-root user — root reads a mode-000 dir, so no denial occurs',
          { uid: 0, hint: 'run the integration suite as a non-root user' },
        );

      const root = path.join(
        os.tmpdir(),
        `int-review-grove-denied-${Date.now()}-${process.pid}`,
      );
      const treeGood = path.join(root, 'repo.beav.feat-good');
      const treeDenied = path.join(root, 'repo.beav.feat-denied');
      const output = path.join(
        '.behavior/v2026_09_20.demo',
        '.reviews',
        'peer',
        '5.1.execution._.review.i001.abc1234.r000._.given.by_peer.repo-rules.report.md',
      );

      await setOneMeteredRun({
        tree: treeGood,
        name: '2026-09-20T00-00-00-000Z.pid1.aaa',
        output,
      });
      await setOneMeteredRun({
        tree: treeDenied,
        name: '2026-09-20T00-00-01-000Z.pid1.bbb',
        output,
      });

      // deny the review log root itself
      const rootDenied = path.join(treeDenied, DIR_OF_REVIEW_LOGS);
      await fs.chmod(rootDenied, 0o000);
      try {
        return {
          report: await genReviewGroveReport({
            root,
            onProgress: null,
          }),
        };
      } finally {
        // restore, so the tmp dir can be cleaned
        await fs.chmod(rootDenied, 0o755);
      }
    });

    when('[t0] the grove is rolled up', () => {
      then('🔴 it REPORTS — one denied tree aborts no walk', () => {
        expect(scene.report.runsFound).toEqual(1);
      });

      then('🔴 the denied tree is NAMED, with its fault', () => {
        expect(scene.report.treesUnreadable).toHaveLength(1);
        expect(scene.report.treesUnreadable[0]?.tree).toContain('feat-denied');
        expect(scene.report.treesUnreadable[0]?.fault).toContain('EACCES');
      });

      then('and the healthy tree still prices', () => {
        expect(scene.report.byTree).toHaveLength(1);
        expect(scene.report.byTree[0]?.key).toContain('feat-good');
        expect(scene.report.cost).not.toEqual(null);
      });
    });
  });

  given('🔴 [case3d] a grove where ONE tree vanishes mid-scan', () => {
    /**
     * the race a waved scan opens: the walk records a tree as present, then the
     * worktree is removed before its wave reaches it. the read answers the empty
     * list it keeps for a tree that never reviewed, so unnamed, that tree's whole
     * spend would drop from every sum with no discordant count.
     *
     * the removal rides the progress callback after the FIRST tree is mined — after
     * the presence snapshot, before the last tree's read. the trees are read two at
     * a time in name order, so the third (`feat-zzz`) waits for the first wave to
     * finish, which is exactly the race window
     */
    const scene = useBeforeAll(async () => {
      const root = path.join(
        os.tmpdir(),
        `int-review-grove-vanish-${Date.now()}-${process.pid}`,
      );
      const trees = [
        path.join(root, 'repo.beav.feat-aaa'),
        path.join(root, 'repo.beav.feat-mmm'),
        path.join(root, 'repo.beav.feat-zzz'),
      ];
      const treeLast = trees[2]!;
      const output = path.join(
        '.behavior/v2026_09_20.demo',
        '.reviews',
        'peer',
        '5.1.execution._.review.i001.abc1234.r000._.given.by_peer.repo-rules.report.md',
      );
      for (const tree of trees)
        await setOneMeteredRun({
          tree,
          name: '2026-09-20T00-00-00-000Z.pid1.aaa',
          output,
        });

      const vanished: string[] = [];
      const report = await genReviewGroveReport({
        root,
        onProgress: (progress) => {
          if (progress.stage !== 'mine' || progress.done !== 1) return;
          vanished.push(path.basename(treeLast));
          rmSync(path.join(treeLast, DIR_OF_REVIEW_LOGS), {
            recursive: true,
            force: true,
          });
        },
      });
      return { report, vanished };
    });

    when('[t0] the grove is rolled up', () => {
      then('the race fired — one tree lost its root mid-scan', () => {
        expect(scene.vanished).toHaveLength(1);
      });

      then(
        '🔴 the vanished tree is NAMED, never read as a metered zero',
        () => {
          expect(scene.report.treesUnreadable).toHaveLength(1);
          expect(scene.report.treesUnreadable[0]?.tree).toContain(
            scene.vanished[0],
          );
          expect(scene.report.treesUnreadable[0]?.fault).toContain('vanished');
        },
      );

      then('and the other trees still price', () => {
        expect(scene.report.runsFound).toEqual(2);
        expect(scene.report.byTree).toHaveLength(2);
      });
    });
  });

  given('🔴 [case3c] a grove whose EVERY run is unknown', () => {
    /**
     * the all-unknown grove, at the grain that DERIVES the total. the render
     * test hands `cost: null` in by hand, so it proves the renderer honors a null
     * and never that the report produces one. a recast of the derivation — a sum
     * over tree totals, a seed of `USD 0.00` for the fold — would mint `$0.00`
     * out of a corpus that proved no spend at all, and only this case goes red
     */
    const scene = useBeforeAll(async () => {
      const root = path.join(
        os.tmpdir(),
        `int-review-grove-allunknown-${Date.now()}-${process.pid}`,
      );
      const tree = path.join(root, 'repo.beav.feat-dark');
      await fs.mkdir(tree, { recursive: true });
      await setOneCorruptRun({
        tree,
        name: '2026-09-20T00-00-00-000Z.pid1.aaa',
      });
      await setOneCorruptRun({
        tree,
        name: '2026-09-20T00-00-01-000Z.pid1.bbb',
      });
      return {
        report: await genReviewGroveReport({
          root,
          onProgress: null,
        }),
      };
    });

    when('[t0] the grove is rolled up', () => {
      then('every run is graded unknown', () => {
        expect(scene.report.census).toEqual({
          metered: 0,
          refused: 0,
          unknown: 2,
        });
      });

      then('🔴 the grove cost is NULL, never USD 0.00', () => {
        expect(scene.report.cost).toEqual(null);
      });

      then('🔴 and so is the row of the tree that holds them', () => {
        expect(scene.report.byTree[0]?.cost).toEqual(null);
      });
    });
  });

  given('🔴 [case4] a caller that watches the walk', () => {
    /**
     * the defect this clamps: the walk read every review log on the machine and
     * emitted NOT ONE line until it was done — minutes of silence a human cannot
     * tell from a hang, so they ctrl-c a healthy process
     * (rule.require.status-feedback grades that a blocker; `def.frictionless`
     * names it as friction outright).
     *
     * what this does NOT clamp, stated rather than implied: that the events are
     * STREAMED rather than accumulated and flushed at the end. both shapes emit
     * the identical sequence, so no assertion over the sequence can part them.
     * what holds it is structural — `onProgress` is a plain sync callback invoked
     * inside each tree's read, and there is no accumulator in the code to batch
     * into. a reviewer must read the read, not this test, to confirm it.
     */
    const scene = useBeforeAll(async () => {
      const root = path.join(
        os.tmpdir(),
        `int-review-grove-progress-${Date.now()}-${process.pid}`,
      );

      const output = path.join(
        '.behavior/v2026_09_20.demo',
        '.reviews',
        'peer',
        '5.1.execution._.review.i001.abc1234.r000._.given.by_peer.repo-rules.report.md',
      );

      // THREE trees, and only two carry logs. the third is what proves the
      // denominator counts trees-with-logs — the set actually mined — rather than
      // trees-seen, which would stall the counter at `2/3` and read as a hang at
      // the very moment the walk finished
      for (const name of ['repo.beav.feat-one', 'repo.beav.feat-two'])
        await setOneMeteredRun({
          tree: path.join(root, name),
          name: '2026-09-20T00-00-00-000Z.pid1.aaa',
          output,
        });
      await fs.mkdir(path.join(root, 'repo.beav.feat-bare'), {
        recursive: true,
      });

      const seen: ReviewGroveProgress[] = [];
      const report = await genReviewGroveReport({
        root,
        onProgress: (progress) => seen.push(progress),
      });
      return { report, seen };
    });

    when('[t0] the walk runs to completion', () => {
      then('🔴 it SPOKE — the whole defect was that it did not', () => {
        expect(scene.seen.length).toBeGreaterThan(0);
      });

      then('the first word is the walk, before any tree is read', () => {
        expect(scene.seen[0]?.stage).toEqual('walk');
      });

      then('🔴 the last word is the fold, which closes the treestruct', () => {
        // `genReviewGroveProgressLine` renders `fold` with `└─` on the strength of
        // this ordering. if a stage is ever emitted after it, the rendered tree
        // closes mid-walk and this goes red first
        expect(scene.seen[scene.seen.length - 1]?.stage).toEqual('fold');
      });
    });

    when('[t1] the mine stage is read', () => {
      const mined = (): ReviewGroveProgress[] =>
        scene.seen.filter((one) => one.stage === 'mine');

      then('one event per tree MINED, never per tree seen', () => {
        expect(mined()).toHaveLength(2);
        expect(scene.report.trees).toHaveLength(3);
      });

      then('🔴 the counter climbs to its own denominator, and stops', () => {
        // the pair that makes the line honest: a `done` that never reaches `total`
        // reads as a stall, and a `total` that outruns the work reads as a hang at
        // the finish
        expect(mined().map((one) => one.done)).toEqual([1, 2]);
        for (const one of mined()) expect(one.total).toEqual(2);
      });

      then('each event names the tree it just finished', () => {
        const details = mined().map((one) => one.detail);
        // `1 run`, never `1 runs` — `asCountedNoun` singularizes at 1, and that
        // is the whole reason it exists. a literal written before that helper
        // landed asserts the defect it was built to remove
        expect(details).toContain('repo.beav.feat-one · 1 run');
        expect(details).toContain('repo.beav.feat-two · 1 run');
      });
    });

    when('[t2] the fold event is read', () => {
      then('its count AGREES with the report it precedes', () => {
        // a progress line that disagrees with the report printed under it is
        // worse than an absent line — a reader has two figures and no way to tell
        // which was measured (rule.require.single-source-of-truth-for-render)
        const fold = scene.seen.find((one) => one.stage === 'fold');
        expect(fold?.done).toEqual(scene.report.runsFound);
        expect(fold?.done).toEqual(2);
      });
    });
  });
});
