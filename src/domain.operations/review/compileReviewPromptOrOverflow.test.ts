import { asIsoPrice } from 'iso-price';
import type { BrainSpec } from 'rhachet/brains';
import { given, then, when } from 'test-fns';

import { compileReviewPromptOrOverflow } from '@src/domain.operations/review/compileReviewPromptOrOverflow';
import { ReviewContextOverflowError } from '@src/domain.operations/review/ReviewContextOverflowError';

const COST_SPEC: BrainSpec['cost']['cash'] = {
  per: 'token',
  input: asIsoPrice('$0.0000001'),
  output: asIsoPrice('$0.0000003'),
  cache: { get: asIsoPrice('$0.000000025'), set: asIsoPrice('$0.00000025') },
};

/**
 * .what = compiles around one target, against a given context window
 * .why = the window is the one input that decides compile vs overflow
 */
const compileWithin = (input: { contextWindowSize: number }) =>
  compileReviewPromptOrOverflow({
    prompt: {
      rules: [{ path: 'r.md', content: 'r'.repeat(200) }],
      refs: [],
      conversation: [],
      targets: [{ path: 't.ts', content: 't'.repeat(2_000) }],
      focus: 'push',
      goal: 'exhaustive',
      contextWindowSize: input.contextWindowSize,
      costSpec: COST_SPEC,
    },
  });

describe('compileReviewPromptOrOverflow', () => {
  given('[case1] a prompt that fits its window', () => {
    when('[t0] it is compiled', () => {
      then('it returns the compiled prompt, and no overflow', () => {
        const result = compileWithin({ contextWindowSize: 1_000_000 });
        expect(result.overflow).toEqual(null);
        expect(result.compiled?.prompt).toContain('t.ts');
        expect(result.compiled?.tokenEstimate).toBeGreaterThan(0);
      });
    });
  });

  given('[case2] a prompt that overruns its window', () => {
    when('[t0] it is compiled', () => {
      then(
        'it returns the overflow as data, with its figures and composition',
        () => {
          const result = compileWithin({ contextWindowSize: 100 });
          expect(result.compiled).toEqual(null);
          expect(result.overflow).toBeInstanceOf(ReviewContextOverflowError);

          // 🔴 the composition measured at the gate rides the overflow, so the refusal
          // can draw the split by named input and pick the lever from it
          expect(
            result.overflow?.composition.inputs.targetFiles.chars,
          ).toBeGreaterThan(0);
          expect(result.overflow?.figures.percentOfWindow).toBeGreaterThan(75);
        },
      );
    });
  });
});
