import * as fs from 'fs/promises';
import { asIsoPriceHuman, type IsoPriceHuman } from 'iso-price';
import * as os from 'os';
import * as path from 'path';
import { given, then, useBeforeAll, when } from 'test-fns';

import type { ReviewRunMetricsRealized } from '@src/domain.objects/Reviewer/ReviewRunMetricsRealized';
import { DIR_OF_REVIEW_LOGS } from '@src/domain.operations/review/asReviewLogsDir';
import { getOneReviewRunMeterAt } from '@src/domain.operations/review/meter/getOneReviewRunMeterAt';

const NAME_OF_FIRST = '2026-09-20T00-00-00-000Z.pid1.aaa';
const NAME_OF_LAST = '2026-09-22T00-00-00-000Z.pid1.ccc';

/**
 * .what = seeds one review log dir, exactly as `stepReview` writes it
 * .why = the meter's contract is with the artifacts on disk, so the fixture must be
 *        shaped like the real ones — same filenames, same layout, same fields
 */
const setOneReviewLogDir = async (input: {
  root: string;
  name: string;
  /**
   * the MEASURED total this run cost, in the human form the artifact carries
   *
   * `IsoPriceHuman`, never `string` — the artifact declares it that way, and a
   * fixture that widened it to `string` would write a shape the reader cannot cast,
   * then pass its own assertions over a figure production would refuse
   */
  cost: IsoPriceHuman | null;
}): Promise<void> => {
  const dir = path.join(input.root, input.name);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(
    path.join(dir, 'input.args.json'),
    JSON.stringify({ args: { focus: 'push' }, scope: {} }),
    'utf-8',
  );
  await fs.writeFile(path.join(dir, 'input.prompt.md'), '# review', 'utf-8');

  // the cost is what parts the two runs, so a case can prove WHICH one was read
  // rather than merely that A run was.
  // the payload is typed as `ReviewRunMetricsRealized`, never a loose literal —
  // that interface exists because a write side and a read side declared apart once
  // turned a measured figure into a coerced `0`, and a fixture is a THIRD write
  // side. typed, a rename of any field fails this file at compile time too
  if (input.cost !== null) {
    const realized: ReviewRunMetricsRealized = {
      tokens: {
        input: 100,
        inputCacheCreation: 0,
        inputCacheRead: 0,
        output: 10,
      },
      cost: {
        input: input.cost,
        cacheWrite: asIsoPriceHuman('USD 0.00'),
        cacheRead: asIsoPriceHuman('USD 0.00'),
        output: asIsoPriceHuman('USD 0.00'),
        total: input.cost,
      },
      time: { seconds: 1 },
      supply: { provider: null, generationId: null },
      compiled: 'metrics.compiled.json',
      runaways: [],
    };
    await fs.writeFile(
      path.join(dir, 'metrics.realized.json'),
      JSON.stringify(realized),
      'utf-8',
    );
  }
};

/**
 * .what = a tree whose log root holds two runs, an older and a newer
 * .why = one run cannot part "the latest" from "the one i named" — with two, an
 *        assertion on WHICH was read is falsifiable
 */
const genOneTempTree = async (input: { slug: string }): Promise<string> => {
  const cwd = path.join(
    os.tmpdir(),
    `int-run-at-${input.slug}-${Date.now()}-${process.pid}`,
  );
  const root = path.join(cwd, DIR_OF_REVIEW_LOGS);
  await fs.mkdir(root, { recursive: true });
  await setOneReviewLogDir({
    root,
    name: NAME_OF_FIRST,
    cost: asIsoPriceHuman('USD 1.00'),
  });
  await setOneReviewLogDir({
    root,
    name: NAME_OF_LAST,
    cost: asIsoPriceHuman('USD 3.00'),
  });
  return cwd;
};

/**
 * .what = integration tests for the read that turns one `--at` into one run
 * .why = it reads the filesystem, which is a remote boundary — so this is an
 *        integration test, never a unit one (rule.forbid.unit.remote-boundaries).
 *        no mocks: the corpus is real files in a temp dir
 */
describe('getOneReviewRunMeterAt.integration', () => {
  given(
    '[case1] a tree whose log root holds an older run and a newer one',
    () => {
      const scene = useBeforeAll(async () => ({
        cwd: await genOneTempTree({ slug: 'two' }),
      }));

      when('[t0] the TREE is named', () => {
        const answer = useBeforeAll(async () => ({
          of: await getOneReviewRunMeterAt({ at: scene.cwd, withLocus: false }),
        }));

        then('the LATEST run is read — the extant behavior, unchanged', () => {
          expect(answer.of.run?.dir).toContain(NAME_OF_LAST);
          expect(answer.of.run?.cost?.total).toEqual('USD 3.00');
        });

        then('root is the log root beneath that tree', () => {
          expect(answer.of.root).toEqual(
            path.join(scene.cwd, DIR_OF_REVIEW_LOGS),
          );
        });
      });

      when('[t1] the OLDER run dir is named directly', () => {
        const answer = useBeforeAll(async () => ({
          of: await getOneReviewRunMeterAt({
            withLocus: false,
            at: path.join(scene.cwd, DIR_OF_REVIEW_LOGS, NAME_OF_FIRST),
          }),
        }));

        then('THAT run is read, never the latest', () => {
          // the assertion the whole part exists for. both runs are on disk and both
          // meter clean, so the ONLY quantity that parts them is which path was honored
          expect(answer.of.run?.dir).toContain(NAME_OF_FIRST);
          expect(answer.of.run?.cost?.total).toEqual('USD 1.00');
          expect(answer.of.run?.cost?.total).not.toEqual('USD 3.00');
        });

        then(
          'root is still the log root, so a json reader sees one sense',
          () => {
            // `root` must answer the SAME question in both branches. a run dir's root
            // is its parent by construction — `stepReview` mints every run directly
            // under it — so a consumer that reads `root` need not know which kind of
            // path the caller handed over
            expect(answer.of.root).toEqual(
              path.join(scene.cwd, DIR_OF_REVIEW_LOGS),
            );
          },
        );
      });

      when('[t2] the NEWER run dir is named directly', () => {
        const answer = useBeforeAll(async () => ({
          of: await getOneReviewRunMeterAt({
            withLocus: false,
            at: path.join(scene.cwd, DIR_OF_REVIEW_LOGS, NAME_OF_LAST),
          }),
        }));

        then('it agrees with what the tree read answers', () => {
          expect(answer.of.run?.dir).toContain(NAME_OF_LAST);
          expect(answer.of.run?.cost?.total).toEqual('USD 3.00');
        });
      });

      when('[t3] the named run dir carries a separator at its end', () => {
        const answer = useBeforeAll(async () => ({
          of: await getOneReviewRunMeterAt({
            withLocus: false,
            at: `${path.join(scene.cwd, DIR_OF_REVIEW_LOGS, NAME_OF_FIRST)}${path.sep}`,
          }),
        }));

        then('a shell tab-completion reads the same as a typed path', () => {
          expect(answer.of.run?.dir).toContain(NAME_OF_FIRST);
          expect(answer.of.run?.cost?.total).toEqual('USD 1.00');
        });
      });
    },
  );

  given('[case2] a run dir that is NOT on disk', () => {
    const scene = useBeforeAll(async () => ({
      cwd: await genOneTempTree({ slug: 'absent' }),
    }));

    when(
      '[t0] its name matches the mint but no such dir was ever written',
      () => {
        const answer = useBeforeAll(async () => ({
          of: await getOneReviewRunMeterAt({
            withLocus: false,
            at: path.join(
              scene.cwd,
              DIR_OF_REVIEW_LOGS,
              '2026-09-21T00-00-00-000Z.pid9.zzz',
            ),
          }),
        }));

        then('it answers null, so the caller can refuse', () => {
          // THE clamp of this operation. hand that path straight to
          // `getOneReviewRunMeter` and it catches every absent artifact to a null,
          // grades the result `refused` — a nil spend that is a FACT — and the command
          // renders `$0` for a run that does not exist (rule.forbid.failhide)
          expect(answer.of.run).toEqual(null);
        });

        then('root still names where it looked, so the refusal can say', () => {
          expect(answer.of.root).toEqual(
            path.join(scene.cwd, DIR_OF_REVIEW_LOGS),
          );
        });
      },
    );
  });

  given('[case3] a run dir on disk that holds no artifacts at all', () => {
    const scene = useBeforeAll(async () => {
      const cwd = await genOneTempTree({ slug: 'empty' });
      await fs.mkdir(
        path.join(cwd, DIR_OF_REVIEW_LOGS, '2026-09-21T00-00-00-000Z.pid9.eee'),
        { recursive: true },
      );
      return { cwd };
    });

    when('[t0] that dir is named', () => {
      const answer = useBeforeAll(async () => ({
        of: await getOneReviewRunMeterAt({
          withLocus: false,
          at: path.join(
            scene.cwd,
            DIR_OF_REVIEW_LOGS,
            '2026-09-21T00-00-00-000Z.pid9.eee',
          ),
        }),
      }));

      then('it is METERED, not null — the dir is there and it is empty', () => {
        // the distinction `isPathPresent` buys, and the reason it is a separate
        // question from the name. an ABSENT dir is an absence the caller refuses; a
        // PRESENT but empty dir is the legitimate state of a review that died at
        // validation, and its nil cost is a FACT the corpus should carry
        expect(answer.of.run).not.toEqual(null);
        expect(answer.of.run?.grade).toEqual('refused');
      });
    });
  });

  given('[case4] a tree with no log root at all', () => {
    const scene = useBeforeAll(async () => {
      const cwd = path.join(
        os.tmpdir(),
        `int-run-at-bare-${Date.now()}-${process.pid}`,
      );
      await fs.mkdir(cwd, { recursive: true });
      return { cwd };
    });

    when('[t0] the tree is named', () => {
      const answer = useBeforeAll(async () => ({
        of: await getOneReviewRunMeterAt({ at: scene.cwd, withLocus: false }),
      }));

      then('it answers null, so the tree refusal is reached unchanged', () => {
        expect(answer.of.run).toEqual(null);
        expect(answer.of.root).toEqual(
          path.join(scene.cwd, DIR_OF_REVIEW_LOGS),
        );
      });
    });
  });

  // an engine fault surfaces as itself through both catches, each proven with real error
  // instances and no mock of the parser: the parse allowlist in
  // asRunArtifactParseFault.test.ts, the per-run isolation in
  // asReviewRunMeterOfDefectOrRethrow.test.ts (rule.forbid.integration.mocks)

  /**
   * a run from before `metrics.compiled.json` existed, whose megabyte prompt was
   * pruned for disk and whose realized metrics were lost — yet the brain's answer
   * survives. the answer IS the proof of a bill, so `refused · $0` here would fold a
   * fake nil into every tree and grove total (rule.forbid.failhide).
   */
  given('[case6] 🔴 a run dir that holds only the brain answer', () => {
    const ANSWERS = [
      { slug: 'response', file: 'output.response.json', body: '{}' },
      { slug: 'review', file: 'output.review.md', body: '0 blockers' },
    ] as const;

    ANSWERS.map((answerOne) =>
      when(`[t0] only ${answerOne.file} survives`, () => {
        const scene = useBeforeAll(async () => {
          const cwd = await genOneTempTree({
            slug: `answer-${answerOne.slug}`,
          });
          const dir = path.join(
            cwd,
            DIR_OF_REVIEW_LOGS,
            '2026-09-21T00-00-00-000Z.pid9.fff',
          );
          await fs.mkdir(dir, { recursive: true });
          await fs.writeFile(path.join(dir, answerOne.file), answerOne.body);
          return {
            run: await getOneReviewRunMeterAt({ withLocus: false, at: dir }),
          };
        });

        then('it is UNKNOWN, never refused — the answer proves a bill', () => {
          expect(scene.run.run?.grade).toEqual('unknown');
          expect(scene.run.run?.cost).toEqual(null);
        });
      }),
    );
  });
});
