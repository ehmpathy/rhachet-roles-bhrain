import * as fs from 'fs/promises';
import { asIsoPriceHuman } from 'iso-price';
import * as os from 'os';
import * as path from 'path';
import { given, then, usePrep, useThen, when } from 'test-fns';

import { getOnePromptComposition } from './getOnePromptComposition';
import { setInputArtifacts } from './setInputArtifacts';

/**
 * .what = a composition for a fixture prompt
 * .why = the durable stats artifact is measured, never hand-written — a fixture
 *        that invented its own numbers would clamp none of the real one
 *
 * .note = 🔴 the head and tail are BUILT from the supplies they declare, rather
 *         than handed an arbitrary string. a fixture whose declared supplies
 *         outweigh its own prompt drives the residual negative, and the census
 *         refuses it — correctly, since no renderer could have produced it.
 *         `input.prompt` rides along as the preamble, so each case still names
 *         the prompt it is about.
 */
const asComposition = (input: { prompt: string }) => {
  const rules = 'r'.repeat(40);
  const conversation = 'c'.repeat(20);
  const targetFile = 'F'.repeat(60);
  const targetDiff = 'D'.repeat(10);

  return getOnePromptComposition({
    focus: 'push',
    rules: [{ path: 'rules/rule.md', content: rules }],
    refs: [],
    conversation: [{ path: 'convo.md', content: conversation }],
    targets: [{ path: 'src/valid.ts', content: targetFile, diff: targetDiff }],
    // the census cuts its head rows at the compiler's own two markers, so a
    // fixture head must carry them — a head without them is a code defect the
    // census refuses (`getOneHeadMarkerOffsets`), never a shape to clamp
    promptHeadStatic: `${input.prompt}\n## output format\nfmt\n## rules\n${rules}`,
    promptTailVariable: `${conversation}${targetDiff}${targetFile}`,
  });
};

describe('setInputArtifacts', () => {
  given('[case1] valid input artifacts', () => {
    const scene = usePrep(async () => {
      const logDir = path.join(
        os.tmpdir(),
        `bhrain-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      return { logDir };
    });

    when('[t0] setInputArtifacts is called', () => {
      then('creates log directory if not exists', async () => {
        const result = await setInputArtifacts({
          logDir: scene.logDir,
          args: {
            rules: 'rules/*.md',
            paths: 'src/*.ts',
            output: '/tmp/review.md',
            focus: 'push',
            goal: 'representative',
            polluters: 'drop',
            join: 'intersect',
            brain: 'openrouter/deepseek/flash',
            optional: [],
            partitions: [],
            partition: null,
          },
          scope: {
            ruleFiles: ['rules/rule.no-console.md', 'rules/rule.no-any.md'],
            refFiles: [],
            conversationFiles: [],
            targetFiles: ['src/valid.ts', 'src/invalid.ts'],
          },
          metrics: {
            tokenEstimate: 1500,
            contextWindowPercent: 15,
            costEstimate: asIsoPriceHuman('USD 0.0045'),
          },
          prompt: '# review prompt\n\nreview these files...',
          composition: asComposition({
            prompt: '# review prompt\n\nreview these files...',
          }),
        });

        // verify directory was created
        const stats = await fs.stat(scene.logDir);
        expect(stats.isDirectory()).toBe(true);

        // verify files were created
        expect(result.argsPath).toContain('input.args.json');
        expect(result.promptPath).toContain('input.prompt.md');
      });

      then('writes input.args.json with correct schema', async () => {
        await setInputArtifacts({
          logDir: scene.logDir,
          args: {
            rules: 'rules/*.md',
            diffs: 'since-main',
            paths: ['src/*.ts', 'lib/*.ts'],
            output: '/tmp/review.md',
            focus: 'pull',
            goal: 'representative',
            polluters: 'drop',
            join: 'intersect',
            brain: 'openrouter/deepseek/flash',
            optional: [],
            partitions: [],
            partition: null,
          },
          scope: {
            ruleFiles: ['rules/rule.no-console.md'],
            refFiles: [],
            conversationFiles: [],
            targetFiles: ['src/index.ts'],
          },
          metrics: {
            tokenEstimate: 500,
            contextWindowPercent: 5,
            costEstimate: asIsoPriceHuman('USD 0.0015'),
          },
          prompt: 'test prompt',
          composition: asComposition({ prompt: 'test prompt' }),
        });

        const argsPath = path.join(scene.logDir, 'input.args.json');
        const argsContent = await fs.readFile(argsPath, 'utf-8');
        const argsJson = JSON.parse(argsContent);

        expect(argsJson.args).toEqual({
          rules: 'rules/*.md',
          diffs: 'since-main',
          paths: ['src/*.ts', 'lib/*.ts'],
          output: '/tmp/review.md',
          focus: 'pull',
          goal: 'representative',
          polluters: 'drop',
          join: 'intersect',
          brain: 'openrouter/deepseek/flash',
          optional: [],
          partitions: [],
          partition: null,
        });
        expect(argsJson.scope).toEqual({
          ruleFiles: ['rules/rule.no-console.md'],
          refFiles: [],
          conversationFiles: [],
          targetFiles: ['src/index.ts'],
        });
        expect(argsJson.metrics).toEqual({
          tokenEstimate: 500,
          contextWindowPercent: 5,
          costEstimate: '$0.001500',
        });
      });

      then('writes input.prompt.md with exact prompt content', async () => {
        const promptContent = `# code review

## rules
- no console.log
- no any type

## files to review
- src/index.ts
- src/utils.ts
`;
        await setInputArtifacts({
          logDir: scene.logDir,
          args: {
            rules: 'rules/*.md',
            output: '/tmp/review.md',
            focus: 'push',
            goal: 'representative',
            polluters: 'drop',
            join: 'intersect',
            brain: 'openrouter/deepseek/flash',
            optional: [],
            partitions: [],
            partition: null,
          },
          scope: {
            ruleFiles: ['rules/rule.no-console.md'],
            refFiles: [],
            conversationFiles: [],
            targetFiles: ['src/index.ts', 'src/utils.ts'],
          },
          metrics: {
            tokenEstimate: 800,
            contextWindowPercent: 8,
            costEstimate: asIsoPriceHuman('USD 0.0024'),
          },
          prompt: promptContent,
          composition: asComposition({ prompt: promptContent }),
        });

        const promptPath = path.join(scene.logDir, 'input.prompt.md');
        const writtenPrompt = await fs.readFile(promptPath, 'utf-8');

        expect(writtenPrompt).toEqual(promptContent);
      });
    });
  });

  given('[case2] a review whose prompt was compiled', () => {
    /**
     * 🔴 the durable stats artifact is the whole point of the upgrade: a corpus
     * study must read kilobytes per run, never re-parse a megabyte prompt.
     *
     * .note = it is written HERE, beside the prompt, rather than beside the
     *         realized metrics — so a run that compiled and then died still
     *         carries its composition. that run is graded `unknown`: its spend is
     *         unrecorded forever, and its INPUTS are known exactly.
     */
    const scene = usePrep(async () => {
      const logDir = path.join(
        os.tmpdir(),
        `bhrain-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      );
      const prompt = '# review prompt\n\nreview these files...';
      const composition = asComposition({ prompt });

      const result = await setInputArtifacts({
        logDir,
        args: {
          rules: 'rules/*.md',
          paths: 'src/*.ts',
          output: '/tmp/review.md',
          focus: 'push',
          goal: 'representative',
          polluters: 'drop',
          join: 'intersect',
          brain: 'openrouter/deepseek/flash',
          optional: [],
          partitions: [],
          partition: null,
        },
        scope: {
          ruleFiles: ['rules/rule.md'],
          refFiles: [],
          conversationFiles: [],
          targetFiles: ['src/valid.ts'],
        },
        metrics: {
          tokenEstimate: 1500,
          contextWindowPercent: 15,
          costEstimate: asIsoPriceHuman('USD 0.0045'),
        },
        prompt,
        composition,
      });

      return { logDir, composition, result };
    });

    when('[t0] the artifacts are written', () => {
      then('metrics.compiled.json lands beside the prompt', async () => {
        expect(scene.result.compiledPath).toContain('metrics.compiled.json');
        const stats = await fs.stat(scene.result.compiledPath);
        expect(stats.isFile()).toBe(true);
      });

      // 🔴 read and parsed ONCE, then shared. six adjacent assertions each opened
      // the same artifact from disk and re-parsed it to grade a different facet —
      // the row set, the row shape, the round trip, the cache seam, the scope, and
      // the key set (rule.forbid.redundant-expensive-operations).
      //
      // ⚠️ and one facet in particular wanted a single object rather than six:
      // *"the rows survive the json round trip intact"* is a claim about ONE
      // document. graded against its own private re-read, it could have passed
      // while a neighbour's read saw a different file
      const compiled = useThen('the artifact parses', async () =>
        JSON.parse(await fs.readFile(scene.result.compiledPath, 'utf-8')),
      );

      then('every named input carries its own row', async () => {
        // 🔴 the row set is read from the measured composition, never from a
        //    hand-written list — else a new input could be added and skipped here
        expect(Object.keys(compiled.inputs).sort()).toEqual(
          Object.keys(scene.composition.inputs).sort(),
        );
      });

      then(
        'each row states its mass, its count, and its cache seam',
        async () => {
          for (const row of Object.values<{
            chars: number;
            count: number;
            cacheable: boolean;
          }>(compiled.inputs)) {
            expect(typeof row.chars).toEqual('number');
            expect(typeof row.count).toEqual('number');
            expect(typeof row.cacheable).toEqual('boolean');
          }
        },
      );

      then('🔴 the rows survive the json round trip intact', async () => {
        const summed = Object.values<{ chars: number }>(compiled.inputs).reduce(
          (sum, one) => sum + one.chars,
          0,
        );

        expect(summed).toEqual(compiled.prompt.chars);
        expect(compiled.prompt.chars).toEqual(scene.composition.chars);
      });

      then(
        'the cache seam rides to disk, so a lever can be priced',
        async () => {
          expect(compiled.prompt.cacheable.head).toEqual(
            scene.composition.cacheable.head,
          );
          expect(compiled.prompt.cacheable.tail).toEqual(
            scene.composition.cacheable.tail,
          );
        },
      );

      then(
        'the scope counts ride along, so a row needs no second read',
        async () => {
          expect(compiled.scope).toEqual({
            rules: 1,
            refs: 0,
            targets: 1,
            conversation: 0,
          });
          expect(compiled.args).toEqual({
            focus: 'push',
            goal: 'representative',
          });
        },
      );

      /**
       * 🔴 the clamp on the measured/projected seam.
       *
       * .why = an `estimate` triple — `{ tokenEstimate, contextWindowPercent,
       *        costEstimate }`, computed off `estimateTokenCount` and a hardcoded
       *        "output is ~10% of input" guess — once rode in this file under a
       *        bare key, beside rows counted off real bytes.
       *
       *        `getOneReviewRunMeter` reads this artifact and promises *"no
       *        estimate can ever enter a reported figure"*. that promise rested
       *        on its cast, which omitted the key by luck rather than by intent —
       *        so a later author who widened the cast to reach one more row would
       *        have broken it and seen no test go red.
       *
       * .note = it asserts the KEY is absent, never that some value is wrong. a
       *         figure that must not exist cannot be checked by its value, and
       *         `toBeUndefined` on a nested read would pass just as happily for
       *         a typo in the path (`rule.forbid.failhide`) — so the key set of
       *         the object is asserted whole.
       */
      then(
        '🔴 NO projected figure rides in the measured artifact',
        async () => {
          expect(Object.keys(compiled).sort()).toEqual([
            'args',
            'inputs',
            'locus',
            'prompt',
            'scope',
          ]);
        },
      );

      then(
        '🔴 the locus row is written even where the prompt places no target, as null — never omitted, never []',
        async () => {
          // this prompt carries no section markers, so the walk cannot place a
          // target. `null` is UNREAD; `[]` would claim the walk placed none
          expect(compiled.locus).toBeNull();
        },
      );

      /**
       * 🔴 and the estimate is not LOST — it is re-homed, never dropped.
       *
       * .why = a clamp that asserts an absence alone invites the next author to
       *        read the repair as *"we stopped to record it"*. the replay artifact
       *        still carries all three figures, and `metrics.expected.json` — the
       *        file NAMED for them — owns them for a human.
       */
      then('the projection still rides in the replay record', async () => {
        const args = JSON.parse(
          await fs.readFile(scene.result.argsPath, 'utf-8'),
        );

        expect(args.metrics).toEqual({
          tokenEstimate: 1500,
          contextWindowPercent: 15,
          costEstimate: '$0.004500',
        });
      });
    });
  });
});
