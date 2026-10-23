import * as fs from 'fs/promises';
import { asIsoPrice } from 'iso-price';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { DIR_OF_REVIEW_LOGS } from '@src/domain.operations/review/asReviewLogsDir';
import { genReviewMeterReport } from '@src/domain.operations/review/meter/genReviewMeterReport';
import { getAllReviewRunMeters } from '@src/domain.operations/review/meter/getAllReviewRunMeters';

/**
 * .what = seeds one review log dir, exactly as `stepReview` writes it
 * .why = the meter's contract is with the artifacts on disk, so the fixture must be
 *        shaped like the real ones — same filenames, same layout, same fields
 */
const setOneReviewLogDir = async (input: {
  root: string;
  name: string;
  args: object | null;
  realized: object | null;
  prompt: string | null;
  /** the durable stats artifact, when the run was compiled by a build that writes one */
  compiled?: object | null;
}): Promise<void> => {
  const dir = path.join(input.root, input.name);
  await fs.mkdir(dir, { recursive: true });
  if (input.args)
    await fs.writeFile(
      path.join(dir, 'input.args.json'),
      JSON.stringify(input.args),
      'utf-8',
    );
  if (input.prompt !== null)
    await fs.writeFile(
      path.join(dir, 'input.prompt.md'),
      input.prompt,
      'utf-8',
    );
  if (input.realized)
    await fs.writeFile(
      path.join(dir, 'metrics.realized.json'),
      JSON.stringify(input.realized),
      'utf-8',
    );
  if (input.compiled)
    await fs.writeFile(
      path.join(dir, 'metrics.compiled.json'),
      JSON.stringify(input.compiled),
      'utf-8',
    );
};

/**
 * .what = integration tests for the meter over a real log corpus on disk
 * .why = the meter reads the filesystem, which is a remote boundary — so this is an
 *        integration test, never a unit one (rule.forbid.unit.remote-boundaries).
 *        no mocks: the corpus is real files in a temp dir.
 */
describe('getAllReviewRunMeters.integration', () => {
  given('[case1] a log corpus that holds all three run grades', () => {
    const scene = useBeforeAll(async () => {
      const cwd = path.join(
        os.tmpdir(),
        `int-review-meter-${Date.now()}-${process.pid}`,
      );
      const root = path.join(cwd, DIR_OF_REVIEW_LOGS);
      await fs.mkdir(root, { recursive: true });

      // a fully metered guard run
      await setOneReviewLogDir({
        root,
        name: '2026-09-18T00-00-00-000Z.pid1.aaa',
        args: {
          args: {
            output:
              '.behavior/v2026_09_18.feat-demo/.reviews/peer/5.1.execution.from_vision._.review.i001.abc1234.r000._.given.by_peer.repo-rules.report.md',
            focus: 'push',
          },
          scope: {
            ruleFiles: ['a.md', 'b.md'],
            refFiles: [],
            targetFiles: ['x.ts', 'y.ts', 'z.ts'],
          },
        },
        prompt: '# review task',
        realized: {
          tokens: {
            input: 400_000,
            inputCacheCreation: 0,
            inputCacheRead: 100_000,
            output: 2_000,
          },
          cost: { total: '$0.2500' },
          supply: { provider: 'Wafer', generationId: 'gen-1' },
        },
      });

      // a run that compiled a prompt then died before it wrote metrics:
      // its spend is UNRECORDED, never zero
      await setOneReviewLogDir({
        root,
        name: '2026-09-18T00-00-01-000Z.pid1.bbb',
        args: {
          args: {
            output:
              '.behavior/v2026_09_18.feat-demo/.reviews/peer/5.1.execution.from_vision._.review.i001.abc1234.r001._.given.by_peer.mech-failhides.report.md',
            focus: 'push',
          },
          scope: { ruleFiles: ['c.md'], refFiles: [], targetFiles: ['x.ts'] },
        },
        prompt: '# review task',
        realized: null,
      });

      // a run refused at validation, before any prompt was compiled:
      // nil cost is a FACT here
      await setOneReviewLogDir({
        root,
        name: '2026-09-18T00-00-02-000Z.pid1.ccc',
        args: {
          args: {
            output:
              '.behavior/v2026_09_18.feat-demo/.reviews/peer/5.1.execution.from_vision._.review.i001.abc1234.r002._.given.by_peer.arch-smell-scopeleaks.report.md',
            focus: 'push',
          },
          scope: { ruleFiles: [], refFiles: [], targetFiles: [] },
        },
        prompt: null,
        realized: null,
      });

      return { cwd, meters: await getAllReviewRunMeters({ cwd }) };
    });

    when('[t0] the corpus is metered', () => {
      then('every log dir yields a run, none dropped', () => {
        expect(scene.meters.runs).toHaveLength(3);
      });

      then('each run is graded by what its artifacts can prove', () => {
        const byGrade = scene.meters.runs.map((run) => run.grade).sort();
        expect(byGrade).toEqual(['metered', 'refused', 'unknown']);
      });

      then('the guard identity is recovered from the --output path', () => {
        const metered = scene.meters.runs.find(
          (run) => run.grade === 'metered',
        );
        expect(metered?.identity).toEqual({
          // the route rides the --output path's grandparent, since the guard
          // writes every review under `<route>/.reviews/peer/`. it survives
          // nowhere else in the log corpus — the log dir name carries only a
          // clock, a pid, and a uuid.
          route: '.behavior/v2026_09_18.feat-demo',
          stone: '5.1.execution.from_vision',
          iteration: 1,
          hash: 'abc1234',
          index: 0,
          slug: 'repo-rules',
        });
      });

      then('the measured tokens are read from metrics.realized.json', () => {
        const metered = scene.meters.runs.find(
          (run) => run.grade === 'metered',
        );
        expect(metered?.tokens).toEqual({
          input: 400_000,
          cacheSet: 0,
          cacheGet: 100_000,
          output: 2_000,
        });
      });

      then('🔴 the served provider is read from metrics.realized.json', () => {
        const metered = scene.meters.runs.find(
          (run) => run.grade === 'metered',
        );
        expect(metered?.provider).toEqual('Wafer');
      });

      then('a run with no realized metrics reports no provider', () => {
        const unmetered = scene.meters.runs.filter(
          (run) => run.grade !== 'metered',
        );
        expect(unmetered.map((run) => run.provider)).toEqual([null, null]);
      });

      then(
        'an unknown run carries null tokens and null cost, never zeroes',
        () => {
          const unknown = scene.meters.runs.find(
            (run) => run.grade === 'unknown',
          );
          expect(unknown?.tokens).toEqual(null);
          expect(unknown?.cost).toEqual(null);
        },
      );
    });

    when('[t1] the runs are rolled into a report', () => {
      then('the cache rate is measured over the metered runs only', () => {
        const report = genReviewMeterReport({
          runs: scene.meters.runs,
          levels: new Map(),
        });
        // 100k cached of 500k prompt tokens = 20%
        expect(report.corpus.cacheHitRate).toEqual(0.2);
      });

      then('an UNMETERED lane reports absent spend, never zero', () => {
        // the run compiled a prompt then died — the brain may have been billed, so
        // no figure here is defensible
        const report = genReviewMeterReport({
          runs: scene.meters.runs,
          levels: new Map(),
        });
        const unknownLane = report.byReviewer.find(
          (bucket) => bucket.key === 'mech-failhides',
        );
        expect(unknownLane?.runs.accounted).toEqual(0);
        expect(unknownLane?.cost).toEqual(null);
        expect(unknownLane?.cacheHitRate).toEqual(null);
      });

      then('a REFUSED lane reports a known nil, never absent spend', () => {
        // the run was refused at validation before any brain call, so its nil is a
        // fact — and the two grades must not render alike
        const report = genReviewMeterReport({
          runs: scene.meters.runs,
          levels: new Map(),
        });
        const refusedLane = report.byReviewer.find(
          (bucket) => bucket.key === 'arch-smell-scopeleaks',
        );
        expect(refusedLane?.runs.accounted).toEqual(1);
        expect(refusedLane?.cost).toEqual(asIsoPrice('$0'));
        // a rate over a zero denominator stays undefined, even where spend is known
        expect(refusedLane?.cacheHitRate).toEqual(null);
      });

      then(
        'the corpus counts every run, so a total equals the sum of its rows',
        () => {
          const report = genReviewMeterReport({
            runs: scene.meters.runs,
            levels: new Map(),
          });
          expect(report.corpus.runs).toEqual({
            total: 3,
            metered: 1,
            refused: 1,
            unknown: 1,
            // metered + refused — the runs whose spend the corpus can account for
            accounted: 2,
          });
        },
      );
    });
  });

  given(
    '[case2] a corpus that spans both provenances of by-input figures',
    () => {
      /**
       * the end-to-end clamp on the compiled lane, over real files.
       *
       * a run written by a build that emits `metrics.compiled.json` must be
       * read from that artifact — exact, kilobytes — and a run from before it
       * must still be recovered by the re-parse. the census counts each
       * provenance separately, so a coarse figure never wears a precise
       * one's authority.
       */
      const scene = useBeforeAll(async () => {
        const cwd = path.join(
          os.tmpdir(),
          `int-review-meter-src-${Date.now()}-${process.pid}`,
        );
        const root = path.join(cwd, DIR_OF_REVIEW_LOGS);
        await fs.mkdir(root, { recursive: true });

        // a run from a build that writes the durable artifact. its prompt is on
        // disk too, and deliberately DISAGREES with the artifact — so the test can
        // prove which of the two the meter actually read
        await setOneReviewLogDir({
          root,
          name: '2026-09-20T00-00-00-000Z.pid1.aaa',
          args: { args: { focus: 'push' }, scope: {} },
          prompt: `<rules>${'r'.repeat(9_999)}</rules><target><target.file path="x.ts">${'F'.repeat(9_999)}</target.file></target>`,
          realized: {
            tokens: {
              input: 1_000,
              inputCacheCreation: 0,
              inputCacheRead: 0,
              output: 10,
            },
            cost: { total: '$0.0100' },
          },
          compiled: {
            prompt: { chars: 1_000, cacheable: { head: 600, tail: 400 } },
            inputs: {
              instructions: { chars: 100, count: 1, cacheable: true },
              outputFormat: { chars: 50, count: 1, cacheable: true },
              rules: { chars: 300, count: 2, cacheable: true },
              refs: { chars: 0, count: 0, cacheable: true },
              conversation: { chars: 70, count: 1, cacheable: false },
              targetDiffs: { chars: 60, count: 1, cacheable: false },
              targetFiles: { chars: 400, count: 3, cacheable: false },
              markup: { chars: 20, count: 1, cacheable: true },
            },
          },
        });

        // a run that predates the artifact — the migration path
        await setOneReviewLogDir({
          root,
          name: '2026-09-20T00-00-01-000Z.pid1.bbb',
          args: { args: { focus: 'push' }, scope: {} },
          prompt: `<rules>${'r'.repeat(300)}</rules><target><target.file path="x.ts">${'F'.repeat(400)}</target.file></target>`,
          realized: {
            tokens: {
              input: 1_000,
              inputCacheCreation: 0,
              inputCacheRead: 0,
              output: 10,
            },
            cost: { total: '$0.0100' },
          },
          compiled: null,
        });

        return { meters: await getAllReviewRunMeters({ cwd }) };
      });

      when('[t0] the corpus is metered', () => {
        const asRun = (name: string) =>
          scene.meters.runs.find((one) => one.dir.includes(name));

        then(
          '🔴 a run with the artifact is read from it, never re-parsed',
          () => {
            const run = asRun('aaa');
            expect(run?.prompt?.source).toEqual('compiled');
            // the rendered prompt beside it holds ~20,000 chars of rules and files.
            // these figures could only have come from the artifact
            expect(run?.prompt?.chars).toEqual(1_000);
            expect(run?.prompt?.sections.rules).toEqual(300);
            expect(run?.prompt?.sections.targetFiles).toEqual(400);
          },
        );

        then('the named head rows arrive as rows of their own', () => {
          expect(asRun('aaa')?.prompt?.sections.instructions).toEqual(100);
          expect(asRun('aaa')?.prompt?.sections.outputFormat).toEqual(50);
        });

        then('only the markup row folds into scaffold', () => {
          expect(asRun('aaa')?.prompt?.sections.scaffold).toEqual(20);
        });

        then(
          'the target count rides from the artifact, never a re-count',
          () => {
            expect(asRun('aaa')?.prompt?.targets).toEqual(3);
          },
        );

        then('a run that predates the artifact is still recovered', () => {
          const run = asRun('bbb');
          expect(run?.prompt?.source).toEqual('parsed');
          expect(run?.prompt?.sections.rules).toEqual(300);
        });

        then(
          '🔴 the census parts the two provenances, never blends them',
          () => {
            const sources = scene.meters.runs.map((one) => one.prompt?.source);
            expect(sources.filter((one) => one === 'compiled')).toHaveLength(1);
            expect(sources.filter((one) => one === 'parsed')).toHaveLength(1);
          },
        );
      });
    },
  );

  given('[case3] a tree where no review has ever run', () => {
    when('[t0] the corpus is metered', () => {
      then('it answers an empty corpus rather than a throw', async () => {
        const cwd = path.join(
          os.tmpdir(),
          `int-review-meter-empty-${Date.now()}-${process.pid}`,
        );
        await fs.mkdir(cwd, { recursive: true });
        const meters = await getAllReviewRunMeters({ cwd });
        expect(meters.runs).toEqual([]);
      });
    });
  });

  given('[case4] a log root that holds stray FILES beside its run dirs', () => {
    /**
     * .what = the failhide this clamps
     * .why = `getOneReviewRunMeter` grades an absent artifact `refused` — a nil spend
     *        that is a FACT — so a stray FILE neither throws nor reports absent: it
     *        enters the census as a real run with nil spend. the lie lands on the
     *        header, not the total: `runs: 4 (2 metered · 2 refused)` over a corpus
     *        of three real runs. `.filter(entry => entry.isDirectory())` is the sole
     *        guard between the two (rule.forbid.failhide, `[case1][t0]` of the cli
     *        suite).
     */
    const scene = useBeforeAll(async () => {
      const cwd = path.join(
        os.tmpdir(),
        `int-review-meter-strays-${Date.now()}-${process.pid}`,
      );
      const root = path.join(cwd, DIR_OF_REVIEW_LOGS);
      await fs.mkdir(root, { recursive: true });

      await setOneReviewLogDir({
        root,
        name: '2026-09-20T00-00-00-000Z.pid1.aaa',
        args: { args: { focus: 'push' }, scope: {} },
        prompt: '# review task',
        realized: {
          tokens: {
            input: 1_000,
            inputCacheCreation: 0,
            inputCacheRead: 0,
            output: 10,
          },
          cost: { total: '$0.0100' },
        },
      });

      // a dotfile sorts before every run dir; a plain one can sort after. neither is
      // hypothetical — the repo parks a `.gitignore` in exactly this shape under its
      // own artifact roots
      await fs.writeFile(path.join(root, '.gitignore'), '*\n', 'utf-8');
      await fs.writeFile(path.join(root, 'zz-notes.txt'), 'scratch\n', 'utf-8');

      return { meters: await getAllReviewRunMeters({ cwd }) };
    });

    when('[t0] the corpus is metered', () => {
      then('🔴 the census counts run DIRS, never every entry on disk', () => {
        // a count is the denominator every rate here is taken over, so an inflated
        // one corrupts the cache share and the grade census alike
        expect(scene.meters.runs).toHaveLength(1);
      });

      then('no stray file arrives graded as a run', () => {
        // `refused` claims a MEASURED nil, so a file graded that way reports a $0
        // nobody measured (rule.forbid.failhide)
        const grades = scene.meters.runs.map((run) => run.grade);
        expect(grades).toEqual(['metered']);
      });
    });
  });

  given('[case5] a corpus where ONE run holds a corrupt artifact', () => {
    /**
     * .what = the friction this clamps
     * .why = every artifact read fails loud by design, so a present-but-unparseable
     *        `metrics.realized.json` throws — correct alone, but unisolated: one
     *        hand-edited file among hundreds of log dirs used to abort the whole
     *        read-only report into a stack trace, with no partial coverage. the
     *        repair catches PER RUN and grades that one `unknown` — absent, excluded
     *        from every sum — so the corpus still reports and names the defective
     *        dir (rule.forbid.friction-hazards).
     */
    const scene = useBeforeAll(async () => {
      const cwd = path.join(
        os.tmpdir(),
        `int-review-meter-corrupt-${Date.now()}-${process.pid}`,
      );
      const root = path.join(cwd, DIR_OF_REVIEW_LOGS);
      await fs.mkdir(root, { recursive: true });

      await setOneReviewLogDir({
        root,
        name: '2026-09-20T00-00-00-000Z.pid1.good',
        args: { args: { focus: 'push' }, scope: {} },
        prompt: '# review task',
        realized: {
          tokens: {
            input: 1_000,
            inputCacheCreation: 0,
            inputCacheRead: 0,
            output: 10,
          },
          cost: { total: '$0.0100' },
        },
      });

      // a second run whose metrics artifact is PRESENT and unparseable — the shape a
      // half-written file or a hand edit leaves behind
      const broken = path.join(root, '2026-09-20T00-00-01-000Z.pid2.broken');
      await fs.mkdir(broken, { recursive: true });
      await fs.writeFile(
        path.join(broken, 'metrics.realized.json'),
        '{ this is not json',
        'utf-8',
      );

      // a run whose metrics parse, but state a cost.total that is no price
      await setOneReviewLogDir({
        root,
        name: '2026-09-20T00-00-02-000Z.pid3.noprice',
        args: null,
        prompt: '# review task',
        realized: {
          tokens: {
            input: 1_000,
            inputCacheCreation: 0,
            inputCacheRead: 0,
            output: 10,
          },
          cost: { total: '$abc' },
        },
      });

      // a run whose metrics hold a null token — a write-side NaN, as json stores it
      await setOneReviewLogDir({
        root,
        name: '2026-09-20T00-00-03-000Z.pid4.nulltoken',
        args: null,
        prompt: '# review task',
        realized: {
          tokens: {
            input: 1_000,
            inputCacheCreation: 0,
            inputCacheRead: null,
            output: 10,
          },
          cost: { total: '$0.0100' },
        },
      });

      return { meters: await getAllReviewRunMeters({ cwd }) };
    });

    when('[t0] the corpus is metered', () => {
      then('🔴 the report still arrives, rather than a throw', () => {
        expect(scene.meters.runs).toHaveLength(4);
      });

      then(
        '🔴 a cost.total that is no price grades only its own run unknown',
        () => {
          const bad = scene.meters.runs.find((run) =>
            run.dir.includes('noprice'),
          );
          expect(bad?.grade).toEqual('unknown');
          expect(bad?.cost).toEqual(null);
          expect(bad?.defect).toContain('no price');
        },
      );

      then('🔴 a null token is unmeasured, never metered as a 0', () => {
        const bad = scene.meters.runs.find((run) =>
          run.dir.includes('nulltoken'),
        );
        expect(bad?.grade).toEqual('unknown');
        expect(bad?.tokens).toEqual(null);
        expect(bad?.defect).toContain('not every token figure');
      });

      then('the healthy run is still metered', () => {
        const good = scene.meters.runs.find((run) => run.dir.includes('good'));
        expect(good?.grade).toEqual('metered');
        expect(good?.cost?.total).toEqual(asIsoPrice('$0.0100'));
      });

      then('🔴 the corrupt run is `unknown`, never `refused`', () => {
        // `refused` renders `$0` — a MEASURED nil — so a corrupt run graded that
        // way would enter the corpus as a run that provably cost naught, and would
        // lower the average with a figure nobody measured (rule.forbid.failhide)
        const bad = scene.meters.runs.find((run) => run.dir.includes('broken'));
        expect(bad?.grade).toEqual('unknown');
        expect(bad?.cost).toEqual(null);
        expect(bad?.tokens).toEqual(null);
      });

      then('the corrupt run NAMES the defect a human must repair', () => {
        const bad = scene.meters.runs.find((run) => run.dir.includes('broken'));
        expect(bad?.defect).toContain('metrics.realized.json');
      });

      then('the healthy run carries no defect', () => {
        const good = scene.meters.runs.find((run) => run.dir.includes('good'));
        expect(good?.defect).toEqual(null);
      });
    });
  });

  // .note = [case6] and [case7] are unused on purpose. an ordinal is a case's name and
  //         is cited from prod code (`getAllReviewRunMeters.ts` cites [case8]), so it is
  //         never reassigned to close a gap (F56)
  given('[case8] a log root that holds stray DIRS beside its run dirs', () => {
    /**
     * .what = a directory check screens a stray FILE (`[case4]`) and admits every
     *         stray DIR — a driver's own `old/`, `tmp/`, `zzz-debug/`, or a
     *         `.gitignore`d scratch dir under the log root
     * .why = each stray dir meters `refused`, which renders `$0 (nil cost is a
     *        FACT)` for a dir nobody reviewed in. the arithmetic stays sound and
     *        the harm lands on the DENOMINATOR: the run count, and every rate
     *        taken over it, is inflated by dirs that were never reviews
     *        (rule.forbid.failhide). the MINT GRAMMAR decides, so `isReviewRunDir`
     *        is the predicate — the near-miss below tests it for real:
     *        `2026-09-20T00-00-00-000Z` carries the timestamp shape and lacks the
     *        `.pid<n>.<uuid>` tail, so a loose grammar admits it. the LAST
     *        assertion guards the opposite failure — a grammar strict enough to
     *        screen the near-miss can also screen the real dir, so the corpus
     *        answers a false empty root that reads as legitimate.
     * .note = measured 2026-09-25: drop the `isReviewRunDir` filter from
     *         `getAllReviewRunMeters` and this suite goes 3 of 25 red, all three
     *         this case's own — `[case4]` stays green, so the directory check
     *         alone was never the clamp for this class.
     */
    const scene = useBeforeAll(async () => {
      const cwd = path.join(
        os.tmpdir(),
        `int-review-meter-straydirs-${Date.now()}-${process.pid}`,
      );
      const root = path.join(cwd, DIR_OF_REVIEW_LOGS);
      await fs.mkdir(root, { recursive: true });

      // the one real run
      await setOneReviewLogDir({
        root,
        name: '2026-09-20T00-00-00-000Z.pid1.aaa',
        args: { args: { focus: 'push' }, scope: {} },
        prompt: '# review task',
        realized: {
          tokens: {
            input: 1_000,
            inputCacheCreation: 0,
            inputCacheRead: 0,
            output: 10,
          },
          cost: { total: '$0.0100' },
        },
      });

      // the strays a driver leaves behind, plus the near-miss that a prefix check
      // alone would admit
      for (const name of [
        'old',
        'tmp',
        'zzz-debug',
        '.scratch',
        '2026-09-20T00-00-00-000Z',
      ])
        await fs.mkdir(path.join(root, name), { recursive: true });

      return { meters: await getAllReviewRunMeters({ cwd }) };
    });

    when('[t0] the corpus is metered', () => {
      then('🔴 only the real run enters the census', () => {
        expect(scene.meters.runs).toHaveLength(1);
      });

      then('🔴 no stray dir enters as a `refused` nil spend', () => {
        expect(scene.meters.runs.map((run) => run.grade)).toEqual(['metered']);
      });

      then('🟡 and the real run is the one that was KEPT', () => {
        expect(scene.meters.runs[0]?.dir).toContain('pid1.aaa');
      });
    });
  });

  given(
    '[case9] two cache-read runs: one whose breakdown IS its bill, one whose breakdown is a spec-rate estimate',
    () => {
      /**
       * .what = the projection this clamps
       * .why = openrouter writes a spec-rate breakdown per dimension and replaces only
       *        the total with the charge it was sent. the quotient off that breakdown is
       *        a rate card, and the card prices a cache read at the full input rate — so
       *        every such run read `saved: $0`, and every cached openrouter review read
       *        as a cache that bought naught. the bill is the only
       *        measurement; a breakdown that disagrees with it prices naught
       */
      const scene = useBeforeAll(async () => {
        const cwd = path.join(
          os.tmpdir(),
          `int-review-meter-reconcile-${Date.now()}-${process.pid}`,
        );
        const root = path.join(cwd, DIR_OF_REVIEW_LOGS);
        await fs.mkdir(root, { recursive: true });

        // a breakdown whose four parts sum to the total, to the last minor unit
        await setOneReviewLogDir({
          root,
          name: '2026-10-05T00-00-00-000Z.pid1.measured',
          args: { args: { focus: 'push' }, scope: {} },
          prompt: '# review task',
          realized: {
            tokens: {
              input: 1_000_000,
              inputCacheCreation: 0,
              inputCacheRead: 500_000,
              output: 10_000,
            },
            cost: {
              input: '$1.00',
              cacheWrite: '$0',
              cacheRead: '$0.02',
              output: '$0.10',
              total: '$1.12',
            },
          },
        });

        // verbatim from a 2026-10-05 openrouter/deepseek/flash run: the parts sum
        // to ~6x the charge, and price a cache read at the full input rate
        await setOneReviewLogDir({
          root,
          name: '2026-10-05T00-01-00-000Z.pid2.estimated',
          args: { args: { focus: 'push' }, scope: {} },
          prompt: '# review task',
          realized: {
            tokens: {
              input: 2_077,
              inputCacheCreation: 0,
              inputCacheRead: 1_280,
              output: 226,
            },
            cost: {
              input: '$0.000623100',
              cacheWrite: '$0.00',
              cacheRead: '$0.000384000',
              output: '$0.000452000',
              total: '$0.000236230',
            },
          },
        });

        return { meters: await getAllReviewRunMeters({ cwd }) };
      });

      when('[t0] the corpus is metered', () => {
        then('the reconciled run prices what its cache saved', () => {
          const run = scene.meters.runs.find((one) =>
            one.dir.includes('measured'),
          );
          expect(run?.cost?.cacheSaved).not.toBeNull();
          expect(run?.cost?.cacheSaved).toBeDefined();
        });

        then(
          '🔴 the estimated run is UNPRICED — null, never a $0 off a rate card',
          () => {
            const run = scene.meters.runs.find((one) =>
              one.dir.includes('estimated'),
            );
            expect(run?.grade).toEqual('metered');
            expect(run?.cost?.cacheSaved).toBeNull();
          },
        );

        then('🟡 and the estimated run still bills its measured total', () => {
          const run = scene.meters.runs.find((one) =>
            one.dir.includes('estimated'),
          );
          expect(run?.cost?.total).toEqual('USD 0.000_236_230');
        });
      });
    },
  );

  given(
    '[case10] a billed run whose realized metrics were lost, and whose prompt was pruned',
    () => {
      /**
       * .what = the shape a disk-conscious prune leaves behind
       * .why = the prompt is the megabyte artifact a driver prunes — so once it is
       *        gone the compiled metrics are the ONE
       *        witness left that the run got past validation. without it, this row
       *        read `refused · $0`: a measured nil over a spend nobody recorded
       *        (rule.forbid.failhide)
       */
      const scene = useBeforeAll(async () => {
        const cwd = path.join(
          os.tmpdir(),
          `int-review-meter-pruned-${Date.now()}-${process.pid}`,
        );
        const root = path.join(cwd, DIR_OF_REVIEW_LOGS);
        await fs.mkdir(root, { recursive: true });

        await setOneReviewLogDir({
          root,
          name: '2026-10-06T00-00-00-000Z.pid1.pruned',
          args: { args: { focus: 'push' }, scope: {} },
          prompt: null,
          realized: null,
          compiled: {
            prompt: { chars: 1_000, cacheable: { head: 600, tail: 400 } },
            inputs: {
              instructions: { chars: 100, count: 1, cacheable: true },
              outputFormat: { chars: 50, count: 1, cacheable: true },
              rules: { chars: 300, count: 2, cacheable: true },
              refs: { chars: 0, count: 0, cacheable: true },
              conversation: { chars: 70, count: 1, cacheable: false },
              targetDiffs: { chars: 60, count: 1, cacheable: false },
              targetFiles: { chars: 400, count: 3, cacheable: false },
              markup: { chars: 20, count: 1, cacheable: true },
            },
          },
        });

        return { meters: await getAllReviewRunMeters({ cwd }) };
      });

      when('[t0] the corpus is metered', () => {
        then('🔴 the run is UNKNOWN, never refused · $0', () => {
          expect(scene.meters.runs.map((run) => run.grade)).toEqual([
            'unknown',
          ]);
        });

        then(
          '🔴 its compiled inputs still count toward the by-input census',
          () => {
            const run = scene.meters.runs[0];
            expect(run?.prompt?.source).toEqual('compiled');
            expect(run?.prompt?.chars).toEqual(1_000);
            expect(run?.prompt?.sections.rules).toEqual(300);
          },
        );

        then('🟡 and its spend is absent from the report, never $0', () => {
          const report = genReviewMeterReport({
            runs: scene.meters.runs,
            levels: new Map(),
          });
          expect(report.corpus.runs.refused).toEqual(0);
          expect(report.corpus.runs.unknown).toEqual(1);
          expect(report.corpus.runs.accounted).toEqual(0);
        });
      });
    },
  );
});
