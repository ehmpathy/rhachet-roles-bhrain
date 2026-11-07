import { given, then, when } from 'test-fns';

import { asPrefixVerdictLeafOfBrain } from './asPrefixVerdictLeafOfBrain';
import { getOnePrefixVerdictRollup } from './getOnePrefixVerdictRollup';

const ROLLUP_OF_ONE_LAPSE = {
  ...getOnePrefixVerdictRollup({ pairs: [] }),
  pairs: 2,
  served: 1,
  lapsed: 1,
};

describe('asPrefixVerdictLeafOfBrain', () => {
  given('[case1] a brain with a rollup of its own', () => {
    when('[t0] its leaf renders', () => {
      const leaf = asPrefixVerdictLeafOfBrain({
        byBrain: [
          { brain: 'openrouter/deepseek/flash', verdicts: ROLLUP_OF_ONE_LAPSE },
        ],
        brain: 'openrouter/deepseek/flash',
        absent: '—',
      });

      then('it renders that brain verdicts under the pairs label', () => {
        expect(leaf.startsWith('pairs: ')).toBe(true);
        expect(leaf).toContain('1 served');
        expect(leaf).toContain('🟡 1 lapsed');
      });
    });
  });

  given('[case2] a brain that ran no reviewer twice', () => {
    when('[t0] its leaf renders', () => {
      const leaf = asPrefixVerdictLeafOfBrain({
        byBrain: [
          { brain: 'openrouter/deepseek/flash', verdicts: ROLLUP_OF_ONE_LAPSE },
        ],
        brain: 'openrouter/qwen/coder',
        absent: '—',
      });

      then(
        'it renders as the empty rollup does, never as another brain',
        () => {
          expect(leaf).toEqual('pairs: —  (no reviewer ran twice)');
        },
      );
    });
  });
});
