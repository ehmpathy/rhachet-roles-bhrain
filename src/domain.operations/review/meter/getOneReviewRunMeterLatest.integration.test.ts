import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import { DIR_OF_REVIEW_LOGS } from '@src/domain.operations/review/asReviewLogsDir';
import { getOneReviewRunMeterLatest } from '@src/domain.operations/review/meter/getOneReviewRunMeterLatest';

/**
 * .what = seeds one review log dir, exactly as `stepReview` writes it
 * .why = the meter's contract is with the artifacts on disk, so the fixture must be
 *        shaped like the real ones — same filenames, same layout, same fields
 */
const setOneReviewLogDir = async (input: {
  root: string;
  name: string;
}): Promise<void> => {
  const dir = path.join(input.root, input.name);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, 'input.args.json'),
    JSON.stringify({ args: { focus: 'push' }, scope: {} }),
    'utf-8',
  );
  await fs.writeFile(
    path.join(dir, 'input.prompt.md'),
    '# review task',
    'utf-8',
  );
};

/**
 * .what = mints an empty temp log root, and answers the cwd above it
 * .why = every case here needs the same two-step, and a drift between them would
 *        silently change which branch the case exercises
 */
const genOneTempCorpus = async (input: { slug: string }): Promise<string> => {
  const cwd = path.join(
    os.tmpdir(),
    `int-review-latest-${input.slug}-${Date.now()}-${process.pid}`,
  );
  await fs.mkdir(path.join(cwd, DIR_OF_REVIEW_LOGS), { recursive: true });
  return cwd;
};

/**
 * .what = integration tests for the `--of run` read, over a real corpus on disk
 * .why = it reads the filesystem, which is a remote boundary — so this is an
 *        integration test, never a unit one (rule.forbid.unit.remote-boundaries).
 *        no mocks: the corpus is real files in a temp dir.
 */
describe('getOneReviewRunMeterLatest.integration', () => {
  given('[case1] a log root that holds stray FILES beside its run dirs', () => {
    /**
     * .what = the failhide this clamps
     * .why = `getOneReviewRunMeter` grades an absent artifact `refused` — a nil
     *        spend that is a FACT — so a stray FILE neither throws nor reports
     *        absent: it enters the census as a real run with nil spend. at
     *        `--of run` the harm is total rather than partial, since only one
     *        row is reported — a file whose name sorts last becomes "the
     *        latest run", and the human reads `$0` for a round that was never
     *        metered. `.filter(entry => entry.isDirectory())` is the sole
     *        guard between the two (rule.forbid.failhide).
     */
    const scene = useBeforeAll(async () => {
      const cwd = await genOneTempCorpus({ slug: 'strays' });
      const root = path.join(cwd, DIR_OF_REVIEW_LOGS);

      await setOneReviewLogDir({
        root,
        name: '2026-09-20T00-00-00-000Z.pid1.aaa',
      });

      // `.` is 0x2E and a digit is 0x30, so a dotfile sorts BEFORE every run dir.
      // this one is not hypothetical — the repo parks a `.gitignore` in exactly this
      // shape under its own artifact roots
      await fs.writeFile(path.join(root, '.gitignore'), '*\n', 'utf-8');

      // and one that sorts AFTER every run dir, which is the position that decides
      // the answer here. a filter defect would hand this file back as the latest run
      await fs.writeFile(path.join(root, 'zz-notes.txt'), 'scratch\n', 'utf-8');

      return {
        cwd,
        found: await getOneReviewRunMeterLatest({ cwd, withLocus: false }),
      };
    });

    when('[t0] the latest run is metered', () => {
      then('it answers the run DIR, never a stray file', () => {
        expect(scene.found.run).not.toEqual(null);
        expect(scene.found.run?.dir).toContain('2026-09-20T00-00-00-000Z');
      });

      then('🔴 a stray file never wears a run grade', () => {
        // the precise failhide: `refused` claims a MEASURED nil, so a file graded
        // that way reports a $0 nobody measured (rule.forbid.failhide)
        expect(scene.found.run?.dir).not.toContain('zz-notes');
        expect(scene.found.run?.dir).not.toContain('.gitignore');
      });

      then('the root it read is named back, so a caller can cite it', () => {
        expect(scene.found.root).toEqual(
          path.join(scene.cwd, DIR_OF_REVIEW_LOGS),
        );
      });
    });
  });

  given('[case2] a log root that exists and holds no run dir at all', () => {
    /**
     * the branch `[case3]` of the corpus meter cannot reach: there the root itself is
     * absent, so the read fails and short-circuits. here the read SUCCEEDS and yields
     * an empty set — a distinct path, and the one a tree lands in the moment a review
     * is interrupted before it writes its dir.
     */
    const scene = useBeforeAll(async () => {
      const cwd = await genOneTempCorpus({ slug: 'empty-root' });
      await fs.writeFile(
        path.join(cwd, DIR_OF_REVIEW_LOGS, '.gitignore'),
        '*\n',
        'utf-8',
      );
      return {
        found: await getOneReviewRunMeterLatest({ cwd, withLocus: false }),
      };
    });

    when('[t0] the latest run is asked for', () => {
      then('it answers null rather than a throw', () => {
        // an empty root is the legitimate state of a tree whose review died early —
        // a fact for the caller to render, never a fault
        expect(scene.found.run).toEqual(null);
      });
    });
  });

  given('[case3] a tree where the log root was never created', () => {
    const scene = useBeforeAll(async () => {
      const cwd = path.join(
        os.tmpdir(),
        `int-review-latest-absent-${Date.now()}-${process.pid}`,
      );
      await fs.mkdir(cwd, { recursive: true });
      return {
        cwd,
        found: await getOneReviewRunMeterLatest({ cwd, withLocus: false }),
      };
    });

    when('[t0] the latest run is asked for', () => {
      then('it answers null rather than a throw', () => {
        expect(scene.found.run).toEqual(null);
      });

      then('it names the root it looked in, so the error can cite it', () => {
        // the cli prints `looked in: <root>` on its refusal, so this field is
        // load-bearing exactly when there is no run to report
        expect(scene.found.root).toEqual(
          path.join(scene.cwd, DIR_OF_REVIEW_LOGS),
        );
      });
    });
  });

  given(
    '[case4] a log root that holds a hand-made DIR beside its run dirs',
    () => {
      /**
       * .what = `[case1]`'s failhide, one step further out — and the step the
       *         dir filter does not take
       * .why = "latest" here is a lexical sort, and that is a chronological
       *        sort only for a name `genLogDirName` minted. a dir a human
       *        hand made to park a scratch artifact — `zzz-debug`, `old`,
       *        `tmp` — is a directory, so `.isDirectory()` admits it, and its
       *        letters put it after every iso stamp. it then carries no
       *        artifacts, so `getOneReviewRunMeter` grades it `refused`,
       *        which renders `$0` — a measured nil — so the human reads
       *        "this tree's last review provably cost naught" over a dir
       *        that was never a review (rule.forbid.failhide). the clamp
       *        covers the PRODUCER's mint; a hand-made dir never goes
       *        through the producer, which is exactly why it cannot see it.
       */
      const scene = useBeforeAll(async () => {
        const cwd = await genOneTempCorpus({ slug: 'handmade' });
        const root = path.join(cwd, DIR_OF_REVIEW_LOGS);

        await setOneReviewLogDir({
          root,
          name: '2026-09-20T00-00-00-000Z.pid1.aaa',
        });

        // a real DIR, so the `.isDirectory()` guard admits it, whose letters sort it
        // after every iso stamp — the position that decides the answer
        await fs.mkdir(path.join(root, 'zzz-debug'), { recursive: true });

        return {
          found: await getOneReviewRunMeterLatest({ cwd, withLocus: false }),
        };
      });

      when('[t0] the latest run is metered', () => {
        then('🔴 it answers the MINTED dir, never the hand-made one', () => {
          expect(scene.found.run?.dir).toContain('2026-09-20T00-00-00-000Z');
          expect(scene.found.run?.dir).not.toContain('zzz-debug');
        });

        then('🔴 so no scratch dir ever wears a measured $0', () => {
          // `refused` asserts a nil that is a FACT. a dir that was never a review
          // may not claim it — the grade is the whole honesty of this meter
          expect(scene.found.run?.grade).not.toEqual('refused');
        });
      });
    },
  );

  given('[case5] a log root whose LATEST run holds a corrupt artifact', () => {
    /**
     * .what = the one catch on this read that no case reached
     * .why = `getOneReviewRunMeterLatest` wraps its per-run read in a
     *        try/catch and grades a throw `unknown` via
     *        `asReviewRunMeterOfDefect` — and its own comment promises an
     *        `unknown` row that names its defect, never a stack trace with
     *        no report at all. that promise was proven at `tree` and `grove`
     *        (`getAllReviewRunMeters.integration.test.ts [case5]`) and
     *        unproven here, at the one breadth the `--of` axis was spelled
     *        to serve. the asymmetry matters more at this breadth than the
     *        other two: a corpus read reports N rows, so one corrupt row
     *        degrades a report that still arrives — this read reports ONE
     *        row, so the same throw is the whole answer.
     */
    const scene = useBeforeAll(async () => {
      const cwd = await genOneTempCorpus({ slug: 'corrupt' });
      const root = path.join(cwd, DIR_OF_REVIEW_LOGS);

      await setOneReviewLogDir({
        root,
        name: '2026-09-20T00-00-00-000Z.pid1.healthy',
      });

      // the LATEST run, and its metrics artifact is present and unparseable — the
      // shape a half-written file or a hand edit leaves behind. it must sort last,
      // or the case exercises the healthy branch and passes for the wrong reason
      const broken = path.join(root, '2026-09-20T00-00-01-000Z.pid2.broken');
      await fs.mkdir(broken, { recursive: true });
      await fs.writeFile(
        path.join(broken, 'input.args.json'),
        JSON.stringify({ args: { focus: 'push' }, scope: {} }),
        'utf-8',
      );
      await fs.writeFile(
        path.join(broken, 'metrics.realized.json'),
        '{ this is not json',
        'utf-8',
      );

      return {
        found: await getOneReviewRunMeterLatest({ cwd, withLocus: false }),
      };
    });

    when('[t0] the latest run is metered', () => {
      then('🔴 a row still arrives, rather than a throw', () => {
        expect(scene.found.run).not.toEqual(null);
      });

      then(
        '🔴 it is the CORRUPT dir — the case exercises what it claims',
        () => {
          // a lexical sort put the broken dir last. if this ever reads `healthy`,
          // every assertion below passes over the branch this case does not test
          expect(scene.found.run?.dir).toContain('broken');
        },
      );

      then('🔴 the corrupt run is `unknown`, never `refused`', () => {
        // `refused` renders `$0` — a MEASURED nil. at this breadth that single row
        // IS the report, so the misgrade would read "your last review cost naught"
        // over a run whose cost nobody could read (rule.forbid.failhide)
        expect(scene.found.run?.grade).toEqual('unknown');
        expect(scene.found.run?.cost).toEqual(null);
        expect(scene.found.run?.tokens).toEqual(null);
      });

      then('the row NAMES the defect a human must repair', () => {
        expect(scene.found.run?.defect).toContain('metrics.realized.json');
      });
    });
  });
});
