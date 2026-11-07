import * as fs from 'fs';
import * as path from 'path';
import { given, then, useThen, when } from 'test-fns';

import {
  DIR_OF_LAYOUT_FIXTURES,
  genReviewPromptLayoutInput,
} from './.test/genReviewPromptLayoutInput';
import { asPromptSectionChars } from './asPromptSectionChars';
import { compileReviewPrompt } from './compileReviewPrompt';
import { asReviewPartitionOfPrime } from './partition/asReviewPartitionOfPrime';
import { getAllTargetsAsContext } from './partition/getAllTargetsAsContext';
import { getAllTargetsOfPartition } from './partition/getAllTargetsOfPartition';

/**
 * .what = the prompt the prior layout compiled for one layout fixture
 * .why = the prior compiler is gone from the tree; its output, captured before the move,
 *        is the witness that the new layout sends the same content
 *
 * 🟡 .note = a migration witness, with a retire condition. it cannot be re-captured, so an
 *     edit to the instructions or the output contract that turns [case3] red retires it:
 *     delete [case3] then, never "fix" the fixture by hand — a hand edit would witness
 *     naught. [case4]'s prior-layout rows read a layout that still sits in log trees on
 *     disk; on such an edit, keep its per-layout parse and drop only its row equality
 */
const getOnePromptOfPriorLayout = (input: {
  of: 'whole' | 'partition';
}): string =>
  fs.readFileSync(
    path.join(DIR_OF_LAYOUT_FIXTURES, `prompt.${input.of}.before.md`),
    'utf8',
  );

/**
 * .what = a prompt cut into its `## ` sections, each trimmed, sorted
 * .why = a reorder moves whole sections and the blank lines between them. trimmed and
 *        sorted, two prompts of the same content in a new order compare equal, and a
 *        section dropped, doubled, or altered by one byte does not
 */
const getAllSectionsSorted = (input: { prompt: string }): string[] =>
  input.prompt
    .split(/\n(?=## )/)
    .map((section) => section.trim())
    .sort();

/**
 * .what = every delimited block of a prompt — rubric, refs, conversation, and each target
 *         file and diff — sorted
 * .why = a partition's target section spans two blocks in the new layout and one in the
 *        prior, so its `## ` sections cannot compare equal. its blocks can: each target
 *        rides once, in one block, in either layout
 */
const getAllBlocksSorted = (input: { prompt: string }): string[] =>
  [
    ...input.prompt.matchAll(
      // a block opens and closes at a line start; the instructions quote tags mid-line
      /^<(rules|refs|conversation)>[\s\S]*?^<\/\1>|^<target\.(file|diff)\b[^>]*?(?:\/>|>[\s\S]*?^<\/target\.\2>)/gm,
    ),
  ]
    .map((match) => match[0])
    .sort();

/**
 * .what = the `## ` header lines of a prompt, sorted
 * .why = the part of a prompt its blocks do not hold
 */
const getAllHeadersSorted = (input: { prompt: string }): string[] =>
  input.prompt
    .split('\n')
    .filter((line) => line.startsWith('## '))
    .sort();

describe('compileReviewPrompt.layout', () => {
  given('[case1] 🔴 two lanes, two rubrics, one corpus', () => {
    const base = genReviewPromptLayoutInput({ of: 'whole' });
    const laneOne = useThen('lane one compiles', () =>
      compileReviewPrompt({
        ...base,
        rules: [{ path: 'rules/rule.a.md', content: '# rule.a\n\nforbid a' }],
        refs: [],
      }),
    );
    const laneTwo = useThen('lane two compiles', () =>
      compileReviewPrompt({
        ...base,
        rules: [{ path: 'rules/rule.b.md', content: '# rule.b\n\nrequire b' }],
        refs: [{ path: 'refs/b.md', content: '# b' }],
        conversation: [],
      }),
    );

    when('[t0] both prompts are compiled', () => {
      then('🔴 they compute byte-identical heads', () => {
        expect(laneTwo.promptHead).toEqual(laneOne.promptHead);
      });

      then('the shared head carries the whole corpus', () => {
        for (const target of base.targets)
          expect(laneOne.promptHead).toContain(`path="${target.path}"`);
      });

      then('each rubric rides its own tail, never the head', () => {
        // the instructions name the tag mid-line; a block opens on a line of its own
        expect(laneOne.promptHead).not.toContain('\n<rules>\n');
        expect(laneOne.promptTail).toContain('forbid a');
        expect(laneTwo.promptTail).toContain('require b');
      });
    });
  });

  given('[case2] 🔴 two partitions of one lane', () => {
    const base = genReviewPromptLayoutInput({ of: 'partition' });
    const one = useThen('partition one compiles', () =>
      compileReviewPrompt(base),
    );
    const two = useThen('partition two compiles', () =>
      compileReviewPrompt({
        ...base,
        targets: base.targets.filter((target) => target.path !== 'src/surf.ts'),
      }),
    );

    when('[t0] both prompts are compiled', () => {
      then('they compute byte-identical heads — the shared band', () => {
        expect(two.promptHead).toEqual(one.promptHead);
        expect(one.promptHead).toContain('path="src/wave.ts"');
        expect(one.promptHead).not.toContain('path="src/surf.ts"');
      });

      then('🔴 their tails share the rubric, ahead of either own band', () => {
        const rubricOfOne = one.promptTail.slice(
          0,
          one.promptTail.indexOf('</rules>'),
        );
        expect(rubricOfOne).toContain('<rules>');
        expect(two.promptTail.startsWith(rubricOfOne)).toBe(true);
      });

      then(
        '🔴 the prime carries the head and the rubric that opens every partition tail',
        () => {
          // the prime partition comes from the real builder, and its compile input is
          // derived the way a partition run derives it (`stepReviewOfScope`): targets via
          // `getAllTargetsOfPartition`, context via `getAllTargetsAsContext`, no peers.
          // its poke sends that head and tail, so it writes the rubric to the cache too
          const partition = asReviewPartitionOfPrime({
            common: base.targetsShared ?? [],
          });
          const pathsOfPrime = getAllTargetsOfPartition({
            targets: base.targets.map((target) => target.path),
            partition,
          });
          const prime = compileReviewPrompt({
            ...base,
            targets: base.targets.filter((target) =>
              pathsOfPrime.includes(target.path),
            ),
            targetsAsContext: getAllTargetsAsContext({ partition }),
            targetsShared: partition.common,
            partitionPeers: [],
          });
          expect(pathsOfPrime).toEqual(['src/wave.ts']);
          const rubricOfOne = one.promptTail.slice(
            0,
            one.promptTail.indexOf('</rules>'),
          );
          expect(prime.promptHead).toEqual(one.promptHead);
          expect(prime.promptTail.startsWith(rubricOfOne)).toBe(true);
        },
      );
    });
  });

  given('[case3] 🔴 one input compiled both ways', () => {
    when('[t0] a whole run', () => {
      const prior = getOnePromptOfPriorLayout({ of: 'whole' });
      const { prompt } = compileReviewPrompt(
        genReviewPromptLayoutInput({ of: 'whole' }),
      );

      then('the order moved', () => {
        expect(prompt).not.toEqual(prior);
      });

      then('🔴 every section rides once, byte for byte the same', () => {
        expect(getAllSectionsSorted({ prompt })).toEqual(
          getAllSectionsSorted({ prompt: prior }),
        );
      });
    });

    when('[t1] a partition run', () => {
      const prior = getOnePromptOfPriorLayout({ of: 'partition' });
      const { prompt } = compileReviewPrompt(
        genReviewPromptLayoutInput({ of: 'partition' }),
      );

      then('🔴 every block rides once, byte for byte the same', () => {
        expect(getAllBlocksSorted({ prompt })).toEqual(
          getAllBlocksSorted({ prompt: prior }),
        );
      });

      then(
        'the headers are the prior set, plus the one that names the rest of the target',
        () => {
          const extra = getAllHeadersSorted({ prompt }).filter(
            (header) =>
              !getAllHeadersSorted({ prompt: prior }).includes(header),
          );
          expect(extra).toEqual([
            '## target, continued (THE REST OF THE <target> SECTION — REVIEW IT TOO)',
          ]);
          expect(getAllHeadersSorted({ prompt }).length).toEqual(
            getAllHeadersSorted({ prompt: prior }).length + 1,
          );
        },
      );
    });
  });

  given(
    '[case5] 🔴 every shape of prompt ends on the instruction to review',
    () => {
      const base = genReviewPromptLayoutInput({ of: 'whole' });
      const shapes = [
        { name: 'whole, with a conversation', input: base },
        { name: 'whole, first round', input: { ...base, conversation: [] } },
        {
          name: 'partition, with a conversation',
          input: genReviewPromptLayoutInput({ of: 'partition' }),
        },
        {
          name: 'partition, first round',
          input: {
            ...genReviewPromptLayoutInput({ of: 'partition' }),
            conversation: [],
          },
        },
        {
          name: 'pull, first round',
          input: { ...base, focus: 'pull' as const, conversation: [] },
        },
      ];

      when('[t0] each shape compiles', () => {
        shapes.map((shape) =>
          then(`${shape.name}: the last section is the closer`, () => {
            const { prompt } = compileReviewPrompt(shape.input);
            const sectionLast = prompt
              .trimEnd()
              .split(/\n(?=## )/)
              .at(-1)!;
            expect(sectionLast.startsWith('## now review')).toBe(true);
            expect(sectionLast).toContain('report on the target.');
          }),
        );

        then('🔴 a first round never ends on the rubric', () => {
          const { prompt } = compileReviewPrompt({ ...base, conversation: [] });
          expect(prompt.trimEnd().endsWith('</rules>')).toBe(false);
          expect(prompt.trimEnd().endsWith('</refs>')).toBe(false);
        });
      });
    },
  );

  given('[case4] 🔴 the census reads a run of each layout', () => {
    when('[t0] a prompt of either layout is parsed', () => {
      [
        { layout: 'prior', kind: 'whole' as const },
        { layout: 'prior', kind: 'partition' as const },
        { layout: 'today', kind: 'whole' as const },
        { layout: 'today', kind: 'partition' as const },
      ].map(({ layout, kind }) =>
        then(
          `the ${layout} layout of a ${kind} run sums to its prompt, with every target row read`,
          () => {
            const input = genReviewPromptLayoutInput({ of: kind });
            const prompt =
              layout === 'prior'
                ? getOnePromptOfPriorLayout({ of: kind })
                : compileReviewPrompt(input).prompt;
            const census = asPromptSectionChars({ prompt });
            expect(census).not.toBeNull();
            const sections = census!.sections;

            // every row sums to the prompt
            const total = Object.values(sections).reduce(
              (sum, chars) => sum + chars,
              0,
            );
            expect(total).toEqual(prompt.length);

            // no target chars fall into scaffold: each target row holds its bodies
            expect(sections.targetFiles).toBeGreaterThan(0);
            expect(sections['targetDiffs.additions']).toBeGreaterThan(0);
            expect(sections['targetDiffs.mutations']).toBeGreaterThan(0);
            expect(sections.rules).toBeGreaterThan(0);
            expect(sections.instructions).toBeGreaterThan(0);
            expect(sections.outputFormat).toBeGreaterThan(0);
            expect(census!.targets).toEqual(input.targets.length);
            expect(census!.attribution).not.toBeNull();
          },
        ),
      );

      then('🔴 both layouts of one input read the same rows', () => {
        for (const kind of ['whole', 'partition'] as const) {
          const prior = asPromptSectionChars({
            prompt: getOnePromptOfPriorLayout({ of: kind }),
          })!.sections;
          const today = asPromptSectionChars({
            prompt: compileReviewPrompt(
              genReviewPromptLayoutInput({ of: kind }),
            ).prompt,
          })!.sections;
          const { scaffold: scaffoldPrior, ...rowsPrior } = prior;
          const { scaffold: scaffoldToday, ...rowsToday } = today;
          expect(rowsToday).toEqual(rowsPrior);
          expect(scaffoldToday).toBeGreaterThan(0);
          expect(scaffoldPrior).toBeGreaterThan(0);
        }
      });
    });
  });
});
