import { given, then, when } from 'test-fns';

import { MARK_OF_ABSENT, WORD_OF_ABSENT } from './asFigureHuman';
import { getOneCostLeverFigures } from './getOneCostLeverFigures';

/**
 * .what = a sample with the given prompt token total over the given run count
 * .why = only the prompt total and the divisor move the input lever
 */
const asSample = (input: {
  prompt: number;
  metered: number;
  cacheHitRate?: number | null;
}) => ({
  metered: input.metered,
  tokens: { input: input.prompt, cacheSet: 0, cacheGet: 0, output: 0 },
  cacheHitRate: input.cacheHitRate === undefined ? 0 : input.cacheHitRate,
});

describe('getOneCostLeverFigures', () => {
  given('[case1] a corpus that averaged many prompt tokens per run', () => {
    when('[t0] the input lever is rendered', () => {
      then('it reads the plural noun with separators', () => {
        const result = getOneCostLeverFigures({
          corpus: asSample({ prompt: 24_000, metered: 2 }),
          absent: MARK_OF_ABSENT,
        });
        expect(result.figures.input).toEqual('12,000 prompt tokens/run');
      });
    });
  });

  given(
    '[case2] a corpus that averaged exactly one prompt token per run',
    () => {
      when('[t0] the input lever is rendered', () => {
        then('the noun agrees with the singular figure', () => {
          const result = getOneCostLeverFigures({
            corpus: asSample({ prompt: 3, metered: 3 }),
            absent: MARK_OF_ABSENT,
          });
          expect(result.figures.input).toEqual('1 prompt token/run');
        });
      });
    },
  );

  given('[case3] a corpus with no metered run and no known rate', () => {
    when('[t0] the levers are rendered with the tree MARK', () => {
      then('both render the MARK, never zero', () => {
        const result = getOneCostLeverFigures({
          corpus: asSample({ prompt: 0, metered: 0, cacheHitRate: null }),
          absent: MARK_OF_ABSENT,
        });
        expect(result.figures.input).toEqual(MARK_OF_ABSENT);
        expect(result.figures.cache).toEqual(MARK_OF_ABSENT);
      });
    });

    when('[t1] the levers are rendered with the grove WORD', () => {
      then('both render the WORD the caller supplied', () => {
        const result = getOneCostLeverFigures({
          corpus: asSample({ prompt: 0, metered: 0, cacheHitRate: null }),
          absent: WORD_OF_ABSENT,
        });
        expect(result.figures.input).toEqual(WORD_OF_ABSENT);
        expect(result.figures.cache).toEqual(WORD_OF_ABSENT);
      });
    });
  });
});
