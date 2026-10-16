import { getError } from 'helpful-errors';
import { given, then, when } from 'test-fns';

import type { PromptInputName } from '@src/domain.objects/Reviewer/PromptComposition';
import { IS_CACHEABLE_SECTION } from '@src/domain.objects/Reviewer/PromptSectionChars';
import {
  getOnePromptComposition,
  IS_CACHEABLE,
} from '@src/domain.operations/review/getOnePromptComposition';
import {
  getOnePromptSectionCharsFromCompiled,
  SECTION_OF_INPUT,
} from '@src/domain.operations/review/meter/getOnePromptSectionCharsFromCompiled';

/**
 * .what = a real composition, as `metrics.compiled.json` would hold it
 * .why = the fold is clamped against MEASURED rows, never hand-written ones — a
 *        fixture that invented its own figures would prove the fold agrees with
 *        itself and naught about the artifact it actually reads
 */
const asCompiled = () => {
  const composition = getOnePromptComposition({
    focus: 'push',
    rules: [{ path: 'a.md', content: 'r'.repeat(300) }],
    refs: [{ path: 'b.md', content: 'f'.repeat(50) }],
    conversation: [{ path: 'c.md', content: 'c'.repeat(70) }],
    targets: [{ path: 'x.ts', content: 'F'.repeat(400), diff: 'D'.repeat(60) }],
    promptHeadStatic: `preamble\n## output format\nfmt\n## rules\n${'r'.repeat(300)}${'f'.repeat(50)}`,
    promptTailVariable: `tail${'c'.repeat(70)}${'D'.repeat(60)}${'F'.repeat(400)}`,
  });
  return { rows: composition.inputs, chars: composition.chars };
};

describe('getOnePromptSectionCharsFromCompiled', () => {
  given('[case1] the declared set of prompt inputs', () => {
    /**
     * the compile-time clamp, asserted at runtime too.
     *
     * the `Record<PromptInputName, ...>` already refuses to compile when the
     * union grows — this states the same contract in a form a reader can
     * see, and catches a map widened with a key the union never declared.
     */
    const declared: PromptInputName[] = [
      'instructions',
      'outputFormat',
      'rules',
      'refs',
      'conversation',
      'targetDiffs.additions',
      'targetDiffs.deletions',
      'targetDiffs.mutations',
      'targetFiles',
      'targetPaths',
      'markup',
    ];

    when('[t0] the fold map is read', () => {
      then('🔴 every declared input names the row it feeds', () => {
        expect(Object.keys(SECTION_OF_INPUT).sort()).toEqual(
          [...declared].sort(),
        );
      });

      then('every row it feeds is a real census row', () => {
        const rows = [
          'instructions',
          'outputFormat',
          'rules',
          'refs',
          'conversation',
          'targetDiffs.additions',
          'targetDiffs.deletions',
          'targetDiffs.mutations',
          'targetFiles',
          'scaffold',
        ];
        for (const into of Object.values(SECTION_OF_INPUT))
          expect(rows).toContain(into);
      });
    });
  });

  given('[case1d] the cache seam, declared over TWO vocabularies', () => {
    /**
     * two records of one fact, with naught to bind them — until this.
     *
     * `IS_CACHEABLE` states the seam over the nine fine inputs, and is read
     * by the compiled lane. `IS_CACHEABLE_SECTION` states the same seam over
     * the six coarse rows, and is read by the re-parse lane that serves the
     * ~2,700 runs from before the artifact. they agreed by coincidence, and
     * no assertion held them there.
     *
     * so a future input whose seam changed in one map and not the other
     * would make the `run` breadth and the parsed breadths report different
     * cache shares for one corpus — a divergence invisible without a diff of
     * two Records in two files.
     *
     * .note = the fourth instance of one species on this branch: a decision
     *         recorded twice, with no mechanism that holds the copies
     *         together. the other three were `isTargetDiffSent`, the target
     *         count, and F11.
     */
    when('[t0] each input is folded into its census row', () => {
      then('🔴 its cache seam survives the fold, for every input', () => {
        for (const [name, into] of Object.entries(SECTION_OF_INPUT)) {
          const fine = IS_CACHEABLE[name as PromptInputName];
          const coarse = IS_CACHEABLE_SECTION[into];
          // named in the failure, so a red test says WHICH input disagrees
          expect({ name, seam: fine }).toEqual({ name, seam: coarse });
        }
      });
    });
  });

  given('[case2] a compiled artifact whose rows are whole', () => {
    when('[t0] the rows are folded', () => {
      const compiled = asCompiled();
      const sections = getOnePromptSectionCharsFromCompiled({
        ...compiled,
        dir: '/tmp/whole',
      });

      then('each source row lands in its own census row', () => {
        expect(sections.rules).toEqual(300);
        expect(sections.refs).toEqual(50);
        expect(sections.conversation).toEqual(70);
        expect(sections['targetDiffs.mutations']).toEqual(60);
        expect(sections.targetFiles).toEqual(400);
      });

      then('the two named head rows land in rows of their own', () => {
        // the parsed lane cuts both at the head's markers, so the compiled lane
        // reports them by name too — a residual must never absorb a named input
        // (rule.require.distinguish-every-review-input)
        expect(sections.instructions).toEqual(compiled.rows.instructions.chars);
        expect(sections.outputFormat).toEqual(compiled.rows.outputFormat.chars);
      });

      then('only the markup folds into scaffold', () => {
        expect(sections.scaffold).toEqual(compiled.rows.markup.chars);
      });

      then('🔴 the census rows sum to the prompt, with naught dropped', () => {
        const summed = Object.values(sections).reduce(
          (sum, one) => sum + one,
          0,
        );
        expect(summed).toEqual(compiled.chars);
      });
    });
  });

  given(
    '[case2b] an artifact an OLDER compiler wrote, with one `targetDiffs` row',
    () => {
      // the archaeology: before additions moved into the diff group, a run wrote one
      // `targetDiffs` row, and it held the hunks of edited files alone
      when('[t0] the rows are folded', () => {
        const whole = asCompiled();
        const {
          'targetDiffs.additions': _additions,
          'targetDiffs.deletions': _deletions,
          'targetDiffs.mutations': mutations,
          ...others
        } = whole.rows;
        const legacy = { rows: { ...others, targetDiffs: mutations } };
        const sections = getOnePromptSectionCharsFromCompiled({
          rows: legacy.rows,
          chars: whole.chars,
          dir: '/tmp/legacy',
        });

        then('🔴 the legacy row folds into mutations, never dropped', () => {
          expect(sections['targetDiffs.mutations']).toEqual(60);
          expect(sections['targetDiffs.additions']).toEqual(0);
        });

        then('the census rows still sum to the prompt', () => {
          const summed = Object.values(sections).reduce(
            (sum, one) => sum + one,
            0,
          );
          expect(summed).toEqual(whole.chars);
        });
      });
    },
  );

  given(
    '[case3] an input measured and written, but NOT mapped to a row',
    () => {
      /**
       * proof the clamp bites, per `rule.require.clamp-edge-cases`.
       *
       * the exact artifact a future author produces: a ninth input named in
       * the union, measured by the composition, written to disk — and absent
       * from the fold map. typescript refuses that map at compile time, so
       * this case forges the artifact directly to prove the runtime half
       * catches it too.
       *
       * .note = the old reader could not catch this at all. it looked each
       *         row up by a hand-written name, so an unmapped row simply
       *         never entered the sum, and the census under-reported while
       *         every figure still looked whole.
       */
      when('[t0] the rows are folded', () => {
        const whole = asCompiled();
        const forged = {
          rows: {
            ...whole.rows,
            // 🔴 the unmapped input: 5,000 chars really rendered, really paid for
            subconscious: { chars: 5_000, count: 1, cacheable: false },
          },
          chars: whole.chars + 5_000,
        };

        then(
          '🔴 it fails loud, never a census that quietly under-reports',
          () => {
            const error = getError(() =>
              getOnePromptSectionCharsFromCompiled({
                ...forged,
                dir: '/tmp/forged',
              }),
            );
            expect(error.message).toContain(
              'do not sum to its own prompt.chars',
            );
          },
        );

        then(
          'the error names the residual, so the gap is the diagnosis',
          () => {
            const error = getError(() =>
              getOnePromptSectionCharsFromCompiled({
                ...forged,
                dir: '/tmp/forged',
              }),
            );
            expect(JSON.stringify(error)).toContain('5000');
          },
        );

        then('the error names the row that went unmapped', () => {
          const error = getError(() =>
            getOnePromptSectionCharsFromCompiled({
              ...forged,
              dir: '/tmp/forged',
            }),
          );
          // the two key sets, side by side, are the whole diagnosis: a row found on
          // disk that the fold map never declared
          expect(JSON.stringify(error)).toContain('subconscious');
        });
      });
    },
  );
});
