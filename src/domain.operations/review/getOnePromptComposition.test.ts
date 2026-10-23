import { getError, given, then, when } from 'test-fns';

import type {
  PromptComposition,
  PromptInputName,
} from '@src/domain.objects/Reviewer/PromptComposition';
import {
  getOneAttributionGrade,
  HINT_OF_UNATTRIBUTED,
} from '@src/domain.operations/review/getOneAttributionGrade';
import { BOUND_OF_MARKUP_SHARE } from '@src/domain.operations/review/getOneAttributionGradeOfMarkup';
import { getOnePromptComposition } from '@src/domain.operations/review/getOnePromptComposition';

/**
 * .what = sums every input's chars
 * .why = the exhaustiveness invariant is asserted from the map itself, never from
 *        a hand-written list of keys — else a new input could be added to the
 *        union and skipped here, which is the very drift this clamps
 */
const asSummed = (input: { composition: PromptComposition }): number =>
  Object.values(input.composition.inputs).reduce(
    (sum, one) => sum + one.chars,
    0,
  );

/**
 * .what = the measurement a HelpfulError carries, read back off its message
 * .why = `helpful-errors@1.5.3` appends its metadata to the message as a json
 *        tail rather than exposes it as a field, so a case that asserts on the
 *        FIGURES — rather than merely on their presence — must read that tail.
 *
 * .note = it is named rather than inlined so the one place that knows this
 *         serialization detail is one place (rule.require.named-transformers).
 */
const asCarriedMeasurement = <TCarried>(input: { error: Error }): TCarried => {
  const at = input.error.message.indexOf('\n{');
  return JSON.parse(input.error.message.slice(at + 1));
};

/**
 * .what = clamps the study instrument: every char lands in exactly one input
 * .why = the whole point is attribution. an input that double-counts or drops
 *        chars yields a corpus study whose percentages do not sum, and a reader
 *        cannot tell a real result from an arithmetic defect.
 */
describe('getOnePromptComposition', () => {
  given('[case1] a prompt with every input populated', () => {
    const rules = [
      { path: 'a.md', content: 'r'.repeat(100) },
      { path: 'b.md', content: 'r'.repeat(200) },
    ];
    const refs = [{ path: 'c.md', content: 'f'.repeat(50) }];
    const conversation = [{ path: 'd.md', content: 'c'.repeat(70) }];
    const targets = [
      { path: 'x.ts', content: 'F'.repeat(400), diff: 'D'.repeat(60) },
      { path: 'y.ts', content: 'F'.repeat(300), diff: 'D'.repeat(40) },
    ];

    when('[t0] the composition is measured', () => {
      const composition = getOnePromptComposition({
        focus: 'push',
        rules,
        refs,
        conversation,
        targets,
        promptHeadStatic: `preamble\n## output format\nfmt\n## rules\n${'r'.repeat(300)}${'f'.repeat(50)}`,
        promptTailVariable: `tail${'c'.repeat(70)}${'D'.repeat(100)}${'F'.repeat(700)}`,
      });

      then('each source input is summed by content chars', () => {
        expect(composition.inputs.rules.chars).toEqual(300);
        expect(composition.inputs.refs.chars).toEqual(50);
        expect(composition.inputs.conversation.chars).toEqual(70);
      });

      then('diffs and files are counted SEPARATELY', () => {
        // 🔴 the split the study turns on: a diff is the delta under review, a
        //    file is context around it. lumped together, the corpus cannot say
        //    whether the lever is the delta or the context.
        expect(composition.inputs['targetDiffs.mutations'].chars).toEqual(100);
        expect(composition.inputs.targetFiles.chars).toEqual(700);
      });

      then('the output-format block is sized from its own span', () => {
        expect(composition.inputs.outputFormat.chars).toBeGreaterThan(0);
      });

      then('counts ride along, so per-file averages need no raw corpus', () => {
        expect(composition.inputs.rules.count).toEqual(2);
        expect(composition.inputs.refs.count).toEqual(1);
        expect(composition.inputs.conversation.count).toEqual(1);
        expect(composition.inputs.targetFiles.count).toEqual(2);
      });

      then('each input states which side of the cache seam it sat on', () => {
        expect(composition.inputs.rules.cacheable).toEqual(true);
        expect(composition.inputs.conversation.cacheable).toEqual(false);
        expect(composition.inputs['targetDiffs.mutations'].cacheable).toEqual(
          false,
        );
        expect(composition.inputs.targetFiles.cacheable).toEqual(true);
      });

      then('🔴 the inputs are EXHAUSTIVE — they sum to the prompt', () => {
        expect(asSummed({ composition })).toEqual(composition.chars);
      });

      then('🔴 markup stays render overhead, never an unnamed input', () => {
        // the detector. every char of this fixture is attributed to a named
        // input, so all markup may hold is the headers between them
        expect(getOneAttributionGrade({ composition })).toEqual('attributed');
      });
    });
  });

  given('[case1b] a partition run that carries targets as context only', () => {
    const targetsAsContext = ['src/shared/types.ts', 'src/shared/consts.ts'];
    const charsOfContextPaths = targetsAsContext.join('').length;

    when('[t0] the composition is measured under push', () => {
      const composition = getOnePromptComposition({
        focus: 'push',
        rules: [{ path: 'a.md', content: 'r'.repeat(100) }],
        refs: [],
        conversation: [],
        targets: [{ path: 'x.ts', content: 'F'.repeat(400) }],
        targetsAsContext,
        promptHeadStatic: `preamble\n## output format\nfmt\n## rules\n${'r'.repeat(100)}`,
        promptTailVariable: `tail${'F'.repeat(400)}\n## context only\n${targetsAsContext.map((path) => `- ${path}`).join('\n')}`,
      });

      then(
        '🔴 the context-only paths land in targetPaths, never markup',
        () => {
          // push sends no path list of its own, so every targetPaths char here is
          // a context-only path
          expect(composition.inputs.targetPaths.chars).toEqual(
            charsOfContextPaths,
          );
        },
      );

      then('the inputs still sum to the prompt', () => {
        expect(asSummed({ composition })).toEqual(composition.chars);
      });
    });
  });

  given('[case2] a target whose content is absent', () => {
    when('[t0] the composition is measured', () => {
      const composition = getOnePromptComposition({
        focus: 'push',
        rules: [],
        refs: [],
        conversation: [],
        targets: [{ path: 'gone.ts', content: null, diff: null }],
        promptHeadStatic: 'preamble\n## output format\nfmt\n## rules\n',
        promptTailVariable: 'tail',
      });

      then('an absent body counts as zero, never as a crash', () => {
        // a deleted target carries neither diff nor content; it must not throw
        expect(composition.inputs.targetFiles.chars).toEqual(0);
        expect(composition.inputs['targetDiffs.mutations'].chars).toEqual(0);
      });

      then(
        'a body that is absent is not counted as a file that was sent',
        () => {
          expect(composition.inputs.targetFiles.count).toEqual(0);
          expect(composition.inputs['targetDiffs.mutations'].count).toEqual(0);
        },
      );

      then('🔴 the inputs still sum to the prompt', () => {
        expect(asSummed({ composition })).toEqual(composition.chars);
      });
    });
  });

  given('[case3] a head whose inputs sum to less than its length', () => {
    when('[t0] the instruction preamble is derived', () => {
      const composition = getOnePromptComposition({
        focus: 'push',
        rules: [{ path: 'a.md', content: 'r'.repeat(10) }],
        refs: [],
        conversation: [],
        targets: [],
        promptHeadStatic: `${'i'.repeat(500)}## output format\nfmt\n## rules\n${'r'.repeat(10)}`,
        promptTailVariable: '',
      });

      then('the preamble is bounded by the head it was cut from', () => {
        expect(composition.inputs.instructions.chars).toBeGreaterThan(0);
        expect(composition.inputs.instructions.chars).toBeLessThanOrEqual(
          composition.cacheable.head,
        );
      });

      then('🔴 the inputs still sum to the prompt', () => {
        expect(asSummed({ composition })).toEqual(composition.chars);
      });
    });
  });

  given('[case4] the declared set of review prompt inputs', () => {
    /**
     * 🔴 one of the two clamps that make
     * `rule.require.distinguish-every-review-input` enforceable rather than
     * advisory. this one catches a row that was DECLARED and then forgotten:
     * extend the union, and this list goes red until the new input is named
     * here — the reminder to state its cache seam and to render it.
     *
     * .note = it does NOT catch an input added to the prompt with no row at all.
     *         that one is invisible to every key-set and sum assertion, and is
     *         caught by the markup bound ([case1], demonstrated in [case5]).
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

    when('[t0] the composition is measured', () => {
      const composition = getOnePromptComposition({
        focus: 'push',
        rules: [],
        refs: [],
        conversation: [],
        targets: [],
        promptHeadStatic: 'preamble\n## output format\nfmt\n## rules\n',
        promptTailVariable: 'tail',
      });

      then('every declared input carries its own row', () => {
        expect(Object.keys(composition.inputs).sort()).toEqual(
          [...declared].sort(),
        );
      });

      then('every row states its mass, its count, and its cache seam', () => {
        for (const name of declared) {
          expect(typeof composition.inputs[name].chars).toEqual('number');
          expect(typeof composition.inputs[name].count).toEqual('number');
          expect(typeof composition.inputs[name].cacheable).toEqual('boolean');
        }
      });
    });
  });

  given(
    '[case5] an input that entered the prompt with NO row of its own',
    () => {
      /**
       * 🔴 proof the markup bound bites, per `rule.require.clamp-edge-cases`.
       *
       * this is the exact shape a future author produces by accident: a new block
       * rendered into the prompt, fed by a source array nobody wired into this
       * operation. it is the one defect the census cannot survive, because the
       * figure it corrupts still LOOKS well-formed.
       */
      when('[t0] the composition is measured', () => {
        const composition = getOnePromptComposition({
          focus: 'push',
          rules: [{ path: 'a.md', content: 'r'.repeat(300) }],
          refs: [],
          conversation: [],
          targets: [{ path: 'x.ts', content: 'F'.repeat(400), diff: null }],
          promptHeadStatic: `preamble\n## output format\nfmt\n## rules\n${'r'.repeat(300)}`,
          // 🔴 the unattributed input: 5,000 chars really rendered, really paid
          //    for, and fed by no array this operation was told about
          promptTailVariable: `${'F'.repeat(400)}${'U'.repeat(5_000)}`,
        });

        then(
          '🔴 the PRODUCTION operation grades it, never merely a test',
          () => {
            // the clamp that matters: this is the shipped path, so a live run that
            // absorbed an unnamed input says so on the composition it returns,
            // rather than emits a census that reads whole (rule.forbid.failhide)
            expect(composition.attribution).toEqual('unattributed');
          },
        );

        then('🔴 and it does NOT throw — the census is not a gate', () => {
          // .why = the share is a heuristic over runtime DATA, and a corpus of
          //        many small files reads 70.8% off real tags alone
          //        (`compileReviewPrompt.test.ts [case-wide-corpus]`). a throw
          //        here kills the review rather than catches a defect
          expect(composition.chars).toBeGreaterThan(0);
        });

        then('🔴 and the grade NAMES THE FIX for whoever reads it', () => {
          // .why = the grade is the only signal for this defect, and a signal a
          //        future author cannot act on has not detected it
          //        (rule.require.errors-name-the-fix)

          // it names WHY the sum did not catch it
          expect(HINT_OF_UNATTRIBUTED).toContain('RESIDUAL');

          // 🔴 it rules the WRONG repair out FIRST — a wide corpus is the common
          //    cause, and an author sent to add a row would find no input to add
          expect(HINT_OF_UNATTRIBUTED).toContain('many SMALL files');

          // then it names the concrete next move — the four places to edit
          expect(HINT_OF_UNATTRIBUTED).toContain('PromptInputName');
          expect(HINT_OF_UNATTRIBUTED).toContain('IS_CACHEABLE');
          expect(HINT_OF_UNATTRIBUTED).toContain('SECTION_OF_INPUT');
          expect(HINT_OF_UNATTRIBUTED).toContain(
            'rule.require.distinguish-every-review-input',
          );
        });

        then('the share it graded on is really past the bound', () => {
          const share = composition.inputs.markup.chars / composition.chars;
          expect(share).toBeGreaterThanOrEqual(BOUND_OF_MARKUP_SHARE);
        });

        then(
          '🔴 the sum invariant stays green THROUGH the defect, and so proves naught',
          () => {
            // the whole reason a grade was owed. the rows sum to `chars` exactly,
            // with 5,000 unattributed chars inside them — a census that reads
            // perfectly well-formed while it hides a whole input
            expect(asSummed({ composition })).toEqual(composition.chars);

            // the unattributed chars landed whole in the residual — which is what
            // makes the share read, and what the sum above cannot see
            expect(composition.inputs.markup.chars).toBeGreaterThanOrEqual(
              5_000,
            );
          },
        );
      });
    },
  );

  given('[case6] a corpus of new, edited, and deleted targets', () => {
    /**
     * 🔴 the FOURTH obligation: measure what the renderer SENT, never what the
     * caller HELD.
     *
     * a new file's `<target.diff>` and its `<target.file>` carry the same bytes,
     * so the renderer sends the body ONCE and drops the diff. a census that sums
     * every `.diff` on the source array counts mass the prompt never carried.
     *
     * the failure runs the OPPOSITE direction from [case5]: the residual goes
     * NEGATIVE rather than large, so the markup-share bound cannot see it — and
     * the sum assertion stays green through both. hence a bound in each
     * direction (rule.require.distinguish-every-review-input).
     */
    const targets = [
      {
        path: 'new.ts',
        content: 'N'.repeat(400),
        // a new file's diff is its body plus a `+` per line and a preamble —
        // strictly larger, and never sent
        diff: 'N'.repeat(530),
        changeKind: 'new' as const,
      },
      {
        path: 'edited.ts',
        content: 'E'.repeat(300),
        diff: 'E'.repeat(60),
        changeKind: 'edited' as const,
      },
      {
        path: 'gone.ts',
        content: null,
        diff: 'G'.repeat(90),
        changeKind: 'deleted' as const,
      },
    ];

    when('[t0] the composition is measured', () => {
      const composition = getOnePromptComposition({
        focus: 'push',
        rules: [{ path: 'a.md', content: 'r'.repeat(100) }],
        refs: [],
        conversation: [],
        targets,
        promptHeadStatic: `preamble\n## output format\nfmt\n## rules\n${'r'.repeat(100)}`,
        // exactly what the renderer sends: both bodies, and the EDITED diff only
        promptTailVariable: `${'E'.repeat(60)}${'N'.repeat(400)}${'E'.repeat(300)}`,
      });

      then(
        '🔴 a NEW target is an ADDITION — its body, once, never its diff',
        () => {
          expect(composition.inputs['targetDiffs.additions'].chars).toEqual(
            400,
          );
          expect(composition.inputs['targetDiffs.additions'].count).toEqual(1);
        },
      );

      then('an EDITED target is a mutation, beside its file body', () => {
        expect(composition.inputs['targetDiffs.mutations'].chars).toEqual(60);
        expect(composition.inputs['targetDiffs.mutations'].count).toEqual(1);
        expect(composition.inputs.targetFiles.count).toEqual(1);
        expect(composition.inputs.targetFiles.chars).toEqual(300);
      });

      then('a DELETED target is a deletion of no chars', () => {
        expect(composition.inputs['targetDiffs.deletions'].count).toEqual(1);
        expect(composition.inputs['targetDiffs.deletions'].chars).toEqual(0);
      });

      then('🔴 the residual stays NON-NEGATIVE', () => {
        // the detector for a counted-but-unsent input. had the census summed
        // every `.diff`, markup would read −530 here and the sum would still pass
        expect(getOneAttributionGrade({ composition })).toEqual('attributed');
      });

      then('🔴 the inputs still sum to the prompt', () => {
        expect(asSummed({ composition })).toEqual(composition.chars);
      });

      then('the census renders as a reviewable table', () => {
        // .why = a snapshot so a reviewer can eyeball the attribution in the PR
        //        diff, rather than re-derive it from eight assertions
        expect(composition.inputs.rules.chars).toEqual(100);
        expect(composition.inputs.rules.count).toEqual(1);
        expect(composition).toMatchSnapshot();
      });
    });
  });

  given('[case7] a PULL-focus prompt, where no target payload is sent', () => {
    /**
     * 🔴 the fourth obligation at the coarsest grain, and the one the per-target
     * `isTargetDiffSent` extraction did not reach.
     *
     * in `pull` focus the renderer injects a PATH LIST and no payload at all —
     * the brain opens the files itself. so a census that sums every target's
     * `.content` counts a payload the prompt never carried, the named rows sum
     * ABOVE `chars`, and `markup` — the residual — goes deeply NEGATIVE.
     *
     * the sum assertion stays green through it, because `markup` is the residual.
     * only the negative-residual detector bites (rule.require.clamp-edge-cases).
     */
    const targets = [
      { path: 'x.ts', content: 'F'.repeat(4_000), diff: 'D'.repeat(600) },
      { path: 'y.ts', content: 'F'.repeat(3_000), diff: 'D'.repeat(400) },
    ];

    when('[t0] the composition is measured', () => {
      const composition = getOnePromptComposition({
        focus: 'pull',
        rules: [{ path: 'a.md', content: 'r'.repeat(300) }],
        refs: [],
        conversation: [],
        targets,
        promptHeadStatic: `preamble\n## output format\nfmt\n## rules\n${'r'.repeat(300)}`,
        // exactly what a pull render sends: the paths, and not one payload byte
        promptTailVariable: '- x.ts\n- y.ts',
      });

      then('🔴 neither target row counts a byte the prompt never sent', () => {
        expect(composition.inputs.targetFiles.chars).toEqual(0);
        expect(composition.inputs['targetDiffs.mutations'].chars).toEqual(0);
      });

      then('🔴 neither target row counts a FILE the prompt never sent', () => {
        // the count is read as "how many files fed this row", so a nil row that
        // still claims 2 files reports an average of 0 chars per file — a figure
        // that reads as a measurement and is an artifact of the disagreement
        expect(composition.inputs.targetFiles.count).toEqual(0);
        expect(composition.inputs['targetDiffs.mutations'].count).toEqual(0);
      });

      then('🔴 the residual stays NON-NEGATIVE', () => {
        // the detector. had the census summed the source arrays regardless of
        // focus, markup would read −8,000 here and the sum would still pass
        expect(getOneAttributionGrade({ composition })).toEqual('attributed');
      });

      then('🔴 the inputs still sum to the prompt', () => {
        expect(asSummed({ composition })).toEqual(composition.chars);
      });

      then('the rubric is still counted — pull sends the rules in full', () => {
        // the bound is on the TARGET payload alone. a pull prompt still carries
        // its whole rubric, so a census that zeroed each row would be as wrong
        expect(composition.inputs.rules.chars).toEqual(300);
      });
    });
  });

  given('[case9] a lane whose supplies are tiny beside its scaffold', () => {
    /**
     * 🔴 the FALSE POSITIVE the markup share reads, and the reason it carries a
     * second floor. this is not a forged fixture — it is the shape a real
     * `compileReviewPrompt` run takes when the rubric is one short file.
     *
     * markup scales with the BLOCK COUNT (a tag, a header, and a `---` per
     * block); an unattributed input scales with the CORPUS. so a supplies-light
     * lane reads a high share off constant decoration, and a bound on share
     * alone cannot tell the two apart.
     *
     * measured 2026-09-21 from `compileReviewPrompt.test.ts
     * [case-conversation]`: 5,276 prompt chars, 789 markup chars = 15.0%, over
     * a 10% bound — and every one of those 789 chars is a real tag.
     */
    when('[t0] the composition is measured', () => {
      const composition = getOnePromptComposition({
        focus: 'push',
        // a six-char rubric and a four-char target, as the real fixture has
        rules: [{ path: 'r.md', content: 'r'.repeat(6) }],
        refs: [{ path: 'f.md', content: 'f'.repeat(16) }],
        conversation: [
          { path: 'a.md', content: 'c'.repeat(17) },
          { path: 'b.md', content: 'c'.repeat(17) },
        ],
        targets: [{ path: 'x.ts', content: 'F'.repeat(4), diff: null }],
        // the compiler's own scaffold dwarfs the supplies — 4,427 of 5,276
        promptHeadStatic: `${'i'.repeat(2_756)}## output format\n${'o'.repeat(1_655)}## rules\n${'r'.repeat(6)}${'f'.repeat(16)}`,
        promptTailVariable: `${'m'.repeat(789)}${'c'.repeat(34)}${'F'.repeat(4)}`,
      });

      then(
        '🔴 it grades ATTRIBUTED — 789 chars of tags is not an input',
        () => {
          // the share reads 15%, over the bound. the second floor is what keeps
          // this lane's census trusted rather than doubted at every round
          expect(composition.attribution).toEqual('attributed');
        },
      );

      then('and the high share is real, so the floor is what saved it', () => {
        const share = composition.inputs.markup.chars / composition.chars;

        // 🔴 the clamp on the clamp: if this share ever drops below the bound,
        // the case has stopped to exercise the false positive it was written for
        expect(share).toBeGreaterThan(BOUND_OF_MARKUP_SHARE);
        expect(composition.inputs.markup.chars).toBeLessThan(2_000);
      });
    });
  });

  given('[case8] a head the census cannot cut into its rows', () => {
    /**
     * 🔴 the head rows are an OFFSET cut, and an offset cut has two failure
     * modes the old reader answered with the SAME silent `0`:
     *
     *   - a marker is absent, so no offset exists
     *   - the markers are inverted, so the span is negative
     *
     * both produced two well-formed rows that under-reported by the whole mass
     * of the head, with no signal a cut was ever attempted. the markers are
     * compiler literals, so each is a CODE defect (rule.forbid.failhide).
     */
    when('[t0] a marker is absent from the head', () => {
      const measure = () =>
        getOnePromptComposition({
          focus: 'push',
          rules: [{ path: 'a.md', content: 'r'.repeat(300) }],
          refs: [],
          conversation: [],
          targets: [],
          // 🔴 the rubric header alone — the output-format cut has no anchor
          promptHeadStatic: `preamble\n## rules\n${'r'.repeat(300)}`,
          promptTailVariable: '',
        });

      then('🔴 it refuses, never a head silently reported as nil', () => {
        expect(measure).toThrow();
      });

      then('the refusal names the repair, and rules OUT the wrong one', () => {
        const error = getError(measure);

        // it names what the census could not do
        expect(error.message).toContain('does not carry the markers');

        // 🔴 and it steers away from the markup bound's hint, which would fire
        //    on this same input under a name that does not apply
        expect(error.message).toContain('do NOT add a row');
        expect(error.message).toContain('MARKER_OF_OUTPUT_FORMAT');
      });

      then(
        'it reports WHICH marker it found, so the gap is the diagnosis',
        () => {
          const carried = asCarriedMeasurement<{
            foundOutputFormat: boolean;
            foundRules: boolean;
          }>({ error: getError(measure) });

          expect(carried.foundOutputFormat).toEqual(false);
          expect(carried.foundRules).toEqual(true);
        },
      );
    });

    when('[t1] the markers are present but INVERTED', () => {
      const measure = () =>
        getOnePromptComposition({
          focus: 'push',
          rules: [{ path: 'a.md', content: 'r'.repeat(300) }],
          refs: [],
          conversation: [],
          targets: [],
          // 🔴 the rubric leads the output contract, so the span is negative
          promptHeadStatic: `preamble\n## rules\n${'r'.repeat(300)}\n## output format\nfmt`,
          promptTailVariable: '',
        });

      then('🔴 it refuses — the share bound could not have seen this', () => {
        // the old clamp answered a negative span with `0`, which is the same
        // answer it gave an absent marker: two causes, one silent figure
        expect(measure).toThrow();
      });

      then('the refusal names the ORDER, never an absent marker', () => {
        const error = getError(measure);
        expect(error.message).toContain('OUT OF ORDER');
        expect(error.message).not.toContain('does not carry the markers');
      });
    });

    when('[t2] the PREAMBLE quotes the rubric header', () => {
      /**
       * 🔴 the latent misattribution the offset cut carried, and the reason the
       * rubric marker is sought AFTER the output contract rather than from the
       * head's start.
       *
       * the preamble carries caller-supplied goal text. a goal that mentions
       * `## rules` sits AHEAD of the output contract, so a first-occurrence read
       * captures the cut — and `outputFormat` spans backward while the whole
       * block lands in the residual, on a head that is perfectly well-formed.
       */
      const rules = 'r'.repeat(300);
      const composition = getOnePromptComposition({
        focus: 'push',
        rules: [{ path: 'a.md', content: rules }],
        refs: [],
        conversation: [],
        targets: [],
        // the goal quotes the rubric header, 15 chars in — well ahead of the
        // real one, which follows the output contract as the compiler emits it
        promptHeadStatic: `goal: obey ## rules\n## output format\nfmt\n## rules\n${rules}`,
        promptTailVariable: '',
      });

      then('🔴 the cut takes the REAL rubric header, never the quote', () => {
        // `## output format` sits at 20 and the real `## rules` at 40, so the
        // block is 20 chars. a first-occurrence read would have spanned −5
        expect(composition.inputs.outputFormat.chars).toBeGreaterThan(0);
      });

      then('the preamble keeps the whole span ahead of the contract', () => {
        expect(composition.inputs.instructions.chars).toEqual(
          'goal: obey ## rules\n'.length,
        );
      });

      then('🔴 and the residual stays non-negative, so no row is lost', () => {
        expect(getOneAttributionGrade({ composition })).toEqual('attributed');
        expect(asSummed({ composition })).toEqual(composition.chars);
      });
    });
  });
});
