import { asIsoPrice } from 'iso-price';
import type { BrainSpec } from 'rhachet/brains';
import { given, then, when } from 'test-fns';

import { compileReviewPrompt } from '@src/domain.operations/review/compileReviewPrompt';
import { isTargetDiffSent } from '@src/domain.operations/review/isTargetDiffSent';

const COST_SPEC: BrainSpec['cost']['cash'] = {
  per: 'token',
  input: asIsoPrice('$0.0000001'),
  output: asIsoPrice('$0.0000003'),
  cache: { get: asIsoPrice('$0.000000025'), set: asIsoPrice('$0.00000025') },
};

/**
 * .what = compiles one prompt around a single target
 * .why = the clamp below is worth naught against a hand-written prompt. it has
 *        to read the REAL renderer and the REAL census, or it proves only that
 *        the fixture agrees with itself
 */
const compileAround = (target: {
  path: string;
  content: string | null;
  diff?: string | null;
  changeKind?: 'new' | 'edited' | 'deleted';
}) =>
  compileReviewPrompt({
    rules: [{ path: 'r.md', content: 'r'.repeat(200) }],
    refs: [],
    conversation: [],
    targets: [target],
    focus: 'push',
    goal: 'exhaustive',
    contextWindowSize: 1_000_000,
    costSpec: COST_SPEC,
  });

describe('isTargetDiffSent', () => {
  given('[case1] each change kind', () => {
    when('[t0] the decision is read', () => {
      then('an edited file with a diff sends it', () => {
        expect(
          isTargetDiffSent({
            target: { content: 'x', diff: 'd', changeKind: 'edited' },
          }),
        ).toEqual(true);
      });

      then('🔴 a new file does — as an ADDITION, its whole body', () => {
        expect(
          isTargetDiffSent({
            target: { content: 'x', diff: '+x', changeKind: 'new' },
          }),
        ).toEqual(true);
      });

      then('a deleted file does — as a DELETION, a void tag', () => {
        expect(
          isTargetDiffSent({
            target: { content: null, diff: '-x', changeKind: 'deleted' },
          }),
        ).toEqual(true);
      });

      then('a target with no diff at all does not', () => {
        expect(isTargetDiffSent({ target: { content: 'x' } })).toEqual(false);
      });

      then('an unkinded target with a diff still sends it', () => {
        // .why = a caller that never resolved the change kind keeps the prior
        //        behaviour, rather than lose its delta to a silent default
        expect(
          isTargetDiffSent({ target: { content: 'x', diff: 'd' } }),
        ).toEqual(true);
      });
    });
  });

  given('[case2] a NEW target, compiled end to end', () => {
    const body = 'F'.repeat(400);
    const compiled = compileAround({
      path: 'x.ts',
      content: body,
      // the shape git really emits for a new file: the body, `+` per line
      diff: `+${body}`,
      changeKind: 'new',
    });

    when('[t0] the prompt is rendered', () => {
      then('🔴 it arrives as an ADDITION in the diff group', () => {
        // .note = matched on the RENDERED tag, never on `<target.diff` alone —
        //         the static instructions name that tag to explain it, so the
        //         bare text is present on every prompt ever compiled
        expect(compiled.prompt).toContain('<target.diff path="x.ts" kind="+">');
      });

      then('no file-group tag carries it — the body is not sent twice', () => {
        expect(compiled.prompt).not.toContain('<target.file path="x.ts"');
      });

      then('the body is carried exactly once, with no `+` per line', () => {
        expect(compiled.prompt.split(body).length - 1).toEqual(1);
        expect(compiled.prompt).not.toContain(`+${body}`);
      });
    });

    when('[t1] the census is read', () => {
      then('🔴 additions count the body SENT, never the diff held', () => {
        // the target carries a 401-char diff; the prompt carried the 400-char body.
        // a census that summed the source diff would report a char never sent — and
        // `markup`, the residual, would go negative
        expect(
          compiled.composition.inputs['targetDiffs.additions'].chars,
        ).toEqual(400);
        expect(
          compiled.composition.inputs['targetDiffs.additions'].count,
        ).toEqual(1);
        expect(
          compiled.composition.inputs['targetDiffs.mutations'].count,
        ).toEqual(0);
        expect(compiled.composition.inputs.targetFiles.count).toEqual(0);
      });

      then('🔴 the residual absorbed no phantom', () => {
        // 🔴 NOT `markup >= 0`, which this read until it was checked. a negative
        // residual THROWS from inside `getOnePromptComposition`
        // (`getOneAttributionGrade`, `UnexpectedCodePathError`), so that assertion
        // sat BELOW a failfast that already forbids the state it named — it could
        // never fail, and its label claimed a property it did not test.
        //
        // the phantom this case exists to forbid is the 401-char diff. were it
        // absorbed into the residual rather than attributed, `markup` would carry
        // at least its mass — so the bound IS the diff's own length, and it fails
        // the moment the mass reappears anywhere unnamed.
        expect(compiled.composition.inputs.markup.chars).toBeLessThan(
          `+${body}`.length,
        );
      });

      then('the rows still sum to the prompt', () => {
        const summed = Object.values(compiled.composition.inputs).reduce(
          (sum, one) => sum + one.chars,
          0,
        );
        expect(summed).toEqual(compiled.composition.chars);
      });
    });
  });

  given('[case3] an EDITED target, compiled end to end', () => {
    const body = 'F'.repeat(400);
    const diff = 'D'.repeat(60);
    const compiled = compileAround({
      path: 'x.ts',
      content: body,
      diff,
      changeKind: 'edited',
    });

    when('[t0] the prompt is rendered', () => {
      then('the diff block reaches it — a real delta earns its place', () => {
        expect(compiled.prompt).toContain('<target.diff path="x.ts" kind="~">');
        expect(compiled.prompt).toContain(diff);
      });

      then('the file tag carries no change attribute', () => {
        expect(compiled.prompt).toContain('<target.file path="x.ts">');
      });
    });

    when('[t1] the census is read', () => {
      then('mutations count the delta it sent', () => {
        expect(
          compiled.composition.inputs['targetDiffs.mutations'].chars,
        ).toEqual(60);
        expect(
          compiled.composition.inputs['targetDiffs.mutations'].count,
        ).toEqual(1);
        expect(
          compiled.composition.inputs['targetDiffs.additions'].count,
        ).toEqual(0);
      });

      then(
        'the rows still sum to the prompt, with the delta attributed',
        () => {
          // NOT `markup >= 0` — that sits below the failfast in
          // `getOneAttributionGrade` and cannot fail ([case2][t1] says why). the sum
          // is what attribution governs: a sent delta miscounted anywhere breaks it
          const summed = Object.values(compiled.composition.inputs).reduce(
            (sum, one) => sum + one.chars,
            0,
          );
          expect(summed).toEqual(compiled.composition.chars);
        },
      );
    });
  });

  given('[case5] an UNKINDED target with a diff, compiled end to end', () => {
    // .why = a caller that never resolved the change kind still sends its diff ([case1]).
    //        the render must then mark it as a mutation — never drop the `kind` attribute,
    //        and never guess `+` or `-` for a file it knows naught about
    const body = 'U'.repeat(300);
    const diff = 'E'.repeat(50);
    const compiled = compileAround({ path: 'u.ts', content: body, diff });

    when('[t0] the prompt is rendered', () => {
      then('🔴 the diff arrives marked `kind="~"`, a mutation', () => {
        expect(compiled.prompt).toContain('<target.diff path="u.ts" kind="~">');
        expect(compiled.prompt).not.toContain('<target.diff path="u.ts">');
      });

      then('the body still rides in the file group beside it', () => {
        expect(compiled.prompt).toContain('<target.file path="u.ts">');
      });
    });

    when('[t1] the census is read', () => {
      // .note = the composition rows key off the target's resolved kind, not the rendered
      //         opener, so this pair stays green when only the glyph is wrong. [t0] is the
      //         assertion that bites on the glyph; this pair pins the census half
      then('the delta counts as a mutation, not an addition', () => {
        expect(
          compiled.composition.inputs['targetDiffs.mutations'].chars,
        ).toEqual(50);
        expect(
          compiled.composition.inputs['targetDiffs.additions'].count,
        ).toEqual(0);
      });

      then('the rows still sum to the prompt', () => {
        const summed = Object.values(compiled.composition.inputs).reduce(
          (sum, one) => sum + one.chars,
          0,
        );
        expect(summed).toEqual(compiled.composition.chars);
      });
    });
  });

  given('[case4] a DELETED target, compiled end to end', () => {
    const compiled = compileAround({
      path: 'gone.ts',
      content: null,
      diff: `-${'G'.repeat(90)}`,
      changeKind: 'deleted',
    });

    when('[t0] the prompt is rendered', () => {
      then('🔴 it arrives as a DELETION — a void tag in the diff group', () => {
        expect(compiled.prompt).toContain(
          '<target.diff path="gone.ts" kind="-" />',
        );
        expect(compiled.prompt).not.toContain('<target.file path="gone.ts"');
      });

      then('the removed lines are not sent', () => {
        expect(compiled.prompt).not.toContain('G'.repeat(90));
      });
    });

    when('[t1] the census is read', () => {
      then('a deletion counts one target and no chars', () => {
        expect(
          compiled.composition.inputs['targetDiffs.deletions'].count,
        ).toEqual(1);
        expect(
          compiled.composition.inputs['targetDiffs.deletions'].chars,
        ).toEqual(0);
      });

      then('the rows still sum to the prompt', () => {
        const summed = Object.values(compiled.composition.inputs).reduce(
          (sum, one) => sum + one.chars,
          0,
        );
        expect(summed).toEqual(compiled.composition.chars);
      });
    });
  });
});
